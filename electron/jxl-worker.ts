import { parentPort, workerData } from 'node:worker_threads'
import fs from 'node:fs/promises'
import path from 'node:path'
import { createRequire } from 'node:module'
import decode, { init } from '@jsquash/jxl/decode.js'
import sharp from 'sharp'

async function run() {
  const require = createRequire(import.meta.url)
  const file = workerData.input as string
  if ((await fs.stat(file)).size > 20 * 1024 * 1024) throw new Error('JPEG XL exceeds 20 MB / JPEG XL supera 20 MB')
  const root = path.dirname(require.resolve('@jsquash/jxl/package.json'))
  await init({ wasmBinary: await fs.readFile(path.join(root, 'codec/dec/jxl_dec.wasm')) })
  const data = await fs.readFile(file)
  const image = await decode(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength))
  if (!image.width || !image.height || image.width * image.height > 16000000) throw new Error('JPEG XL exceeds 16 MP / JPEG XL supera 16 MP')
  const png = await sharp(Buffer.from(image.data), { raw: { width: image.width, height: image.height, channels: 4 } }).png().toBuffer()
  parentPort?.postMessage({ data: png })
}
void run().catch(error => parentPort?.postMessage({ error: error instanceof Error ? error.message : 'JPEG XL decoding failed' }))
