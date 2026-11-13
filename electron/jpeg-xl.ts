import fs from 'node:fs/promises'
import path from 'node:path'
import { createRequire } from 'node:module'
import encode, { init as initEncoder } from '@jsquash/jxl/encode.js'
import sharp from 'sharp'
const require = createRequire(import.meta.url)
let ready: Promise<unknown> | undefined
export async function encodeJxl(input: string | Buffer, lossless: boolean, quality: number) {
  if (!ready) {
    const root = path.dirname(require.resolve('@jsquash/jxl/package.json'))
    ready = fs.readFile(path.join(root, 'codec/enc/jxl_enc.wasm')).then(wasmBinary => initEncoder({ wasmBinary }))
  }
  await ready
  const image = await sharp(input, { limitInputPixels: 16000000 }).autoOrient().toColourspace('srgb').ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  return Buffer.from(await encode({ data: new Uint8ClampedArray(image.data), width: image.info.width, height: image.info.height, colorSpace: 'srgb' } as ImageData, { lossless, quality: lossless ? 100 : quality, effort: 3 }))
}
