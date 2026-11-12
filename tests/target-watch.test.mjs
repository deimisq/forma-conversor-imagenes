import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { randomBytes } from 'node:crypto'
import sharp from 'sharp'
import { encodeTarget } from '../electron/conversion.ts'
import { defaultSettings, validateSettings } from '../shared/advanced-settings.ts'
import { startFolderWatcher, validateWatchFolders } from '../electron/folder-watcher.ts'

async function fixture(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'forma-v2-'))
  t.after(() => fs.rm(root, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 }))
  const source = path.join(root, 'source'), output = path.join(root, 'output')
  await fs.mkdir(source); await fs.mkdir(output)
  return { root, source, output }
}
async function until(check) {
  const deadline = Date.now() + 5000
  while (!check()) { if (Date.now() > deadline) throw new Error('Timed out waiting for folder watcher'); await new Promise(resolve => setTimeout(resolve, 15)) }
}

test('el peso objetivo cumple el límite, conserva originales y reduce dimensiones solo con permiso', async t => {
  const { source } = await fixture(t)
  const input = path.join(source, 'noise.png')
  await sharp(randomBytes(400 * 300 * 3), { raw: { width: 400, height: 300, channels: 3 } }).png().toFile(input)
  const original = await fs.readFile(input)
  const settings = defaultSettings()
  settings.format = 'jpeg'
  settings.target = { enabled: true, maxKB: 4, minQuality: 30, allowResize: false }
  await assert.rejects(encodeTarget(input, settings), /peso objetivo/)
  settings.target.allowResize = true
  const result = await encodeTarget(input, settings)
  assert.ok(result.length <= 4096)
  const metadata = await sharp(result).metadata()
  assert.ok(metadata.width < 400)
  assert.deepEqual(await fs.readFile(input), original)
})

test('el peso objetivo conserva las dimensiones si ya cumple el límite y valida opciones incompatibles', async t => {
  const { source } = await fixture(t)
  const input = path.join(source, 'image.png')
  await sharp({ create: { width: 100, height: 50, channels: 3, background: 'red' } }).png().toFile(input)
  for (const format of ['jpeg', 'webp', 'avif']) {
    const settings = { ...defaultSettings(), format, target: { enabled: true, maxKB: 20, minQuality: 30, allowResize: false } }
    const result = await encodeTarget(input, settings)
    const metadata = await sharp(result).metadata()
    assert.deepEqual([metadata.width, metadata.height], [100, 50])
    assert.ok(result.length <= 20 * 1024)
  }
  for (const patch of [{ maxKB: 0 }, { maxKB: Infinity }, { minQuality: 101 }, { minQuality: 90 }]) {
    assert.throws(() => validateSettings({ ...defaultSettings(), target: { enabled: true, maxKB: 20, minQuality: 30, allowResize: false, ...patch } }))
  }
  assert.throws(() => validateSettings({ ...defaultSettings(), format: 'png', target: { enabled: true, maxKB: 20, minQuality: 30, allowResize: false } }))
})

test('la vigilancia rechaza destinos coincidentes, anidados o que contengan el origen', async t => {
  const { root, source } = await fixture(t)
  await assert.rejects(validateWatchFolders(source, source), /separadas/)
  await assert.rejects(validateWatchFolders(source, path.join(source, 'converted')), /separadas/)
  await assert.rejects(validateWatchFolders(source, root), /separadas/)
})

test('la vigilancia espera archivos estables, omite existentes y reprocesa solo cambios nuevos', async t => {
  const { source, output } = await fixture(t)
  await fs.writeFile(path.join(source, 'existing.png'), 'old')
  const processed = []
  const watcher = await startFolderWatcher({ source, output, extensions: new Set(['.png']), stableMs: 100, intervalMs: 20, available: () => true, process: async file => { processed.push({ file, data: await fs.readFile(file, 'utf8') }) }, report: () => {} })
  t.after(() => watcher.stop())
  const input = path.join(source, 'new.png')
  await fs.writeFile(input, 'partial')
  await new Promise(resolve => setTimeout(resolve, 45))
  await fs.writeFile(input, 'complete')
  await until(() => processed.length === 1)
  assert.equal(processed[0].data, 'complete')
  assert.equal(path.basename(processed[0].file), 'new.png')
  await new Promise(resolve => setTimeout(resolve, 150))
  assert.equal(processed.length, 1)
  await fs.writeFile(input, 'modified again')
  await until(() => processed.length === 2)
  assert.equal(processed[1].data, 'modified again')
  watcher.stop()
  await fs.writeFile(path.join(source, 'after-stop.png'), 'never')
  await new Promise(resolve => setTimeout(resolve, 130))
  assert.equal(processed.length, 2)
})

