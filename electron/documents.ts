import fs from 'node:fs/promises'
import path from 'node:path'
import { Readable } from 'node:stream'
import PDFDocument from 'pdfkit'
import sharp from 'sharp'
import pngToIco from 'png-to-ico'
import { writeNamedOutput } from './conversion.ts'
import { imageInput } from './image-input.ts'
import { encodeJxl } from './jpeg-xl.ts'
import { decodeHeic } from './heic.ts'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)

export type DocumentRequest = { mode: 'pdf' | 'pages' | 'ico' | 'jxl' | 'heic' | 'tiff' | 'animation'; files: string[]; outputDir: string; paper: 'A4' | 'LETTER' | 'image'; margin: number; dpi: number; first: number; last: number; lossless?: boolean; quality?: number; separate?: boolean; orientation?: 'portrait' | 'landscape' | 'auto'; password?: string; pageFormat?: 'png' | 'jpeg' }
export function validateDocumentRequest(value: unknown): DocumentRequest {
  const r = value as DocumentRequest
  if (!r || !['pdf', 'pages', 'ico', 'jxl', 'heic', 'tiff', 'animation'].includes(r.mode) || !Array.isArray(r.files) || !r.files.length || r.files.length > 500 || !r.files.every(f => typeof f === 'string' && path.isAbsolute(f) && !f.includes('\0')) || typeof r.outputDir !== 'string' || !path.isAbsolute(r.outputDir) || r.outputDir.includes('\0')) throw new Error('Invalid document paths / Rutas de documento inválidas')
  if (!['A4', 'LETTER', 'image'].includes(r.paper) || !Number.isInteger(r.margin) || r.margin < 0 || r.margin > 100 || !Number.isInteger(r.dpi) || r.dpi < 72 || r.dpi > 600 || !Number.isInteger(r.first) || !Number.isInteger(r.last) || r.first < 1 || r.last < r.first || r.last > 1000) throw new Error('Invalid page options / Opciones de página inválidas')
  if (r.mode === 'pages' && (r.files.length !== 1 || path.extname(r.files[0]).toLowerCase() !== '.pdf')) throw new Error('Select one PDF / Selecciona un PDF')
  if (r.lossless !== undefined && typeof r.lossless !== 'boolean' || r.quality !== undefined && (!Number.isInteger(r.quality) || r.quality < 1 || r.quality > 100)) throw new Error('Invalid JPEG XL options')
  if (r.separate !== undefined && typeof r.separate !== 'boolean' || r.orientation !== undefined && !['portrait', 'landscape', 'auto'].includes(r.orientation)) throw new Error('Invalid PDF options')
  if (r.password !== undefined && (typeof r.password !== 'string' || r.password.length > 1024) || r.pageFormat !== undefined && !['png', 'jpeg'].includes(r.pageFormat)) throw new Error('Invalid PDF options')
  return { ...r, files: [...r.files] }
}

