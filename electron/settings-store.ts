import fs from 'node:fs/promises'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { defaultSettings, validateSettings } from '../shared/advanced-settings.ts'
import type { Preferences, SavedSettings } from '../shared/advanced-settings.ts'

function preferences(value: unknown): Preferences {
  const settings = validateSettings(value)
  const directory = (value as Record<string, unknown>).outputDirectory
  if (typeof directory !== 'string' || directory.includes('\0') || (directory !== '' && !path.isAbsolute(directory))) throw new Error('La carpeta guardada no es válida.')
  return { ...settings, outputDirectory: directory }
}

export function createSettingsStore(file: string) {
  let queue: Promise<unknown> = Promise.resolve()
  async function read(): Promise<SavedSettings> {
    let value
    try { value = JSON.parse(await fs.readFile(file, 'utf8')) }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return { version: 1, preferences: { ...defaultSettings(), outputDirectory: '' }, presets: [] }
      throw new Error('No se pudo leer la configuración guardada. Se conserva el archivo original.')
    }
    try {
      if (value?.version !== 1 || !Array.isArray(value.presets) || value.presets.length > 100) throw new Error()
      const ids = new Set<string>()
      const names = new Set<string>()
      const presets = value.presets.map((preset: { id: string; name: string; settings: unknown }) => {
        if (!preset || typeof preset.id !== 'string' || !preset.id || typeof preset.name !== 'string' || !preset.name.trim() || preset.name.length > 60 || ids.has(preset.id) || names.has(preset.name.trim().toLocaleLowerCase('es'))) throw new Error()
        ids.add(preset.id); names.add(preset.name.trim().toLocaleLowerCase('es'))
        return { id: preset.id, name: preset.name, settings: validateSettings(preset.settings) }
      })
      return { version: 1, preferences: preferences(value.preferences), presets }
    } catch { throw new Error('La configuración guardada no es compatible. Se conserva el archivo original.') }
  }
  function serialize<T>(operation: () => Promise<T>): Promise<T> {
    const next = queue.then(operation)
    queue = next.catch(() => {})
    return next
  }
  async function write(value: SavedSettings) {
    await fs.mkdir(path.dirname(file), { recursive: true })
    const temporary = `${file}.${randomUUID()}.tmp`
    try {
      await fs.writeFile(temporary, JSON.stringify(value, null, 2) + '\n', { flag: 'wx' })
      await fs.rename(temporary, file)
    } finally { await fs.rm(temporary, { force: true }) }
    return value
  }
  return {
    load: () => serialize(read),
    savePreferences: (value: unknown) => serialize(async () => {
      const valid = preferences(value)
      const data = await read()
      data.preferences = valid
      return write(data)
    }),
    savePreset: (value: unknown) => serialize(async () => {
      if (!value || typeof value !== 'object') throw new Error('El ajuste no es válido.')
      const preset = value as Record<string, unknown>
      if (typeof preset.name !== 'string' || !preset.name.trim() || preset.name.trim().length > 60) throw new Error('El nombre debe tener entre 1 y 60 caracteres.')
      const settings = validateSettings(preset.settings)
      const data = await read()
      const id = preset.id
      const index = id === undefined ? -1 : data.presets.findIndex(item => item.id === id)
      if (id !== undefined && index < 0) throw new Error('No se encontró el ajuste que quieres actualizar.')
      const name = preset.name.trim()
      if (data.presets.some(item => item.id !== id && item.name.toLocaleLowerCase('es') === name.toLocaleLowerCase('es'))) throw new Error('Ya existe un ajuste con ese nombre.')
      if (index < 0 && data.presets.length >= 100) throw new Error('Puedes guardar hasta 100 ajustes.')
      const saved = { id: index < 0 ? randomUUID() : data.presets[index].id, name, settings }
      if (index < 0) data.presets.push(saved)
      else data.presets[index] = saved
      return write(data)
    }),
    deletePreset: (id: unknown) => serialize(async () => {
      const data = await read()
      if (typeof id !== 'string' || !data.presets.some(item => item.id === id)) throw new Error('No se encontró el ajuste que quieres eliminar.')
      data.presets = data.presets.filter(item => item.id !== id)
      return write(data)
    }),
  }
}