test('la vigilancia procesa subcarpetas existentes si se solicita y respeta la exclusión de conversiones', async t => {
  const { source, output } = await fixture(t)
  await fs.mkdir(path.join(source, 'nested'))
  await fs.writeFile(path.join(source, 'nested', 'photo.png'), 'complete')
  let available = false
  const processed = []
  const watcher = await startFolderWatcher({ source, output, includeExisting: true, extensions: new Set(['.png']), stableMs: 30, intervalMs: 15, available: () => available, process: async file => { processed.push(file) }, report: () => {} })
  t.after(() => watcher.stop())
  await new Promise(resolve => setTimeout(resolve, 100))
  assert.equal(processed.length, 0)
  available = true
  await until(() => processed.length === 1)
  assert.equal(processed[0], await fs.realpath(path.join(source, 'nested', 'photo.png')))
})

test('detener la vigilancia durante una conversión no inicia otros archivos del mismo escaneo', async t => {
  const { source, output } = await fixture(t)
  await fs.writeFile(path.join(source, 'a.png'), 'a')
  await fs.writeFile(path.join(source, 'b.png'), 'b')
  let count = 0
  let watcher
  watcher = await startFolderWatcher({ source, output, includeExisting: true, extensions: new Set(['.png']), stableMs: 25, intervalMs: 15, available: () => true, process: async () => { count++; watcher.stop() }, report: () => {} })
  t.after(() => watcher.stop())
  await until(() => count === 1)
  await new Promise(resolve => setTimeout(resolve, 120))
  assert.equal(count, 1)
})

test('un fallo de permisos en una subcarpeta no bloquea otras ni duplica conversiones al recuperarse', async t => {
  const { source, output } = await fixture(t)
  const blocked = path.join(source, 'blocked')
  await fs.mkdir(blocked)
  await fs.writeFile(path.join(blocked, 'prior.png'), 'prior')
  let denied = false
  const processed = []
  const states = []
  const watcher = await startFolderWatcher({ source, output, includeExisting: true, extensions: new Set(['.png']), stableMs: 25, intervalMs: 15,
    available: () => true,
    readDirectory: async directory => {
      if (denied && path.basename(directory) === 'blocked') throw Object.assign(new Error('Denied'), { code: 'EACCES' })
      return fs.readdir(directory, { withFileTypes: true })
    },
    process: async file => { processed.push(path.basename(file)) },
    report: state => states.push(state),
  })
  t.after(() => watcher.stop())
  await until(() => processed.includes('prior.png'))
  denied = true
  await fs.writeFile(path.join(source, 'outside.png'), 'new')
  await until(() => processed.includes('outside.png') && states.some(state => state.message?.includes('permisos')))
  denied = false
  await until(() => !watcher.status().message)
  await new Promise(resolve => setTimeout(resolve, 150))
  assert.equal(processed.filter(name => name === 'prior.png').length, 1)
})

test('un fallo de conversión se informa una vez y se reintenta al cambiar el archivo', async t => {
  const { source, output } = await fixture(t)
  const input = path.join(source, 'broken.png')
  await fs.writeFile(input, 'broken')
  let attempts = 0
  const watcher = await startFolderWatcher({ source, output, includeExisting: true, extensions: new Set(['.png']), stableMs: 25, intervalMs: 15,
    available: () => true,
    process: async () => { attempts++; if (attempts === 1) throw new Error('No se pudo convertir.') }, report: () => {},
  })
  t.after(() => watcher.stop())
  await until(() => watcher.status().failed === 1)
  await new Promise(resolve => setTimeout(resolve, 120))
  assert.equal(attempts, 1)
  await fs.writeFile(input, 'repaired and changed')
  await until(() => watcher.status().completed === 1)
  assert.equal(attempts, 2)
  assert.equal(watcher.status().message, undefined)
})
