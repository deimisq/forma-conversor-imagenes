import fs from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import assert from 'node:assert/strict'

const electron = createRequire(import.meta.url)('electron')
const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'forma-desktop-test-'))
try {
  const result = spawnSync(electron, [fileURLToPath(new URL('./check-desktop.mjs', import.meta.url)), process.argv[2] ?? 'es'], {
    stdio: 'inherit', windowsHide: true,
    env: { ...process.env, FORMA_TEST_DIRECTORY: directory },
  })
  if (result.error) throw result.error
  process.exitCode = result.status ?? 1
} finally {
  // Chromium keeps profile databases open until the Electron process exits.
  assert.equal(path.dirname(directory), path.resolve(os.tmpdir()))
  assert.ok(path.basename(directory).startsWith('forma-desktop-test-'))
  await fs.rm(directory, { recursive: true, force: true, maxRetries: 20, retryDelay: 100 })
}
