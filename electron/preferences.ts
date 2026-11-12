import fs from 'node:fs/promises'
import path from 'node:path'
import { defaultLanguage, isLanguage, type Language } from '../shared/locale'

export async function readLanguage(directory: string, fallback: Language = defaultLanguage): Promise<Language> {
  try {
    const preferences = JSON.parse(await fs.readFile(path.join(directory, 'preferences.json'), 'utf8'))
    return isLanguage(preferences?.language) ? preferences.language : fallback
  } catch {
    return fallback
  }
}

export type ConversionPreferences = { format: 'jpeg' | 'png' | 'webp' | 'avif' | 'tiff' | 'gif'; quality: number; outputDir: string }

export function validConversionPreferences(value: unknown): value is ConversionPreferences {
  if (!value || typeof value !== 'object') return false
  const item = value as ConversionPreferences
  return ['jpeg', 'png', 'webp', 'avif', 'tiff', 'gif'].includes(item.format) && Number.isInteger(item.quality) && item.quality >= 1 && item.quality <= 100 && typeof item.outputDir === 'string' && (!item.outputDir || path.isAbsolute(item.outputDir))
}

export async function readConversionPreferences(directory: string): Promise<ConversionPreferences | null> {
  try {
    const value = JSON.parse(await fs.readFile(path.join(directory, 'preferences.json'), 'utf8')).conversion
    return validConversionPreferences(value) ? value : null
  } catch { return null }
}

let pendingWrite: Promise<void> = Promise.resolve()
function writePreferences(directory: string, patch: object): Promise<void> {
  const operation = pendingWrite.catch(() => {}).then(async () => {
    await fs.mkdir(directory, { recursive: true })
    const destination = path.join(directory, 'preferences.json')
    let previous = {}
    try {
      const parsed = JSON.parse(await fs.readFile(destination, 'utf8'))
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) previous = parsed
    } catch { /* Recover missing or corrupt preferences. */ }
    const temporary = `${destination}.tmp`
    await fs.writeFile(temporary, JSON.stringify({ ...previous, ...patch }) + '\n', 'utf8')
    await fs.rename(temporary, destination)
  })
  pendingWrite = operation
  return operation
}

export async function writeLanguage(directory: string, language: Language): Promise<void> {
  if (!isLanguage(language)) throw new Error('Unsupported language')
  await writePreferences(directory, { language })
}

export async function writeConversionPreferences(directory: string, value: unknown): Promise<void> {
  if (!validConversionPreferences(value)) throw new Error('Invalid conversion preferences')
  await writePreferences(directory, { conversion: value })
}
