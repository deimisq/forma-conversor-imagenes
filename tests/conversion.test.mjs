import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { Readable } from 'node:stream'
import sharp from 'sharp'
import { validateConversionOptions, writeUniqueOutput } from '../electron/conversion.ts'
import { defaultSettings } from '../shared/advanced-settings.ts'

async function temp(t) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'forma-conversion-'))
  t.after(() => fs.rm(dir, { recursive: true, force: true }))
  return dir
}

test('las conversiones simultáneas conservan los archivos existentes y generan imágenes distintas', async t => {
  const dir = await temp(t)
  const existing = path.join(dir, 'photo-converted.png')
  await fs.writeFile(existing, 'existing user file')
  const outputs = await Promise.all(Array.from({ length: 12 }, (_, red) =>
    writeUniqueOutput(sharp({ create: { width: 8, height: 8, channels: 3, background: { r: red * 20, g: 0, b: 0 } } }).png(), dir, 'photo', 'png')))
  assert.equal(new Set(outputs).size, 12)
  assert.equal(await fs.readFile(existing, 'utf8'), 'existing user file')
  for (const [index, output] of outputs.entries()) {
    const pixel = await sharp(output).raw().toBuffer()
    assert.equal(pixel[0], index * 20)
    assert.equal((await sharp(output).metadata()).format, 'png')
  }
})

test('un error elimina solo el archivo parcial y permite reintentar', async t => {
  const dir = await temp(t)
  const existing = path.join(dir, 'photo-converted.png')
  await fs.writeFile(existing, 'keep')
  const broken = Readable.from((async function* () { yield Buffer.from('partial'); throw new Error('decode failed') })())
  await assert.rejects(writeUniqueOutput(broken, dir, 'photo', 'png'), /decode failed/)
  assert.deepEqual(await fs.readdir(dir), ['photo-converted.png'])
  const retry = await writeUniqueOutput(Readable.from([Buffer.from('retry')]), dir, 'photo', 'png')
  assert.equal(path.basename(retry), 'photo-converted-2.png')
  assert.equal(await fs.readFile(existing, 'utf8'), 'keep')
})

test('la validación rechaza formatos, rutas y calidad incorrectos antes de convertir', () => {
  const valid = { files: [path.resolve('photo.png')], outputDir: '', format: 'webp', quality: 84 }
  const validated = validateConversionOptions(valid)
  assert.deepEqual({ ...validated, sourceRoots: {} }, { ...defaultSettings(), ...valid, sourceRoots: {} })
  for (const override of [{ files: [] }, { files: ['relative.png'] }, { files: [null] }, { outputDir: '../outside' }, { format: '../png' }, { quality: NaN }, { quality: 101 }, { quality: 1.5 }]) {
    assert.throws(() => validateConversionOptions({ ...valid, ...override }))
  }
  for (const value of [null, undefined, 'invalid']) assert.throws(() => validateConversionOptions(value))
})


test('mantiene las posiciones originales de numeración en un reintento y rechaza secuencias inválidas', () => {
  const valid = { files: [path.resolve('retry.png')], outputDir: '', format: 'webp', quality: 84, sequence: [8] }
  assert.deepEqual(validateConversionOptions(valid).sequence, [8])
  for (const sequence of [[], [-1], [NaN], ['1'], [1, 2]]) assert.throws(() => validateConversionOptions({ ...valid, sequence }))
})
