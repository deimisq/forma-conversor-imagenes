import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import sharp from 'sharp'
import { convertDocuments, validateDocumentRequest } from '../electron/documents.ts'
import { decodeBmp, imageInput } from '../electron/image-input.ts'
import { gzipSync } from 'node:zlib'
import { createRequire } from 'node:module'
import { toolMessage } from '../shared/tool-errors.ts'
import PDFDocument from 'pdfkit'
import { createEncoder, createPreview } from '../electron/conversion.ts'
import { defaultSettings } from '../shared/advanced-settings.ts'

async function fixture(t) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'forma-docs-'))
  t.after(() => fs.rm(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 }))
  const files = []
  for (const color of ['red', 'blue']) { const input = path.join(dir, `${color}.png`); await sharp({ create: { width: 100, height: 50, channels: 3, background: color } }).png().toFile(input); files.push(input) }
  return { dir, files, request: { mode: 'pdf', files, outputDir: path.join(dir, 'out'), paper: 'image', margin: 0, dpi: 72, first: 1, last: 1000 } }
}
test('PDF preserves page order and physical size; renders selected pages locally', async t => {
  const { request } = await fixture(t)
  const progress = []
  const [pdf] = await convertDocuments(request, () => false, (done, total) => progress.push([done, total]))
  assert.equal((await fs.readFile(pdf)).subarray(0, 5).toString(), '%PDF-')
  assert.deepEqual(progress, [[1, 2], [2, 2]])
  const outputs = await convertDocuments({ ...request, mode: 'pages', files: [pdf], first: 2, last: 2 }, () => false, () => {})
  assert.equal(outputs.length, 1)
  const image = await sharp(outputs[0]).raw().toBuffer({ resolveWithObject: true })
  assert.equal(image.info.width, 100); assert.equal(image.info.height, 50)
  assert.ok(image.data[2] > 200); assert.ok(image.data[0] < 30)
  const [second] = await convertDocuments(request, () => false, () => {})
  assert.notEqual(second, pdf)
})
test('PDF cancellation removes partial output and leaves original files intact', async t => {
  const { request } = await fixture(t)
  const original = await fs.readFile(request.files[0]); let stop = false
  await assert.rejects(convertDocuments(request, () => stop, () => { stop = true }), /Cancel/)
  assert.deepEqual(await fs.readdir(request.outputDir), [])
  assert.deepEqual(await fs.readFile(request.files[0]), original)
})
test('ICO container includes six sizes and does not overwrite originals', async t => {
  const { request } = await fixture(t)
  const outputs = await convertDocuments({ ...request, mode: 'ico', files: request.files.slice(0, 1) }, () => false, () => {})
  const ico = await fs.readFile(outputs[0])
  assert.equal(ico.readUInt16LE(2), 1); assert.equal(ico.readUInt16LE(4), 6)
  assert.deepEqual(Array.from({ length: 6 }, (_, index) => ico[6 + index * 16] || 256), [16, 32, 48, 64, 128, 256])
})
test('document IPC validates limits, absolute paths and ranges', () => {
  const valid = { mode: 'pdf', files: [path.resolve('a.png')], outputDir: path.resolve('out'), paper: 'A4', margin: 20, dpi: 150, first: 1, last: 1000 }
  assert.doesNotThrow(() => validateDocumentRequest(valid))
  for (const change of [{ dpi: 601 }, { margin: -1 }, { files: ['relative.png'] }, { first: 3, last: 2 }, { mode: 'pages' }, { outputDir: 'relative' }]) assert.throws(() => validateDocumentRequest({ ...valid, ...change }))
})
test('BMP 24-bit padding, bottom-up and top-down rows decode correctly; malformed files rejected', () => {
  const bmp = Buffer.alloc(62); bmp.write('BM'); bmp.writeUInt32LE(62, 2); bmp.writeUInt32LE(54, 10); bmp.writeUInt32LE(40, 14); bmp.writeInt32LE(1, 18); bmp.writeInt32LE(2, 22); bmp.writeUInt16LE(1, 26); bmp.writeUInt16LE(24, 28)
  bmp.set([255, 0, 0, 0, 0, 0, 255, 0], 54)
  assert.deepEqual([...decodeBmp(bmp).pixels], [255, 0, 0, 0, 0, 255])
  bmp.writeInt32LE(-2, 22); assert.deepEqual([...decodeBmp(bmp).pixels], [0, 0, 255, 255, 0, 0])
  assert.throws(() => decodeBmp(bmp.subarray(0, 58)), /incompleto/)
  bmp.writeInt32LE(100000000, 18); assert.throws(() => decodeBmp(bmp), /40 MP/)
})
test('SVGZ is normalized to SVG and can be encoded', async t => {
  const { dir } = await fixture(t)
  const svg = path.join(dir, 'test.svgz'); await fs.writeFile(svg, gzipSync('<svg xmlns="http://www.w3.org/2000/svg" width="2" height="3"><rect width="2" height="3" fill="red"/></svg>'))
  const metadata = await sharp(await imageInput(svg)).metadata(); assert.equal(metadata.width, 2); assert.equal(metadata.height, 3)
})
test('JPEG XL lossless output round-trips RGBA pixels through the independent decoder', async t => {
  const { request } = await fixture(t)
  const [output] = await convertDocuments({ ...request, mode: 'jxl', files: request.files.slice(0, 1), lossless: true }, () => false, () => {})
  const { default: decode, init } = await import('@jsquash/jxl/decode.js')
  const require = createRequire(import.meta.url)
  const root = path.dirname(require.resolve('@jsquash/jxl/package.json'))
  await init({ wasmBinary: await fs.readFile(path.join(root, 'codec/dec/jxl_dec.wasm')) })
  const bytes = await fs.readFile(output)
  const decoded = await decode(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength))
  const original = await sharp(request.files[0]).ensureAlpha().raw().toBuffer()
  assert.equal(decoded.width, 100); assert.equal(decoded.height, 50)
  assert.deepEqual(Buffer.from(decoded.data), original)
})
test('animated WebP preserves frame count, timings and loop', async t => {
  const { dir, request } = await fixture(t)
  const input = path.join(dir, 'animation.gif')
  const pixels = Buffer.from([255,0,0,255, 0,0,255,255])
  await sharp(pixels, { raw: { width: 1, height: 2, channels: 4, pageHeight: 1 } }).gif({ delay: [100, 200], loop: 3 }).toFile(input)
  const [output] = await convertDocuments({ ...request, mode: 'animation', files: [input] }, () => false, () => {})
  const metadata = await sharp(output, { animated: true }).metadata()
  assert.equal(metadata.pages, 2); assert.deepEqual(metadata.delay, [100, 200]); assert.equal(metadata.loop, 3)
})
test('TIFF page extraction selects the requested page', async t => {
  const { dir, request } = await fixture(t)
  const input = path.join(dir, 'pages.tiff')
  await sharp(Buffer.from([255,0,0, 0,0,255]), { raw: { width: 1, height: 2, channels: 3, pageHeight: 1 } }).tiff({ compression: 'lzw' }).toFile(input)
  const [output] = await convertDocuments({ ...request, mode: 'tiff', files: [input], first: 2, last: 2 }, () => false, () => {})
  assert.deepEqual([...await sharp(output).removeAlpha().raw().toBuffer()], [0,0,255])
})
test('a failed batch removes its new outputs without touching pre-existing files', async t => {
  const { request } = await fixture(t)
  await fs.mkdir(request.outputDir)
  const existing = path.join(request.outputDir, 'red.ico'); await fs.writeFile(existing, 'existing')
  await assert.rejects(convertDocuments({ ...request, mode: 'ico', files: [request.files[0], path.join(request.outputDir, 'missing.png')] }, () => false, () => {}))
  assert.deepEqual(await fs.readdir(request.outputDir), ['red.ico'])
  assert.equal(await fs.readFile(existing, 'utf8'), 'existing')
})
test('individual PDFs and automatic paper orientation produce complete documents', async t => {
  const { request } = await fixture(t)
  const outputs = await convertDocuments({ ...request, separate: true, paper: 'A4', orientation: 'auto' }, () => false, () => {})
  assert.equal(outputs.length, 2)
  const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs')
  for (const output of outputs) {
    const loading = getDocument({ data: new Uint8Array(await fs.readFile(output)) })
    try {
      const pdf = await loading.promise; assert.equal(pdf.numPages, 1)
      const page = await pdf.getPage(1); const viewport = page.getViewport({ scale: 1 })
      assert.ok(viewport.width > viewport.height)
    } finally { await loading.destroy() }
  }
})
test('known document errors are localized while unexpected messages stay private', () => {
  const error = new Error('PDF exceeds 100 MB / PDF supera 100 MB')
  assert.equal(toolMessage(error, 'es'), 'PDF supera 100 MB')
  assert.equal(toolMessage(error, 'en'), 'PDF exceeds 100 MB')
  assert.ok(!toolMessage(new Error('private C:/users/example'), 'en').includes('C:/'))
})
test('encrypted PDF requires the supplied password and exports JPEG pages', async t => {
  const { dir, request } = await fixture(t)
  const doc = new PDFDocument({ userPassword: 'forma-test', ownerPassword: 'owner-test', size: [100, 50] })
  const chunks = []; doc.on('data', chunk => chunks.push(chunk))
  const finished = new Promise(resolve => doc.on('end', resolve))
  doc.rect(0, 0, 100, 50).fill('red'); doc.end(); await finished
  const file = path.join(dir, 'encrypted.pdf'); await fs.writeFile(file, Buffer.concat(chunks))
  for (const password of ['', 'wrong']) await assert.rejects(convertDocuments({ ...request, mode: 'pages', files: [file], password }, () => false, () => {}), /contraseña/)
  const [output] = await convertDocuments({ ...request, mode: 'pages', files: [file], password: 'forma-test', pageFormat: 'jpeg', quality: 92 }, () => false, () => {})
  const metadata = await sharp(output).metadata()
  assert.equal(metadata.format, 'jpeg'); assert.equal(metadata.width, 100)
  assert.equal(metadata.density, 72)
  assert.deepEqual((await fs.readdir(request.outputDir)).filter(file => file.endsWith('.jpg')).length, 1)
})
test('JPEG XL input supports image conversion and original/result preview', async t => {
  const { request } = await fixture(t)
  const [jxl] = await convertDocuments({ ...request, mode: 'jxl', files: request.files.slice(0, 1), lossless: true }, () => false, () => {})
  const settings = defaultSettings(); settings.format = 'png'
  const encoded = await (await createEncoder(jxl, settings)).toBuffer()
  assert.equal((await sharp(encoded).metadata()).width, 100)
  const preview = await createPreview(jxl, settings, 0)
  assert.ok(preview.originalDataUrl.startsWith('data:image/png;base64,'))
  assert.equal(preview.width, 100)
  const corrupt = path.join(request.outputDir, 'corrupt.jxl')
  await fs.writeFile(corrupt, 'not a JPEG XL image')
  await assert.rejects(imageInput(corrupt))
})
