import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import sharp from 'sharp'
import { plannedFilename } from '../shared/naming.ts'
import { defaultSettings, validateSettings } from '../shared/advanced-settings.ts'
import { createEncoder, createPreview, writeNamedOutput } from '../electron/conversion.ts'
import { createSettingsStore } from '../electron/settings-store.ts'

async function fixture(t) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'forma-marca-'))
  t.after(() => fs.rm(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 }))
  const input = path.join(dir, 'foto.png')
  const logo = path.join(dir, 'logo.png')
  await sharp({ create: { width: 100, height: 80, channels: 3, background: 'white' } }).png().toFile(input)
  await sharp({ create: { width: 20, height: 10, channels: 4, background: 'red' } }).png().toFile(logo)
  return { dir, input, logo }
}

test('los nombres conservan prefijo, sufijo y secuencia según el orden de la cola', () => {
  const settings = defaultSettings()
  settings.naming = { ...settings.naming, enabled: true, prefix: 'catalogo-', suffix: '-web', numbered: true, start: 7, padding: 3 }
  assert.equal(plannedFilename('C:\\Fotos\\arbol.jpg', settings, 0), 'catalogo-arbol-007-web.webp')
  assert.equal(plannedFilename('/fotos/casa.png', settings, 1), 'catalogo-casa-008-web.webp')
  settings.naming.keepOriginalName = false
  assert.equal(plannedFilename('/fotos/casa.png', settings, 1), 'catalogo-008-web.webp')
  settings.naming.enabled = false
  assert.equal(plannedFilename('/fotos/casa.png', settings, 1), 'casa-converted.webp')
})

test('rechaza rutas inyectadas, nombres reservados y opciones incompletas', () => {
  const settings = defaultSettings()
  for (const naming of [{ prefix: '../' }, { suffix: 'a:b' }, { start: -1 }, { padding: 10 }, { enabled: true, keepOriginalName: false, numbered: false }]) {
    assert.throws(() => validateSettings({ ...settings, naming: { ...settings.naming, ...naming } }))
  }
  const renamed = { ...settings, naming: { ...settings.naming, enabled: true } }
  assert.throws(() => plannedFilename('/CON.jpg', renamed, 0), /Windows/)
  assert.throws(() => plannedFilename('/' + 'muy-largo'.repeat(40) + '.png', renamed, 0), /240/)
  for (const watermark of [{ mode: 'text', text: '' }, { mode: 'image', imagePath: 'relativa.png' }, { opacity: 101 }, { color: '<svg>' }, { margin: -1 }]) {
    assert.throws(() => validateSettings({ ...settings, watermark: { ...settings.watermark, ...watermark } }))
  }
})

test('aplica imagen en las cinco posiciones y respeta margen y opacidad', async t => {
  const { input, logo } = await fixture(t)
  const defaults = defaultSettings()
  for (const [position, point] of [['top-left', [5, 5]], ['top-right', [75, 5]], ['bottom-left', [5, 65]], ['bottom-right', [75, 65]], ['center', [40, 35]]]) {
    const settings = { ...defaults, format: 'png', watermark: { ...defaults.watermark, mode: 'image', imagePath: logo, size: 20, margin: 5, position, opacity: 50 } }
    const encoder = await createEncoder(input, settings)
    const image = await sharp(await encoder.toBuffer()).removeAlpha().raw().toBuffer({ resolveWithObject: true })
    const offset = (point[1] * image.info.width + point[0]) * image.info.channels
    assert.equal(image.data[offset], 255)
    assert.ok(image.data[offset + 1] >= 126 && image.data[offset + 1] <= 129)
    assert.ok(image.data[offset + 2] >= 126 && image.data[offset + 2] <= 129)
  }
})

test('el texto acepta caracteres especiales sin interpretar etiquetas y la opacidad cero no altera la imagen', async t => {
  const { input } = await fixture(t)
  const settings = defaultSettings()
  settings.format = 'png'
  settings.watermark = { ...settings.watermark, mode: 'text', text: '© <Forma & "Arte">', color: '#000000', opacity: 100, margin: 0, size: 80, position: 'center' }
  const marked = await (await createEncoder(input, settings)).toBuffer()
  const pixels = await sharp(marked).removeAlpha().raw().toBuffer()
  assert.ok(pixels.some(value => value < 200))
  settings.watermark.opacity = 0
  const unchanged = await sharp(await (await createEncoder(input, settings)).toBuffer()).removeAlpha().raw().toBuffer()
  assert.ok(unchanged.every(value => value === 255))
})

