import { parentPort, workerData } from 'node:worker_threads'
import { convertDocuments } from './documents.ts'
const flag = new Int32Array(workerData.cancel)
try {
  const outputs = await convertDocuments(workerData.request, () => Atomics.load(flag, 0) !== 0, (done, total) => parentPort?.postMessage({ type: 'progress', done, total }))
  parentPort?.postMessage({ type: 'done', outputs })
} catch (error) { parentPort?.postMessage({ type: 'error', message: error instanceof Error ? error.message : String(error) }) }
