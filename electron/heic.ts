import { createRequire } from 'node:module'
import fs from 'node:fs/promises'
import sharp from 'sharp'
const require = createRequire(import.meta.url)
export async function decodeHeic(input: string) {
  if ((await fs.stat(input)).size > 100 * 1024 * 1024) throw new Error('HEIC exceeds 100 MB / HEIC supera 100 MB')
  const libheif = require('libheif-js/wasm-bundle')
  await libheif.ready
  const decoder = new libheif.HeifDecoder()
  let images: any[] = []
  try {
    images = decoder.decode(await fs.readFile(input))
    const image = images[0]
    if (!image) throw new Error('No HEIC image / No se encontró imagen HEIC')
    const width = image.get_width(), height = image.get_height()
    if (width < 1 || height < 1 || width * height > 40000000) throw new Error('HEIC exceeds 40 MP / HEIC supera 40 MP')
    const data = new Uint8ClampedArray(width * height * 4)
    await new Promise<void>((resolve, reject) => image.display({ data, width, height }, (result: unknown) => result ? resolve() : reject(new Error('HEIC decoding failed / Falló la decodificación HEIC'))))
    return await sharp(Buffer.from(data.buffer), { raw: { width, height, channels: 4 } }).png().toBuffer()
  } finally { for (const image of images) image.free(); decoder.decoder.delete() }
}