test('la vista previa coincide con el resultado y no escribe archivos', async t => {
  const { dir, input, logo } = await fixture(t)
  const settings = defaultSettings()
  settings.format = 'png'
  settings.resize = { ...settings.resize, mode: 'width', width: 50 }
  settings.naming = { ...settings.naming, enabled: true, numbered: true }
  settings.watermark = { ...settings.watermark, mode: 'image', imagePath: logo, opacity: 100, margin: 2 }
  const before = await fs.readdir(dir)
  const preview = await createPreview(input, settings, 2)
  const expected = await (await createEncoder(input, settings)).toBuffer()
  const actual = Buffer.from(preview.dataUrl.split(',')[1], 'base64')
  assert.equal(preview.filename, 'foto-003.png')
  assert.deepEqual([preview.width, preview.height], [50, 40])
  assert.deepEqual(await sharp(actual).raw().toBuffer(), await sharp(expected).raw().toBuffer())
  assert.deepEqual(await fs.readdir(dir), before)
})

test('conserva el final de textos largos y los acentos en conversión y vista previa', async t => {
  const { dir } = await fixture(t)
  const input = path.join(dir, 'texto-largo.png')
  await sharp({ create: { width: 1600, height: 500, channels: 3, background: 'white' } }).png().toFile(input)
  const settings = defaultSettings(); settings.format = 'png'
  settings.watermark = { ...settings.watermark, mode: 'text', text: 'W'.repeat(70) + ' Ágj', color: '#000000', opacity: 100, size: 80, margin: 10, position: 'center' }
  const first = await (await createEncoder(input, settings)).toBuffer()
  settings.watermark.text = 'W'.repeat(70) + ' Ñpq'
  const second = await (await createEncoder(input, settings)).toBuffer()
  assert.notDeepEqual(await sharp(first).raw().toBuffer(), await sharp(second).raw().toBuffer(), 'Changing the trailing text must change the rendered watermark')
  const preview = await createPreview(input, settings, 0)
  const previewImage = Buffer.from(preview.dataUrl.split(',')[1], 'base64')
  const expected = await sharp(second).resize({ width: 640, height: 480, fit: 'inside', withoutEnlargement: true }).png().toBuffer()
  assert.deepEqual(await sharp(previewImage).raw().toBuffer(), await sharp(expected).raw().toBuffer())
})

test('los nombres personalizados se reservan sin sobrescribir resultados concurrentes', async t => {
  const { dir, input } = await fixture(t)
  await fs.writeFile(path.join(dir, 'catalogo-001.png'), 'conservar')
  const settings = defaultSettings(); settings.format = 'png'
  const outputs = await Promise.all(Array.from({ length: 4 }, async () => writeNamedOutput(await createEncoder(input, settings), dir, 'catalogo-001.png')))
  assert.equal(new Set(outputs).size, 4)
  assert.equal(await fs.readFile(path.join(dir, 'catalogo-001.png'), 'utf8'), 'conservar')
})

test('los ajustes antiguos se completan con opciones neutras y los nuevos conservan marca y renombrado', async t => {
  const { dir, logo } = await fixture(t)
  const legacy = defaultSettings()
  delete legacy.naming; delete legacy.watermark
  const normalized = validateSettings(legacy)
  assert.equal(normalized.naming.enabled, false)
  assert.equal(normalized.watermark.mode, 'none')
  const settings = defaultSettings()
  settings.naming = { ...settings.naming, enabled: true, prefix: 'marca-' }
  settings.watermark = { ...settings.watermark, mode: 'image', imagePath: logo }
  const file = path.join(dir, 'ajustes.json')
  await createSettingsStore(file).savePreset({ name: 'Mi marca', settings })
  const restored = (await createSettingsStore(file).load()).presets[0].settings
  assert.deepEqual(restored.naming, settings.naming)
  assert.deepEqual(restored.watermark, settings.watermark)
})

test('rechaza marcas en GIF animados sin descartar silenciosamente la animación', async t => {
  const { dir } = await fixture(t)
  const frames = await Promise.all(['red', 'blue'].map(background => sharp({ create: { width: 20, height: 20, channels: 3, background } }).png().toBuffer()))
  const input = path.join(dir, 'animado.gif')
  await sharp(frames, { join: { animated: true } }).gif({ delay: [100, 100] }).toFile(input)
  const settings = defaultSettings(); settings.format = 'gif'
  settings.watermark.mode = 'text'
  await assert.rejects(createEncoder(input, settings), /GIF animados/)
  settings.watermark.mode = 'none'
  const output = await (await createEncoder(input, settings)).toBuffer()
  assert.equal((await sharp(output, { animated: true }).metadata()).pages, 2)
  await fs.rename(input, path.join(dir, 'original-renombrado.gif'))
})

test('las marcas se adaptan a imágenes diminutas y detectan un recurso que ya no existe', async t => {
  const { dir, input, logo } = await fixture(t)
  const settings = defaultSettings(); settings.format = 'png'
  settings.resize = { ...settings.resize, mode: 'width', width: 1 }
  settings.watermark = { ...settings.watermark, mode: 'image', imagePath: logo, margin: 500, size: 80 }
  const metadata = await sharp(await (await createEncoder(input, settings)).toBuffer()).metadata()
  assert.deepEqual([metadata.width, metadata.height], [1, 1])
  settings.watermark.imagePath = path.join(dir, 'no-existe.png')
  await assert.rejects(createEncoder(input, settings), error => error.code === 'ENOENT')
})
