import fs from 'node:fs/promises'
import path from 'node:path'

// Exclusive creation reserves the name even when several workers share a basename.
export async function reserveOutput(directory: string, base: string, extension: string): Promise<string> {
  for (let suffix = 1; ; suffix++) {
    const output = path.join(directory, `${base}-converted${suffix === 1 ? '' : `-${suffix}`}.${extension}`)
    try {
      const handle = await fs.open(output, 'wx')
      await handle.close()
      return output
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error
    }
  }
}
