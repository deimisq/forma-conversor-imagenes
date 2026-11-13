import fs from 'node:fs/promises'
import path from 'node:path'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import sharp from 'sharp'
import type { Metadata } from 'sharp'
import { validateSettings } from '../shared/advanced-settings.ts'
import type { ConversionSettings } from '../shared/advanced-settings.ts'
import { applyWatermark } from './watermark.ts'
import { plannedFilename } from '../shared/naming.ts'
import { imageInput } from './image-input.ts'

// En Windows, la caché de archivos puede impedir mover un original ya procesado.
sharp.cache({ files: 0 })

export type ConversionOptions = ConversionSettings & { files: string[]; outputDir: string; sourceRoots: Record<string, string>; sequence?: number[] }

export function validateConversionOptions(value: unknown): ConversionOptions {
  if (!value || typeof value !== 'object') throw new Error('Las opciones de conversión no son válidas.')
  const options = value as Record<string, unknown>
  if (!Array.isArray(options.files) || !options.files.length ||
      !options.files.every(file => typeof file === 'string' && !file.includes('\0') && path.isAbsolute(file))) {
    throw new Error('Selecciona archivos con rutas absolutas válidas.')
  }
  if (typeof options.outputDir !== 'string' || options.outputDir.includes('\0') ||
      (options.outputDir !== '' && !path.isAbsolute(options.outputDir))) {
    throw new Error('La carpeta de destino no es válida.')
  }
  const settings = validateSettings(options)
  const sourceRoots: Record<string, string> = Object.create(null)
  if (options.sourceRoots !== undefined) {
    if (!options.sourceRoots || typeof options.sourceRoots !== 'object' || Array.isArray(options.sourceRoots)) throw new Error('Las carpetas de origen no son válidas.')
    for (const file of options.files) {
      const root = (options.sourceRoots as Record<string, unknown>)[file]
      if (root === undefined) continue
      if (typeof root !== 'string' || root.includes('\0') || !path.isAbsolute(root) || !isInside(root, file)) throw new Error('Una imagen está fuera de su carpeta de origen.')
      sourceRoots[file] = root
    }
  }
  if (options.sequence !== undefined && (!Array.isArray(options.sequence) || options.sequence.length !== options.files.length || !options.sequence.every(index => Number.isSafeInteger(index) && index >= 0 && index <= 999999999))) throw new Error('La secuencia de nombres no es válida.')
  return { ...(options.sequence ? { sequence: [...options.sequence as number[]] } : {}), ...settings, files: [...options.files], outputDir: options.outputDir, sourceRoots }
}

function isInside(root: string, file: string) {
  const relative = path.relative(root, file)
  return relative !== '' && relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative)
}

function processingPixels(metadata: Metadata, settings: ConversionSettings) {
  const swapped = [5, 6, 7, 8].includes(metadata.orientation ?? 1) !== [90, 270].includes(settings.adjustments.rotation)
  const sourceWidth = metadata.width ?? 0
  const sourceHeight = metadata.pageHeight ?? metadata.height ?? 0
  const width = swapped ? sourceHeight : sourceWidth
  const height = swapped ? sourceWidth : sourceHeight
  if (!width || !height) throw new Error('No se pudieron leer las dimensiones de la imagen.')
  const r = settings.resize
  let scale = r.mode === 'width' ? r.width / width : r.mode === 'height' ? r.height / height
    : r.mode === 'bounds' ? Math.min(r.width / width, r.height / height) : r.mode === 'percentage' ? r.percentage / 100 : 1
  if (!r.allowEnlargement) scale = Math.min(1, scale)
  return Math.max((metadata.width ?? 0) * (metadata.height ?? 0), ['cover', 'contain'].includes(r.mode) ? r.width * r.height : Math.max(1, Math.round(width * scale)) * Math.max(1, Math.round(height * scale)))
}

export function destinationDirectory(outputDir: string, input: string, sourceRoot: string, preserveFolders: boolean) {
  if (!preserveFolders) return outputDir
  if (!isInside(sourceRoot, input)) throw new Error('La imagen está fuera de su carpeta de origen.')
  const directory = path.resolve(outputDir, path.basename(sourceRoot) || 'Imagenes', path.dirname(path.relative(sourceRoot, input)))
  if (!isInside(outputDir, path.join(directory, path.basename(input)))) throw new Error('El destino está fuera de la carpeta seleccionada.')
  return directory
}

