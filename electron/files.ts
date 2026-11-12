import fs from 'node:fs/promises'
import path from 'node:path'

const supportedInputs = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.tif', '.tiff', '.gif', '.bmp', '.svg', '.heic', '.heif'])
export { supportedInputs }

export async function collectImageEntries(paths: string[], control: { cancelled?: () => boolean; onError?: (file: string, error: unknown) => void } = {}) {
  const images = new Map<string, { path: string; sourceRoot: string }>()
  const visited = new Set<string>()
  const pending: { path: string; sourceRoot?: string }[] = paths.map(file => ({ path: file }))
  while (pending.length) {
    if (control.cancelled?.()) break
    const current = pending.pop()!
    try {
      const info = await fs.stat(current.path)
      if (info.isDirectory()) {
        const real = await fs.realpath(current.path)
        const key = process.platform === 'win32' ? real.toLowerCase() : real
        if (visited.has(key)) continue
        visited.add(key)
        const sourceRoot = current.sourceRoot ?? current.path
        for (const entry of await fs.readdir(current.path, { withFileTypes: true })) {
          if (entry.isDirectory() || entry.isFile()) pending.push({ path: path.join(current.path, entry.name), sourceRoot })
        }
      } else if (info.isFile() && supportedInputs.has(path.extname(current.path).toLowerCase())) {
        const key = process.platform === 'win32' ? current.path.toLowerCase() : current.path
        if (!images.has(key)) images.set(key, { path: current.path, sourceRoot: current.sourceRoot ?? path.dirname(current.path) })
      }
    } catch (error) { control.onError?.(current.path, error) }
  }
  return [...images.values()]
}
