import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import sharp from 'sharp'
import { defaultSettings, validateSettings } from '../shared/advanced-settings.ts'
import { createEncoder, createPreview } from '../electron/conversion.ts'

async function fixture(t) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'forma-controls-'))
  t.after(() => fs.rm(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 }))
  const input = path.join(dir, 'source.png')
  await sharp({ create: { width: 100, height: 50, channels: 4, background: 'red' } }).png().toFile(input)
  const settings = defaultSettings(); settings.format = 'png'
  return { dir, input, settings }
}
test('recorta o rellena un lienzo exacto sin deformar y usa el fondo elegido', async t => {
  const { input, settings } = await fixture(t)
  settings.resize = { ...settings.resize, mode: 'cover', width: 40, height: 40 }
  let output = await (await createEncoder(input, settings)).toBuffer()
  assert.deepEqual([(await sharp(output).metadata()).width, (await sharp(output).metadata()).height], [40,40])
  settings.resize.mode = 'contain'; settings.adjustments.background = '#0000ff'
  output = await (await createEncoder(input, settings)).toBuffer()
  const pixels = await sharp(output).removeAlpha().raw().toBuffer()
  assert.deepEqual([...pixels.subarray(0,3)], [0,0,255])
  assert.deepEqual([...pixels.subarray((20*40+20)*3,(20*40+20)*3+3)], [255,0,0])
})
test('el fondo JPEG sustituye transparencia y el original se conserva', async t => {
  const { input, settings } = await fixture(t)
  await sharp({ create: { width: 20, height: 20, channels: 4, background: '#00000000' } }).png().toFile(input)
  const before = await fs.readFile(input)
  settings.format = 'jpeg'; settings.quality = 100; settings.adjustments.background = '#00ff00'; settings.adjustments.jpegProgressive = true
  const output = await (await createEncoder(input, settings)).toBuffer()
  const pixel = await sharp(output).removeAlpha().raw().toBuffer()
  assert.ok(pixel[1] > 250 && pixel[0] < 5 && pixel[2] < 5)
  assert.equal((await sharp(output).metadata()).isProgressive, true)
  assert.deepEqual(await fs.readFile(input), before)
})
test('giro adicional respeta EXIF y el redimensionado usa la orientación final', async t => {
  const { dir, settings } = await fixture(t)
  const input = path.join(dir, 'oriented.jpg')
  await sharp({ create: { width: 100, height: 50, channels: 3, background: 'red' } }).withMetadata({ orientation: 6 }).jpeg().toFile(input)
  settings.adjustments.rotation = 90
  settings.resize = { ...settings.resize, mode: 'percentage', percentage: 50 }
  const metadata = await sharp(await (await createEncoder(input, settings)).toBuffer()).metadata()
  assert.deepEqual([metadata.width, metadata.height], [50,25])
  assert.equal(metadata.orientation, undefined)
})
test('espejos y escala de grises modifican píxeles, no solo metadatos', async t => {
  const { dir, settings } = await fixture(t)
  const input = path.join(dir, 'pixels.png')
  const original = Buffer.from([255,0,0, 0,255,0, 0,0,255, 255,255,255])
  await sharp(original,{raw:{width:2,height:2,channels:3}}).png().toFile(input)
  settings.adjustments.flop = true
  let pixels = await sharp(await (await createEncoder(input, settings)).toBuffer()).removeAlpha().raw().toBuffer()
  assert.deepEqual([...pixels.subarray(0,3)], [0,255,0])
  settings.adjustments.flop = false; settings.adjustments.flip = true
  pixels = await sharp(await (await createEncoder(input, settings)).toBuffer()).removeAlpha().raw().toBuffer()
  assert.deepEqual([...pixels.subarray(0,3)], [0,0,255])
  settings.adjustments.grayscale = true
  pixels = await sharp(await (await createEncoder(input, settings)).toBuffer()).toColourspace('srgb').removeAlpha().raw().toBuffer()
  for(let i=0;i<pixels.length;i+=3) assert.ok(pixels[i]===pixels[i+1] && pixels[i]===pixels[i+2])
})
test('el perfil sRGB no conserva EXIF y la vista previa informa bytes reales', async t => {
  const { dir, settings } = await fixture(t)
  const input = path.join(dir, 'metadata.jpg')
  await sharp({create:{width:40,height:20,channels:3,background:'red'}}).withExif({IFD0:{Artist:'Private author'}}).jpeg().toFile(input)
  settings.adjustments.metadata = 'color'
  const output = await (await createEncoder(input, settings)).toBuffer()
  const metadata = await sharp(output).metadata()
  assert.ok(metadata.icc?.length)
  assert.equal(metadata.exif, undefined)
  const preview = await createPreview(input, settings, 0)
  assert.equal(preview.outputBytes, output.length)
  assert.match(preview.originalDataUrl, /^data:image\/png;base64,/)
})
test('migra ajustes anteriores y rechaza opciones inseguras e incompatibles', () => {
  const legacy = defaultSettings(); delete legacy.adjustments
  assert.deepEqual(validateSettings(legacy).adjustments, defaultSettings().adjustments)
  const settings = defaultSettings()
  for(const patch of [{background:'url(file)'},{rotation:45},{flip:'yes'},{metadata:'keep-everything'}]) assert.throws(()=>validateSettings({...settings,adjustments:{...settings.adjustments,...patch}}))
  settings.adjustments.webpLossless = true; settings.target.enabled = true
  assert.throws(()=>validateSettings(settings), /WebP/)
})

test('WebP sin pérdida conserva los píxeles originales', async t => {
  const { input, settings } = await fixture(t)
  settings.format = 'webp'; settings.adjustments.webpLossless = true
  const actual = await sharp(await (await createEncoder(input, settings)).toBuffer()).ensureAlpha().raw().toBuffer()
  const expected = await sharp(input).ensureAlpha().raw().toBuffer()
  assert.deepEqual(actual, expected)
})
