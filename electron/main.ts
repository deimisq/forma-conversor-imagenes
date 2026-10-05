import { app, BrowserWindow, dialog, ipcMain, Menu, shell } from 'electron'
import fs from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null
const supportedInputs = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.tif', '.tiff', '.gif', '.bmp', '.svg', '.heic', '.heif'])
let cancelRequested = false

type OutputFormat = 'jpeg' | 'png' | 'webp' | 'avif' | 'tiff' | 'gif'
type ConversionOptions = { files: string[]; outputDir: string; format: OutputFormat; quality: number }

async function collectImages(paths: string[]): Promise<string[]> {
  const images: string[] = []
  const pending = [...paths]
  while (pending.length) {
    const current = pending.pop()!
    try {
      const info = await fs.stat(current)
      if (info.isDirectory()) {
        const entries = await fs.readdir(current, { withFileTypes: true })
        for (const entry of entries) {
          if (entry.isDirectory()) pending.push(path.join(current, entry.name))
          else if (entry.isFile() && supportedInputs.has(path.extname(entry.name).toLowerCase())) images.push(path.join(current, entry.name))
        }
      } else if (info.isFile() && supportedInputs.has(path.extname(current).toLowerCase())) images.push(current)
    } catch {
      // Inaccessible paths are skipped; individual conversion errors are reported later.
    }
  }
  return [...new Set(images)]
}

function sendProgress(payload: Record<string, unknown>) {
  for (const window of BrowserWindow.getAllWindows()) window.webContents.send('conversion:progress', payload)
}

async function convertBatch(options: ConversionOptions) {
  cancelRequested = false
  const files = await collectImages(options.files)
  const outputDir = options.outputDir || path.join(app.getPath('pictures'), 'Imagenes convertidas')
  await fs.mkdir(outputDir, { recursive: true })
  let nextIndex = 0
  let completed = 0
  const totals = { total: files.length, completed: 0, failed: 0, cancelled: false }
  sendProgress({ type: 'start', ...totals })

  const worker = async () => {
    while (true) {
      if (cancelRequested) return
      const index = nextIndex++
      if (index >= files.length) return
      const input = files[index]
      sendProgress({ type: 'file', input, status: 'converting' })
      try {
        const extension = options.format === 'jpeg' ? 'jpg' : options.format
        const base = path.basename(input, path.extname(input))
        let output = path.join(outputDir, `${base}-converted.${extension}`)
        let suffix = 2
        while (await fs.access(output).then(() => true).catch(() => false)) {
          output = path.join(outputDir, `${base}-converted-${suffix++}.${extension}`)
        }
        let pipeline = sharp(input, { animated: options.format === 'gif' }).rotate()
        if (options.format === 'jpeg') pipeline = pipeline.flatten({ background: '#ffffff' })
        const encoder = pipeline.toFormat(options.format, options.format === 'png' || options.format === 'tiff' ? {} : { quality: options.quality })
        await encoder.toFile(output)
        completed++
        totals.completed = completed
        sendProgress({ type: 'file', input, output, status: 'done' })
      } catch (error) {
        totals.failed++
        sendProgress({ type: 'file', input, status: 'error', message: error instanceof Error ? error.message : 'No se pudo convertir.' })
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(3, files.length) }, worker))
  totals.cancelled = cancelRequested
  sendProgress({ type: 'finish', ...totals })
  return totals
}

ipcMain.handle('files:select', async () => {
  const result = await dialog.showOpenDialog({ properties: ['openFile', 'multiSelections'], filters: [{ name: 'Imágenes', extensions: [...supportedInputs].map((extension) => extension.slice(1)) }] })
  return result.canceled ? [] : result.filePaths
})

ipcMain.handle('files:select-folder', async () => {
  const result = await dialog.showOpenDialog({ properties: ['openDirectory'] })
  return result.canceled ? [] : result.filePaths
})

ipcMain.handle('folder:select-output', async () => {
  const result = await dialog.showOpenDialog({ properties: ['openDirectory', 'createDirectory'] })
  return result.canceled ? null : result.filePaths[0]
})
ipcMain.handle('folder:default-output', () => path.join(app.getPath('pictures'), 'Imagenes convertidas'))

ipcMain.handle('conversion:start', (_event, options: ConversionOptions) => convertBatch(options))
ipcMain.handle('conversion:cancel', () => { cancelRequested = true })
ipcMain.handle('folder:open', (_event, folder: string) => shell.openPath(folder))
ipcMain.handle('app:version', () => app.getVersion())

ipcMain.handle('files:inspect', async (_event, filePaths: string[]) => {
  const files = await collectImages(filePaths)
  const inspected: { path: string; name: string; size: number }[] = []
  for (let start = 0; start < files.length; start += 200) {
    const batch = files.slice(start, start + 200)
    const metadata = await Promise.all(batch.map(async (file) => {
      const stats = await fs.stat(file).catch(() => null)
      return { path: file, name: path.basename(file), size: stats?.size ?? 0 }
    }))
    inspected.push(...metadata)
  }
  return inspected
})

function createWindow() {
  win = new BrowserWindow({
    show: false,
    width: 1100,
    height: 760,
    minWidth: 760,
    minHeight: 600,
    title: 'Forma | Conversor de Imágenes',
    backgroundColor: '#f5f6f2',
    autoHideMenuBar: true,
    icon: path.join(process.env.VITE_PUBLIC, 'forma-logo.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })
  win.setMenuBarVisibility(false)
  win.once('ready-to-show', () => {
    win?.maximize()
    win?.show()
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(() => {
  Menu.setApplicationMenu(null)
  createWindow()
})
