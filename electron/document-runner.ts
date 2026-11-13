import { Worker } from 'node:worker_threads'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { validateDocumentRequest } from './documents.ts'
export async function runDocumentWorker(value: unknown, cancelled: () => boolean, progress: (done: number, total: number) => void): Promise<string[]> {
  const request = validateDocumentRequest(value)
  const cancel = new SharedArrayBuffer(4), flag = new Int32Array(cancel)
  // This is a separately built Node entry, not a browser Web Worker asset.
  const workerPath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'document-worker.js')
  const worker = new Worker(workerPath, { workerData: { request, cancel }, resourceLimits: { maxOldGenerationSizeMb: 512 } })
  const timer = setInterval(() => { if (cancelled()) Atomics.store(flag, 0, 1) }, 50)
  try {
    return await new Promise((resolve, reject) => {
      let settled = false
      worker.on('message', message => {
        if (message.type === 'progress') progress(message.done, message.total)
        if (message.type === 'done') { settled = true; resolve(message.outputs) }
        if (message.type === 'error') { settled = true; reject(new Error(message.message)) }
      })
      worker.on('error', reject)
      worker.on('exit', code => { if (!settled) reject(new Error(`Document worker exited (${code})`)) })
    })
  } catch (error) { console.error('Document worker failed:', error); throw error }
  finally { clearInterval(timer); await worker.terminate() }
}
