import test from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import { checkStoreUpdates } from '../electron/store-updates.ts'

test('Store consulta WinRT con PowerShell oculto, sin perfil y con tiempo y salida limitados', async () => {
  let calls = 0
  const available = await checkStoreUpdates((executable, args, options, callback) => {
    calls++
    assert.equal(executable, path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe'))
    assert.deepEqual(args.slice(0, 3), ['-NoProfile', '-NonInteractive', '-EncodedCommand'])
    const script = Buffer.from(args[3], 'base64').toString('utf16le')
    assert.ok(script.includes('GetAppAndOptionalStorePackageUpdatesAsync()'))
    assert.ok(script.includes('$task.Wait(30000)'))
    assert.equal(options.windowsHide, true)
    assert.equal(options.timeout, 40000)
    assert.equal(options.maxBuffer, 65536)
    callback(null, '\uFEFF {"available":true}\r\n', '')
  })
  assert.equal(calls, 1)
  assert.equal(available, true)
  assert.equal(await checkStoreUpdates((_executable, _args, _options, callback) => callback(null, '{"available":false}', '')), false)
})

test('Store no confunde fallos de conexión, timeout o respuesta dañada con ausencia de actualizaciones', async () => {
  for (const error of [Object.assign(new Error('Offline'), { code: 'ENETUNREACH' }), Object.assign(new Error('Timeout'), { killed: true }), Object.assign(new Error('Unavailable'), { code: 'ENOENT' })]) {
    await assert.rejects(checkStoreUpdates((_executable, _args, _options, callback) => callback(error, '', '')), /No se pudo consultar Microsoft Store\./)
  }
  for (const response of ['', 'null', '[]', '{}', '{"available":"false"}', '{"available":0}', 'PowerShell failed', '{"available":']) {
    await assert.rejects(checkStoreUpdates((_executable, _args, _options, callback) => callback(null, response, '')), /No se pudo consultar Microsoft Store\./)
  }
  // An unsuccessful attempt must not poison the next query.
  assert.equal(await checkStoreUpdates((_executable, _args, _options, callback) => callback(null, '{"available":true}', '')), true)
})
