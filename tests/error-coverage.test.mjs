import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { toolMessage } from '../shared/tool-errors.ts'

// Every message thrown across IPC must read well in both languages instead of
// falling back to the generic "operation failed" text.
const sources = ['electron/conversion.ts', 'electron/folder-watcher.ts', 'electron/main.ts', 'electron/watermark.ts', 'electron/image-input.ts', 'electron/heic.ts',
  'electron/documents.ts', 'shared/advanced-settings.ts', 'shared/naming.ts', 'electron/settings-store.ts', 'electron/files.ts', 'electron/jxl-input.ts', 'electron/jpeg-xl.ts']
const internal = new Set(['Untrusted IPC sender'])

test('todos los errores propios tienen traducción al español y al inglés', async () => {
  const missing = []
  for (const file of sources) {
    const text = await fs.readFile(new URL(`../${file}`, import.meta.url), 'utf8')
    for (const [, quote, message] of text.matchAll(/new Error\((['`])((?:(?!\1).)*)\1\)/g)) {
      if (internal.has(message) || message.includes('${')) continue
      for (const language of ['es', 'en']) {
        const shown = toolMessage(new Error(message), language)
        if (/^(No se pudo completar la operación|The operation failed)/.test(shown)) missing.push(`${language}: ${message}`)
      }
    }
  }
  assert.deepEqual(missing, [])
})
