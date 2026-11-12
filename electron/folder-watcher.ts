import fs from 'node:fs/promises'
import path from 'node:path'
import type { Dirent } from 'node:fs'

export type WatchStatus = { active: boolean; processing: boolean; completed: number; failed: number; source: string; output: string; message?: string }
function within(root: string, candidate: string) {
  const relative = path.relative(root, candidate)
  return relative === '' || (relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative))
}
export async function validateWatchFolders(source: string, output: string) {
  if (!path.isAbsolute(source) || !path.isAbsolute(output) || source.includes('\0') || output.includes('\0')) throw new Error('Selecciona carpetas absolutas de origen y destino.')
  const input = await fs.realpath(source)
  if (!(await fs.stat(input)).isDirectory()) throw new Error('El origen debe ser una carpeta.')
  await fs.mkdir(output, { recursive: true })
  const destination = await fs.realpath(output)
  if (within(input, destination) || within(destination, input)) throw new Error('Las carpetas vigilada y de destino deben estar separadas, sin contenerse entre sí.')
  return { source: input, output: destination }
}

// Polling works on nested folders without platform-specific recursive fs.watch.
// Files must have a stable size and timestamp across scans before processing.
export async function startFolderWatcher(options: {
  source: string; output: string; extensions: Set<string>; includeExisting?: boolean;
  readDirectory?: (directory: string) => Promise<Dirent[]>;
  stableMs?: number; intervalMs?: number; available: () => boolean;
  process: (file: string, source: string, output: string) => Promise<void>;
  report: (status: WatchStatus) => void;
}) {
  const folders = await validateWatchFolders(options.source, options.output)
  const observed = new Map<string, { signature: string; since: number; attempted: boolean }>()
  let stopped = false
  let ticking = false
  let initialized = false
  let timer: ReturnType<typeof setTimeout> | undefined
  const state: WatchStatus = { active: true, processing: false, completed: 0, failed: 0, ...folders }
  const notify = () => options.report({ ...state })
  let lastDirectoryIssue: string | undefined
  async function scan() {
    const found = new Set<string>()
    const unreadable: string[] = []
    let directoryIssue: string | undefined
    const pending = [folders.source]
    while (pending.length && !stopped) {
      const directory = pending.pop()!
      let entries: Dirent[]
      try { entries = await (options.readDirectory ? options.readDirectory(directory) : fs.readdir(directory, { withFileTypes: true })) }
      catch {
        unreadable.push(directory)
        directoryIssue = 'No se pudo leer una carpeta vigilada. Revisa sus permisos y disponibilidad.'
        continue
      }
      for (const entry of entries) {
        if (stopped) break
        const file = path.join(directory, entry.name)
        if (entry.isDirectory()) pending.push(file)
        else if (entry.isFile() && options.extensions.has(path.extname(file).toLowerCase())) {
          found.add(file)
          let signature: string
          try { const stat = await fs.stat(file); signature = `${stat.size}:${stat.mtimeMs}`; if (!stat.size) continue }
          catch { continue }
          const prior = observed.get(file)
          if (!prior || prior.signature !== signature) {
            observed.set(file, { signature, since: Date.now(), attempted: !initialized && !options.includeExisting })
            continue
          }
          if (prior.attempted || Date.now() - prior.since < (options.stableMs ?? 2000) || !options.available()) continue
          prior.attempted = true
          state.processing = true; state.message = undefined; notify()
          try { await options.process(file, folders.source, folders.output); state.completed++ }
          catch (error) { state.failed++; state.message = error instanceof Error ? error.message : 'No se pudo convertir.' }
          finally { state.processing = false; notify() }
        }
      }
    }
    for (const file of observed.keys()) if (!found.has(file) && !unreadable.some(directory => within(directory, file))) observed.delete(file)
    if (directoryIssue) { state.message = directoryIssue; notify() }
    else if (lastDirectoryIssue && state.message === lastDirectoryIssue) { state.message = undefined; notify() }
    lastDirectoryIssue = directoryIssue
    initialized = true
  }
  async function tick() {
    if (stopped || ticking) return
    ticking = true
    try { await scan() }
    catch (error) { state.message = error instanceof Error ? error.message : 'No se pudo leer la carpeta.'; notify() }
    finally { ticking = false; if (!stopped) timer = setTimeout(() => void tick(), options.intervalMs ?? 1000) }
  }
  await scan()
  notify()
  timer = setTimeout(() => void tick(), options.intervalMs ?? 1000)
  return {
    status: () => ({ ...state }),
    stop() { stopped = true; clearTimeout(timer); state.active = false; notify() },
  }
}
