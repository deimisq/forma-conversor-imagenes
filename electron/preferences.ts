import fs from 'node:fs/promises'
import path from 'node:path'
import { defaultLanguage, isLanguage, type Language } from '../shared/locale'

export async function readLanguage(directory: string): Promise<Language> {
  try {
    const preferences = JSON.parse(await fs.readFile(path.join(directory, 'preferences.json'), 'utf8'))
    return isLanguage(preferences?.language) ? preferences.language : defaultLanguage
  } catch {
    return defaultLanguage
  }
}

export async function writeLanguage(directory: string, language: Language): Promise<void> {
  if (!isLanguage(language)) throw new Error('Unsupported language')
  await fs.mkdir(directory, { recursive: true })
  const destination = path.join(directory, 'preferences.json')
  const temporary = `${destination}.tmp`
  await fs.writeFile(temporary, JSON.stringify({ language }) + '\n', 'utf8')
  await fs.rename(temporary, destination)
}
