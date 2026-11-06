import fs from 'node:fs/promises'
import path from 'node:path'

function versionParts(value: unknown): number[] | null {
  return typeof value === 'string' && /^\d+\.\d+\.\d+$/.test(value) ? value.split('.').map(Number) : null
}

// This independent marker survives language/settings changes and renderer reloads.
// Existing preferences identify installations predating the marker (1.2.x).
export async function consumeReleaseNotice(directory: string, version: string): Promise<boolean> {
  const current = versionParts(version)
  if (!current) throw new Error('Invalid release version')
  const destination = path.join(directory, 'release-notice.json')
  let previous: number[] | null = null
  try {
    previous = versionParts(JSON.parse(await fs.readFile(destination, 'utf8'))?.version)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT' && !(error instanceof SyntaxError)) throw error
  }
  if (previous && !current.some((part, index) => part !== previous![index])) return false
  if (previous) {
    const difference = current.findIndex((part, index) => part !== previous![index])
    // A downgrade must not re-enable a notice already consumed by a newer version.
    if (current[difference] < previous[difference]) return false
  }
  let legacyInstallation = false
  if (!previous) {
    try {
      const preferences = JSON.parse(await fs.readFile(path.join(directory, 'preferences.json'), 'utf8'))
      legacyInstallation = preferences?.language === 'es' || preferences?.language === 'en'
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT' && !(error instanceof SyntaxError)) throw error
    }
  }
  await fs.mkdir(directory, { recursive: true })
  const temporary = `${destination}.tmp`
  await fs.writeFile(temporary, JSON.stringify({ version }) + '\n', 'utf8')
  await fs.rename(temporary, destination)
  return Boolean(previous || legacyInstallation)
}
