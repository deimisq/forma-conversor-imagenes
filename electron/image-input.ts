import fs from 'node:fs/promises'
import path from 'node:path'
import { promisify } from 'node:util'
import { gunzip } from 'node:zlib'
import sharp from 'sharp'
import { decodeJxlInput } from './jxl-input.ts'

const unzip = promisify(gunzip)
// Bounded decoding for common Windows BI_RGB BMPs. Indexed/RLE/bitfield
// variants are rejected explicitly rather than silently changing their colours.
export function decodeBmp(data: Buffer) {
  if (data.length < 54 || data.toString('ascii', 0, 2) !== 'BM' || data.readUInt32LE(14) < 40) throw new Error('Unsupported BMP header / Cabecera BMP no compatible')
  const offset = data.readUInt32LE(10), width = data.readInt32LE(18), signedHeight = data.readInt32LE(22)
  const height = Math.abs(signedHeight), bits = data.readUInt16LE(28)
  if (width < 1 || height < 1 || width * height > 40000000 || ![24, 32].includes(bits) || data.readUInt16LE(26) !== 1 || data.readUInt32LE(30) !== 0) throw new Error('BMP requires 24/32-bit uncompressed RGB, maximum 40 MP / BMP requiere RGB sin compresión de 24/32 bits, máximo 40 MP')
  const stride = Math.ceil(width * bits / 32) * 4
  if (offset < 14 + data.readUInt32LE(14) || offset + stride * height > data.length) throw new Error('Truncated BMP / BMP incompleto')
  const pixels = Buffer.alloc(width * height * 3)
  for (let y = 0; y < height; y++) {
    const row = offset + (signedHeight > 0 ? height - y - 1 : y) * stride
    for (let x = 0; x < width; x++) {
      const src = row + x * (bits / 8), dest = (y * width + x) * 3
      pixels[dest] = data[src + 2]; pixels[dest + 1] = data[src + 1]; pixels[dest + 2] = data[src]
    }
  }
  return { pixels, width, height }
}
export async function imageInput(input: string): Promise<string | Buffer> {
  const extension = path.extname(input).toLowerCase()
  if (extension === '.jxl') return decodeJxlInput(input)
  if (!['.bmp', '.svgz'].includes(extension) && !input.toLowerCase().endsWith('.svg.gz')) return input
  if ((await fs.stat(input)).size > 160 * 1024 * 1024) throw new Error('Input exceeds 160 MB / Entrada supera 160 MB')
  const data = await fs.readFile(input)
  if (extension !== '.bmp') return unzip(data, { maxOutputLength: 16 * 1024 * 1024 })
  const { pixels, width, height } = decodeBmp(data)
  return sharp(pixels, { raw: { width, height, channels: 3 } }).png().toBuffer()
}
