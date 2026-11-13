import { Worker } from 'node:worker_threads'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// The WASM decoder exposes no dimensions-only API. The pixel limit is checked
// after decoding; the byte/time/heap limits are not a total native-memory cap.
export async function decodeJxlInput(input: string): Promise<Buffer> {
  const source = import.meta.url.endsWith('.ts')
  const worker = new Worker(path.join(path.dirname(fileURLToPath(import.meta.url)), source ? 'jxl-worker.ts' : 'jxl-worker.js'), { workerData: { input }, resourceLimits: { maxOldGenerationSizeMb: 256 } })
  let timeout: ReturnType<typeof setTimeout> | undefined
  try {
    return await new Promise((resolve, reject) => {
      let settled = false
      timeout = setTimeout(() => reject(new Error('JPEG XL decoding timed out / La decodificación JPEG XL agotó el tiempo')), 30000)
      worker.on('message', message => { settled = true; if (message.error) reject(new Error(message.error)); else resolve(Buffer.from(message.data)) })
      worker.on('error', reject)
      worker.on('exit', () => { if (!settled) reject(new Error('JPEG XL decoding failed / Falló la decodificación JPEG XL')) })
    })
  } finally { clearTimeout(timeout); await worker.terminate() }
}
