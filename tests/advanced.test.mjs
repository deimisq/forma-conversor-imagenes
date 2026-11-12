import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import sharp from 'sharp'
import { createEncoder, destinationDirectory, validateConversionOptions } from '../electron/conversion.ts'
import { collectImageEntries } from '../electron/files.ts'
import { defaultSettings, validateSettings } from '../shared/advanced-settings.ts'

async function temporary(t) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'forma-avanzado-'))
  t.after(() => fs.rm(dir, { recursive: true, force: true }))
  return dir
}

test('redimensiona por ancho, alto, porcentaje y límites sin recortar', async t => {
  const dir = await temporary(t)
  const input = path.join(dir, 'original.png')
  await sharp({ create: { width: 240, height: 120, channels: 4, background: '#ff000080' } }).png().toFile(input)
  const original = await fs.readFile(input)
  for (const [resize, expected] of [
    [{ mode: 'none' }, [240, 120]],
    [{ mode: 'width', width: 100 }, [100, 50]],
    [{ mode: 'height', height: 40 }, [80, 40]],
    [{ mode: 'percentage', percentage: 25 }, [60, 30]],
    [{ mode: 'bounds', width: 100, height: 100 }, [100, 50]],
    [{ mode: 'width', width: 480 }, [240, 120]],
    [{ mode: 'percentage', percentage: 200 }, [240, 120]],
    [{ mode: 'width', width: 480, allowEnlargement: true }, [480, 240]],
  ]) {
    const defaults = defaultSettings()
    const encoder = await createEncoder(input, { ...defaults, format: 'png', resize: { ...defaults.resize, ...resize } })
    const metadata = await sharp(await encoder.toBuffer()).metadata()
    assert.deepEqual([metadata.width, metadata.height], expected)
    assert.equal(metadata.hasAlpha, true)
  }
  assert.deepEqual(await fs.readFile(input), original)
})

test('el porcentaje y el ancho se aplican después de corregir la orientación EXIF', async t => {
  const dir = await temporary(t)
  const input = path.join(dir, 'orientada.jpg')
  await sharp({ create: { width: 120, height: 60, channels: 3, background: 'red' } }).jpeg().withMetadata({ orientation: 6 }).toFile(input)
  for (const [resize, expected] of [[{ mode: 'percentage', percentage: 50 }, [30, 60]], [{ mode: 'width', width: 30 }, [30, 60]]]) {
    const defaults = defaultSettings()
    const encoder = await createEncoder(input, { ...defaults, resize: { ...defaults.resize, ...resize } })
    const metadata = await sharp(await encoder.toBuffer()).metadata()
    assert.deepEqual([metadata.width, metadata.height], expected)
  }
})

test('las selecciones mixtas conservan raíces y destinos sin salir de la carpeta elegida', async t => {
  const dir = await temporary(t)
  const root = path.join(dir, 'Viaje')
  await fs.mkdir(path.join(root, 'Dia1'), { recursive: true })
  const image = path.join(root, 'Dia1', 'foto.png')
  await fs.writeFile(image, 'imagen de prueba')
  const entries = await collectImageEntries([root])
  assert.equal(entries[0].sourceRoot, root)
  const output = path.join(dir, 'Salida')
  assert.equal(destinationDirectory(output, image, root, true), path.join(output, 'Viaje', 'Dia1'))
  assert.equal(destinationDirectory(output, image, root, false), output)
  assert.equal((await collectImageEntries([image]))[0].sourceRoot, path.dirname(image))
  assert.throws(() => destinationDirectory(output, image, path.join(dir, 'Otra'), true))
  assert.throws(() => validateConversionOptions({ ...defaultSettings(), files: [image], outputDir: output, sourceRoots: { [image]: path.join(dir, 'Otra') } }))
})

test('rechaza dimensiones vacías, enormes y porcentajes inválidos', () => {
  for (const resize of [{ width: '' }, { height: 0 }, { width: 30001 }, { percentage: Infinity }, { percentage: 401 }, { mode: 'stretch' }, { allowEnlargement: 'sí' }]) {
    const defaults = defaultSettings()
    assert.throws(() => validateSettings({ ...defaults, resize: { ...defaults.resize, ...resize } }))
  }
})

test('las herramientas conservan los seis formatos de salida y aplanan la transparencia en JPEG', async t => {
  const dir = await temporary(t)
  const input = path.join(dir, 'transparente.png')
  await sharp({ create: { width: 80, height: 40, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).png().toFile(input)
  for (const format of ['jpeg', 'png', 'webp', 'avif', 'tiff', 'gif']) {
    const defaults = defaultSettings()
    const encoder = await createEncoder(input, { ...defaults, format, resize: { ...defaults.resize, mode: 'width', width: 40 } })
    const buffer = await encoder.toBuffer()
    const metadata = await sharp(buffer).metadata()
    assert.deepEqual([metadata.width, metadata.height], [40, 20])
    assert.equal(metadata.format, format === 'avif' ? 'heif' : format)
    if (format === 'jpeg') {
      assert.equal(metadata.hasAlpha, false)
      const pixel = await sharp(buffer).raw().toBuffer()
      assert.ok(pixel[0] > 250 && pixel[1] > 250 && pixel[2] > 250)
    }
  }
})


test('la búsqueda conserva errores de acceso y admite cancelación sin perder las raíces', async t => {
  const dir = await temporary(t)
  const input = path.join(dir, 'photo.png')
  await sharp({ create: { width: 2, height: 2, channels: 3, background: 'red' } }).png().toFile(input)
  const errors = []
  const entries = await collectImageEntries([input, path.join(dir, 'missing')], { onError: file => errors.push(file) })
  assert.equal(entries[0].sourceRoot, dir)
  assert.equal(errors.length, 1)
  assert.deepEqual(await collectImageEntries([dir], { cancelled: () => true }), [])
})