export async function convertDocuments(value: unknown, cancelled: () => boolean, progress: (done: number, total: number) => void) {
  const r = validateDocumentRequest(value)
  await fs.mkdir(r.outputDir, { recursive: true })
  const outputs: string[] = []
  const check = () => { if (cancelled()) throw new Error('Cancelled / Cancelado') }
  try {
    if (r.mode === 'pdf' && r.separate) {
      for (const [index, input] of r.files.entries()) {
        check()
        outputs.push(...await convertDocuments({ ...r, separate: false, files: [input] }, cancelled, () => {}))
        progress(index + 1, r.files.length)
      }
    } else if (r.mode === 'pdf') {
      const doc = new PDFDocument({ autoFirstPage: false, compress: true })
      // Consume the stream while adding pages, avoiding a complete PDF buffer.
      const writing = writeNamedOutput(doc, r.outputDir, 'Forma.pdf')
      let writeError: unknown
      let embeddedBytes = 0
      void writing.catch(error => { writeError = error })
      try {
        for (const [index, input] of r.files.entries()) {
          check()
          if (writeError) throw writeError
          const image = await sharp(await imageInput(input), { limitInputPixels: 40000000 }).autoOrient().flatten({ background: '#ffffff' }).jpeg({ quality: 95 }).toBuffer({ resolveWithObject: true })
          embeddedBytes += image.data.length
          if (embeddedBytes > 128 * 1024 * 1024) throw new Error('PDF image data exceeds 128 MB / Las imágenes del PDF superan 128 MB')
          const dimensions = r.paper === 'image' ? [image.info.width * 72 / r.dpi + r.margin * 2, image.info.height * 72 / r.dpi + r.margin * 2] : r.paper === 'A4' ? [595.28, 841.89] : [612, 792]
          if (r.paper !== 'image' && (r.orientation === 'landscape' || r.orientation === 'auto' && image.info.width > image.info.height)) dimensions.reverse()
          doc.addPage({ size: dimensions, margin: 0 })
          doc.image(image.data, r.margin, r.margin, { fit: [dimensions[0] - 2 * r.margin, dimensions[1] - 2 * r.margin], align: 'center', valign: 'center' })
          progress(index + 1, r.files.length)
          await new Promise(resolve => setImmediate(resolve))
        }
        check(); doc.end()
        outputs.push(await writing)
      } catch (error) { doc.destroy(error as Error); await writing.catch(() => {}); throw error }
    } else if (r.mode === 'heic') {
      for (const [index, input] of r.files.entries()) {
        check()
        const data = await decodeHeic(input)
        check()
        outputs.push(await writeNamedOutput(Readable.from(data), r.outputDir, `${path.parse(input).name}.png`))
        progress(index + 1, r.files.length)
      }
    } else if (r.mode === 'tiff') {
      for (const input of r.files) {
        const metadata = await sharp(input).metadata()
        if (metadata.format !== 'tiff') throw new Error('Select TIFF / Selecciona TIFF')
        const end = Math.min(r.last, metadata.pages ?? 1)
        if (r.first > end) throw new Error('Empty page range / Rango vacío')
        for (let page = r.first; page <= end; page++) {
          check()
          const data = await sharp(input, { page: page - 1, pages: 1, limitInputPixels: 40000000 }).autoOrient().png().toBuffer()
          check()
          outputs.push(await writeNamedOutput(Readable.from(data), r.outputDir, `${path.parse(input).name}-${String(page).padStart(3, '0')}.png`))
          progress(page - r.first + 1, end - r.first + 1)
        }
      }
    } else if (r.mode === 'animation') {
      for (const [index, input] of r.files.entries()) {
        check()
        const metadata = await sharp(input, { animated: true, limitInputPixels: 40000000 }).metadata()
        if (!['gif', 'webp'].includes(metadata.format ?? '') || (metadata.pages ?? 1) < 2 || (metadata.pages ?? 1) > 500) throw new Error('Select animated GIF/WebP, maximum 500 frames / Selecciona GIF/WebP animado, máximo 500 fotogramas')
        const data = await sharp(input, { animated: true, limitInputPixels: 40000000 }).webp({ lossless: true }).toBuffer()
        check()
        outputs.push(await writeNamedOutput(Readable.from(data), r.outputDir, `${path.parse(input).name}.webp`))
        progress(index + 1, r.files.length)
      }
    } else if (r.mode === 'jxl') {
      for (const [index, input] of r.files.entries()) {
        check()
        const data = await encodeJxl(await imageInput(input), r.lossless ?? true, r.quality ?? 85)
        check()
        outputs.push(await writeNamedOutput(Readable.from(data), r.outputDir, `${path.parse(input).name}.jxl`))
        progress(index + 1, r.files.length)
      }
    } else if (r.mode === 'ico') {
      for (const [index, input] of r.files.entries()) {
        check()
        const images: Buffer[] = []
        for (const size of [16, 32, 48, 64, 128, 256]) images.push(await sharp(await imageInput(input), { limitInputPixels: 40000000 }).autoOrient().resize(size, size, { fit: 'contain', background: '#00000000' }).png().toBuffer())
        const data = await pngToIco(images)
        check()
        outputs.push(await writeNamedOutput(Readable.from(data), r.outputDir, `${path.parse(input).name}.ico`))
        progress(index + 1, r.files.length)
      }
    } else {
      const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs')
      const { createCanvas } = await import('@napi-rs/canvas')
      if ((await fs.stat(r.files[0])).size > 100 * 1024 * 1024) throw new Error('PDF exceeds 100 MB / PDF supera 100 MB')
      const pdfRoot = path.dirname(require.resolve('pdfjs-dist/package.json'))
      const loading = getDocument({ data: new Uint8Array(await fs.readFile(r.files[0])), password: r.password || undefined, useSystemFonts: true, cMapUrl: path.join(pdfRoot, 'cmaps') + '/', cMapPacked: true, standardFontDataUrl: path.join(pdfRoot, 'standard_fonts') + '/', wasmUrl: path.join(pdfRoot, 'wasm') + '/' })
      try {
        const pdf = await loading.promise.catch(error => {
          if (error?.name === 'PasswordException') throw new Error('Missing or incorrect PDF password / Falta la contraseña del PDF o es incorrecta')
          throw error
        })
        const end = Math.min(r.last, pdf.numPages)
        if (r.first > end) throw new Error('Page range is empty / Rango de páginas vacío')
        for (let number = r.first; number <= end; number++) {
          check()
          const page = await pdf.getPage(number)
          const viewport = page.getViewport({ scale: r.dpi / 72 })
          if (viewport.width * viewport.height > 40000000 || viewport.width > 30000 || viewport.height > 30000) throw new Error('Page exceeds 40 megapixels / Página supera 40 megapíxeles')
          const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height))
          try {
            await page.render({ canvasContext: canvas.getContext('2d') as never, canvas: canvas as never, viewport }).promise
            check()
            const jpeg = r.pageFormat === 'jpeg'
            const data = jpeg ? await canvas.encode('jpeg', { quality: r.quality ?? 90, resolution: r.dpi }) : await canvas.encode('png', { resolution: r.dpi })
            outputs.push(await writeNamedOutput(Readable.from(data), r.outputDir, `${path.parse(r.files[0]).name}-${String(number).padStart(3, '0')}.${jpeg ? 'jpg' : 'png'}`))
          } finally { canvas.width = 1; canvas.height = 1; page.cleanup() }
          progress(number - r.first + 1, end - r.first + 1)
          await new Promise(resolve => setImmediate(resolve))
        }
      } finally { await loading.destroy() }
    }
    return outputs
  } catch (error) {
    // A cancelled/failed document job leaves no partial batch behind.
    await Promise.all(outputs.map(file => fs.rm(file, { force: true })))
    throw error
  }
}