export async function createEncoder(input: string, settings: ConversionSettings) {
  settings = validateSettings(settings)
  const adjustments = settings.adjustments
  let image = sharp(await imageInput(input), { animated: settings.format === 'gif' }).autoOrient()
  if (adjustments.rotation) image = image.rotate(adjustments.rotation)
  if (adjustments.flip) image = image.flip()
  if (adjustments.flop) image = image.flop()
  if (adjustments.grayscale) image = image.grayscale()
  try {
    if (settings.watermark.mode !== 'none' && settings.watermark.opacity > 0) {
      const metadata = await image.metadata()
      if (settings.format === 'gif' && (metadata.pages ?? 1) > 1) throw new Error('Las marcas de agua en GIF animados todavía no están disponibles. Desactiva la marca o elige un formato estático.')
      if (processingPixels(metadata, settings) > 40000000) throw new Error('Las marcas de agua admiten hasta 40 megapíxeles tanto en el original como en el resultado. Reduce la ampliación o desactiva la marca.')
    }
    const resize = settings.resize
    if (resize.mode !== 'none') {
      let width: number | undefined
      let height: number | undefined
      if (resize.mode === 'percentage') {
        const metadata = await image.metadata()
        const swapped = [5, 6, 7, 8].includes(metadata.orientation ?? 1) !== [90, 270].includes(adjustments.rotation)
        const inputWidth = metadata.width
        const inputHeight = metadata.pageHeight ?? metadata.height
        if (!inputWidth || !inputHeight) throw new Error('No se pudieron leer las dimensiones de la imagen.')
        width = Math.max(1, Math.round((swapped ? inputHeight : inputWidth) * resize.percentage / 100))
        height = Math.max(1, Math.round((swapped ? inputWidth : inputHeight) * resize.percentage / 100))
      } else {
        if (resize.mode !== 'height') width = resize.width
        if (resize.mode !== 'width') height = resize.height
      }
      image = image.resize({ width, height, fit: resize.mode === 'cover' ? 'cover' : resize.mode === 'contain' ? 'contain' : 'inside', background: adjustments.background, withoutEnlargement: !resize.allowEnlargement })
    }
    image = await applyWatermark(image, settings.watermark)
    if (settings.format === 'jpeg') image = image.flatten({ background: adjustments.background })
    if (adjustments.metadata === 'color') image = image.withIccProfile('srgb')
    return image.toFormat(settings.format, settings.format === 'jpeg' ? { quality: settings.quality, progressive: adjustments.jpegProgressive } : settings.format === 'webp' ? { quality: settings.quality, lossless: adjustments.webpLossless } : settings.format === 'png' || settings.format === 'tiff' ? {} : { quality: settings.quality })
  } catch (error) {
    image.destroy()
    throw error
  }
}

// La apertura exclusiva reserva el destino incluso entre procesos distintos.
export async function writeUniqueOutput(encoder: Readable, outputDir: string, base: string, extension: string): Promise<string> {
  return writeNamedOutput(encoder, outputDir, `${base}-converted.${extension}`)
}

export async function writeNamedOutput(encoder: Readable, outputDir: string, filename: string): Promise<string> {
  if (path.basename(filename) !== filename || filename.includes('\0')) throw new Error('El nombre de salida no es válido.')
  const extension = path.extname(filename)
  const base = path.basename(filename, extension)
  let suffix = 1
  while (true) {
    const output = path.join(outputDir, `${base}${suffix === 1 ? '' : `-${suffix}`}${extension}`)
    let handle
    try {
      handle = await fs.open(output, 'wx')
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'EEXIST') { suffix++; continue }
      throw error
    }
    try {
      await pipeline(encoder, handle.createWriteStream())
      return output
    } catch (error) {
      await handle.close().catch(() => {})
      await fs.rm(output, { force: true })
      throw error
    }
  }
}

export async function createPreview(input: string, settings: ConversionSettings, index: number) {
  const source = await sharp(await imageInput(input), { animated: settings.format === 'gif' }).metadata()
  if (processingPixels(source, settings) > 40000000) throw new Error('La vista previa admite hasta 40 megapíxeles tanto en el original como en el resultado.')
  const filename = plannedFilename(input, settings, index)
  const encoder = await createEncoder(input, settings)
  const buffer = settings.target.enabled ? await encodeTarget(input, settings) : await encoder.toBuffer()
  encoder.destroy()
  const metadata = await sharp(buffer).metadata()
  const thumbnail = await sharp(buffer).resize({ width: 640, height: 480, fit: 'inside', withoutEnlargement: true }).png().toBuffer()
  const original = await sharp(await imageInput(input)).autoOrient().resize({ width: 640, height: 480, fit: 'inside', withoutEnlargement: true }).png().toBuffer()
  return { filename, outputBytes: buffer.length, originalDataUrl: `data:image/png;base64,${original.toString('base64')}`, width: metadata.width ?? 0, height: metadata.pageHeight ?? metadata.height ?? 0, animated: (metadata.pages ?? 1) > 1, dataUrl: `data:image/png;base64,${thumbnail.toString('base64')}` }
}

// Bounded search: maximize quality within the requested byte limit, then optionally
// reduce dimensions. Never write a result larger than the requested limit.
export async function encodeTarget(input: string, settings: ConversionSettings): Promise<Buffer> {
  const options = validateSettings(settings)
  if (!options.target.enabled) return (await createEncoder(input, options)).toBuffer()
  const metadata = await sharp(await imageInput(input)).metadata()
  if (processingPixels(metadata, options) > 40000000) throw new Error('El peso objetivo admite hasta 40 megapíxeles.')
  const limit = options.target.maxKB * 1024
  let resize = options.resize
  for (let stage = 0; stage < (options.target.allowResize ? 7 : 1); stage++) {
    let low = options.target.minQuality
    let high = options.quality
    let best: Buffer | undefined
    let last: Buffer | undefined
    while (low <= high) {
      const quality = Math.floor((low + high) / 2)
      last = await (await createEncoder(input, { ...options, resize, quality })).toBuffer()
      if (last.length <= limit) { best = last; low = quality + 1 }
      else high = quality - 1
    }
    if (best) return best
    if (!options.target.allowResize || !last) break
    const result = await sharp(last).metadata()
    const width = Math.max(1, Math.floor((result.width || 1) * .75))
    const height = Math.max(1, Math.floor((result.height || 1) * .75))
    if (width === 1 && height === 1 && stage > 0) break
    resize = { ...resize, mode: options.resize.mode === 'cover' || options.resize.mode === 'contain' ? options.resize.mode : 'bounds', width, height, allowEnlargement: false }
  }
  throw new Error('No se pudo alcanzar el peso objetivo. Permite reducir dimensiones, baja la calidad mínima o aumenta el límite.')
}

export async function createOutputEncoder(input: string, settings: ConversionSettings): Promise<Readable> {
  return settings.target.enabled ? Readable.from([await encodeTarget(input, settings)]) : createEncoder(input, settings)
}
