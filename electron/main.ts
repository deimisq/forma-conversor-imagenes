import { t, language, defaultLanguage, isLanguage, setLanguage, systemLanguage } from '../shared/locale'
import { startFolderWatcher, type WatchStatus } from './folder-watcher.ts'
import { toolMessage } from '../shared/tool-errors.ts'
import { collectImageEntries, supportedInputs } from './files.ts'
import { runDocumentWorker } from './document-runner.ts'
import { checkStoreUpdates } from './store-updates'
import { currentRelease } from '../shared/release'
import { consumeReleaseNotice } from './release-notice'
import { readLanguage, writeLanguage, readConversionPreferences, writeConversionPreferences } from './preferences'
import { readBackgroundPreferences, writeBackgroundPreferences, type BackgroundPreferences } from './preferences'
import { createOutputEncoder, createPreview, destinationDirectory, validateConversionOptions, writeNamedOutput } from './conversion.ts'
import type { ConversionOptions } from './conversion.ts'
import { createSettingsStore } from './settings-store.ts'
import { plannedFilename } from '../shared/naming.ts'
import { existsSync } from 'node:fs'
import { app, BrowserWindow, dialog, ipcMain, Menu, Notification, shell, Tray } from 'electron'
import fs from 'node:fs/promises'
import { fileURLToPath, pathToFileURL } from 'node:url'
import path from 'node:path'
import electronUpdater from 'electron-updater'

const { autoUpdater } = electronUpdater

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
let cancelRequested = false
let conversionInProgress = false
let closeAfterConversion = false
let inspectionCancelled = false
let inspectionInProgress = false
let releaseNoticePending = false
let background: BackgroundPreferences = { closeAction: 'ask', watchNotifications: true }
let tray: Tray | undefined
let exiting = false
let closePromptOpen = false
const local = (es: string, en: string) => language === 'en' ? en : es
function restoreWindow() { if (!win || win.isDestroyed()) return; win.setSkipTaskbar(false); if (win.isMinimized()) win.restore(); win.show(); win.focus() }
function requestExit() { exiting = true; win?.close() }
function ensureTray() {
  if (!tray) {
    tray = new Tray(path.join(process.env.VITE_PUBLIC!, 'forma-logo.png'))
    tray.on('click', restoreWindow)
    tray.on('double-click', restoreWindow)
    tray.on('right-click', () => { updateTray(); tray?.popUpContextMenu() })
  }
  updateTray()
}
function updateTray() {
  if (!tray) return
  tray.setToolTip(watcherState.active ? local('Forma · Vigilando carpeta', 'Forma · Watching folder') : 'Forma')
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: local('Abrir Forma', 'Open Forma'), click: restoreWindow },
    { label: local('Detener vigilancia', 'Stop watching'), enabled: watcherState.active, click: () => { folderWatcher?.stop(); cancelRequested = true } },
    { type: 'separator' },
    { label: local('Salir de Forma', 'Quit Forma'), click: requestExit },
  ]))
}
function notifyWatch(title: string, body: string) {
  if (!background.watchNotifications || !Notification.isSupported() || exiting) return
  try { const notice = new Notification({ title, body, silent: true }); notice.on('click', restoreWindow); notice.show() }
  catch (error) { console.error('Watch notification:', error) }
}
let watchNoticeTimer: ReturnType<typeof setTimeout> | undefined
let watchNoticeCompleted = 0
let watchNoticeFailed = 0
function flushWatchNotice() {
  clearTimeout(watchNoticeTimer); watchNoticeTimer = undefined
  if (watchNoticeCompleted || watchNoticeFailed) notifyWatch(local('Carpeta vigilada · Resultado', 'Watched folder · Result'), local(`${watchNoticeCompleted} imágenes convertidas; ${watchNoticeFailed} errores.`, `${watchNoticeCompleted} images converted; ${watchNoticeFailed} errors.`))
  watchNoticeCompleted = 0; watchNoticeFailed = 0
}
const storeManaged = process.windowsStore === true
let updateCheckInProgress = false
const updateCheckInterval = 6 * 60 * 60 * 1000

autoUpdater.autoDownload = false
// English installers must never update to the Spanish release feed.
if (defaultLanguage === 'en') autoUpdater.channel = 'en'
autoUpdater.autoInstallOnAppQuit = false
autoUpdater.allowPrerelease = false
autoUpdater.allowDowngrade = false

function sendUpdateState(state: Record<string, unknown>) {
  for (const window of BrowserWindow.getAllWindows()) window.webContents.send('updates:state', state)
}

async function checkForUpdates() {
  if (app.getVersion().includes('-preview.')) {
    sendUpdateState({ status: 'not-available', message: t('Esta versión de prueba no recibe actualizaciones.') })
    return
  }
  if (storeManaged) {
    if (updateCheckInProgress) return
    updateCheckInProgress = true
    sendUpdateState({ status: 'checking', source: 'store' })
    try {
      const available = await checkStoreUpdates()
      sendUpdateState({ status: available ? 'available' : 'not-available', source: 'store', message: available ? 'Hay actualizaciones en Microsoft Store.' : 'No hay actualizaciones disponibles en Microsoft Store.' })
    } catch {
      sendUpdateState({ status: 'error', source: 'store', message: 'No se pudo consultar Microsoft Store.' })
    } finally { updateCheckInProgress = false }
    return
  }
  if (!app.isPackaged || updateCheckInProgress) return
  updateCheckInProgress = true
  try {
    await autoUpdater.checkForUpdates()
  } catch (error) {
    sendUpdateState({ status: 'error', message: error instanceof Error ? error.message : t('No se pudo consultar GitHub Releases.') })
  } finally {
    updateCheckInProgress = false
  }
}

autoUpdater.on('checking-for-update', () => sendUpdateState({ status: 'checking' }))
autoUpdater.on('update-available', (info) => {
  sendUpdateState({ status: 'available', version: info.version })
  if (Notification.isSupported() && BrowserWindow.getAllWindows().every((window) => !window.isFocused())) {
    new Notification({ title: t('Actualización disponible'), body: `Forma ${info.version} — ${t('Actualización disponible')}` }).show()
  }
})
autoUpdater.on('update-not-available', (info) => sendUpdateState({ status: 'not-available', version: info.version }))
autoUpdater.on('download-progress', (progress) => sendUpdateState({
  status: 'downloading',
  percent: Math.round(progress.percent),
  transferred: progress.transferred,
  total: progress.total,
}))
autoUpdater.on('update-downloaded', (info) => sendUpdateState({ status: 'downloaded', version: info.version }))
autoUpdater.on('update-cancelled', () => sendUpdateState({ status: 'available' }))
autoUpdater.on('error', (error) => sendUpdateState({ status: 'error', message: error.message }))


async function collectImages(paths: string[], errors: { path: string; message: string }[], roots: Record<string, string>): Promise<string[]> {
  const entries = await collectImageEntries(paths, { cancelled: () => inspectionCancelled, onError: (file, error) => errors.push({ path: file, message: toolMessage(error, language) }) })
  for (const entry of entries) roots[entry.path] = entry.sourceRoot
  return entries.map(entry => entry.path)
}

let watcherProcessing = false
function sendProgress(payload: Record<string, unknown>) {
  if (watcherProcessing) return
  for (const window of BrowserWindow.getAllWindows()) window.webContents.send('conversion:progress', payload)
}

async function convertBatch(options: ConversionOptions) {
  cancelRequested = false
  // Keep missing inputs in the batch so Sharp reports an error for each one.
  const files = [...new Map(options.files.map((file) => [path.resolve(file).toLowerCase(), file])).values()]
  const outputDir = options.outputDir || path.join(app.getPath('pictures'), t('Imagenes convertidas'))
  await fs.mkdir(outputDir, { recursive: true })
  let nextIndex = 0
  let completed = 0
  const totals = { total: files.length, completed: 0, failed: 0, cancelled: false, outputDir, inputBytes: 0, outputBytes: 0 }
  sendProgress({ type: 'start', ...totals })

  const worker = async () => {
    while (true) {
      if (cancelRequested) return
      const index = nextIndex++
      if (index >= files.length) return
      const input = files[index]
      sendProgress({ type: 'file', input, status: 'converting' })
      let output: string | undefined
      try {
        const directory = destinationDirectory(outputDir, input, options.sourceRoots[input] || path.dirname(input), options.preserveFolders)
        await fs.mkdir(directory, { recursive: true })
        const encoder = await createOutputEncoder(input, options)
        output = await writeNamedOutput(encoder, directory, plannedFilename(input, options, options.sequence?.[index] ?? index))
        const result = await fs.stat(output)
        const inputSize = (await fs.stat(input)).size
        totals.inputBytes += inputSize
        totals.outputBytes += result.size
        completed++
        totals.completed = completed
        sendProgress({ type: 'file', input, output, outputSize: result.size, status: 'done' })
      } catch (error) {
        if (output) await fs.unlink(output).catch(() => {})
        totals.failed++
        sendProgress({ type: 'file', input, status: 'error', message: toolMessage(error, language) })
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(3, files.length) }, worker))
  totals.cancelled = cancelRequested
  sendProgress({ type: 'finish', ...totals })
  return totals
}

function handle(channel: string, listener: (event: Electron.IpcMainInvokeEvent, ...args: any[]) => unknown) {
  ipcMain.handle(channel, async (event, ...args) => {
    const expected = VITE_DEV_SERVER_URL || pathToFileURL(path.join(RENDERER_DIST, 'index.html')).href
    if (!win || event.sender !== win.webContents || event.senderFrame !== win.webContents.mainFrame || event.senderFrame.url !== expected) throw new Error('Untrusted IPC sender')
    try { return await listener(event, ...args) }
    catch (error) { throw new Error(toolMessage(error, language)) }
  })
}
let settingsStore: ReturnType<typeof createSettingsStore> | undefined
function advancedStore() {
  return settingsStore ??= createSettingsStore(path.join(app.getPath('userData'), 'tools-settings.json'))
}
let folderWatcher: Awaited<ReturnType<typeof startFolderWatcher>> | undefined
let startingWatcher = false
let watcherState: WatchStatus = { active: false, processing: false, completed: 0, failed: 0, source: '', output: '' }
function reportWatcher(state: WatchStatus) {
  const previous = watcherState
  if (state.processing && !previous.processing && !watchNoticeTimer) {
    notifyWatch(local('Convirtiendo imágenes de la carpeta vigilada', 'Converting watched folder images'), path.basename(state.source))
  }
  watchNoticeCompleted += Math.max(0, state.completed - previous.completed)
  watchNoticeFailed += Math.max(0, state.failed - previous.failed)
  if (state.completed > previous.completed || state.failed > previous.failed) {
    clearTimeout(watchNoticeTimer)
    watchNoticeTimer = setTimeout(flushWatchNotice, 3000)
  }
  watcherState = state
  updateTray()
  for (const window of BrowserWindow.getAllWindows()) window.webContents.send('tools:watch-state', state)
}
handle('tools:watch-status', () => watcherState)
handle('app:background-read', () => background)
handle('app:background-write', async (_event, value: unknown) => {
  background = await writeBackgroundPreferences(app.getPath('userData'), value)
  if (!background.watchNotifications) { clearTimeout(watchNoticeTimer); watchNoticeTimer = undefined; watchNoticeCompleted = 0; watchNoticeFailed = 0 }
  return background
})
handle('tools:watch-stop', () => { folderWatcher?.stop(); cancelRequested = true; return watcherState })
handle('tools:watch-start', async (_event, value: unknown) => {
  if (startingWatcher || watcherState.active || conversionInProgress || previewInProgress) throw new Error('Ya hay una conversión en curso.')
  if (!value || typeof value !== 'object') throw new Error('Opciones de vigilancia inválidas.')
  const request = value as { source: string; outputDir: string; settings: unknown; includeExisting?: boolean }
  if (typeof request.source !== 'string' || typeof request.outputDir !== 'string' || (request.includeExisting !== undefined && typeof request.includeExisting !== 'boolean')) throw new Error('Opciones de vigilancia inválidas.')
  const validated = validateConversionOptions({ ...(request.settings as object), files: [request.source], outputDir: request.outputDir })
  startingWatcher = true
  let watchSequence = 0
  try {
    folderWatcher = await startFolderWatcher({ source: request.source, output: request.outputDir, includeExisting: request.includeExisting, extensions: supportedInputs,
      available: () => !conversionInProgress && !previewInProgress && !closeAfterConversion,
      report: reportWatcher,
      process: async (file, source, output) => {
        conversionInProgress = true; watcherProcessing = true
        try {
          const result = await convertBatch({ ...validated, files: [file], sequence: [watchSequence++], sourceRoots: { [file]: source }, outputDir: output })
          if (result.failed) throw new Error(t('No se pudo convertir.'))
        } finally { conversionInProgress = false; watcherProcessing = false; if (closeAfterConversion) win?.close() }
      },
    })
    return watcherState
  } finally { startingWatcher = false }
})
handle('tools:load', async () => {
  const exists = existsSync(path.join(app.getPath('userData'), 'tools-settings.json'))
  const store = advancedStore()
  const data = await store.load()
  if (!exists) {
    const legacy = await readConversionPreferences(app.getPath('userData'))
    if (legacy) return store.savePreferences({ ...data.preferences, format: legacy.format, quality: legacy.quality, outputDirectory: legacy.outputDir })
  }
  return data
})
handle('tools:preferences', (_event, value: unknown) => advancedStore().savePreferences(value))
handle('tools:preset-save', (_event, value: unknown) => advancedStore().savePreset(value))
handle('tools:preset-delete', (_event, id: unknown) => advancedStore().deletePreset(id))
handle('tools:watermark', async () => {
  const result = await dialog.showOpenDialog({ properties: ['openFile'], filters: [{ name: t('Imágenes'), extensions: ['png', 'jpg', 'jpeg', 'webp'] }] })
  return result.canceled ? null : result.filePaths[0]
})
let previewInProgress = false
handle('tools:preview', async (_event, value: unknown) => {
  if (conversionInProgress || previewInProgress || watcherState.active || startingWatcher) throw new Error('Ya hay una conversión en curso.')
  const options = validateConversionOptions(value)
  previewInProgress = true
  try { return await createPreview(options.files[0], options, options.sequence?.[0] ?? 0) }
  finally { previewInProgress = false; if (closeAfterConversion) win?.close() }
})
handle('preferences:read', () => readConversionPreferences(app.getPath('userData')))
handle('preferences:write', (_event, value: unknown) => writeConversionPreferences(app.getPath('userData'), value))

handle('files:select', async () => {
  const result = await dialog.showOpenDialog({ properties: ['openFile', 'multiSelections'], filters: [{ name: t('Imágenes'), extensions: [...supportedInputs].map((extension) => extension.slice(1)) }] })
  return result.canceled ? [] : result.filePaths
})

handle('files:select-folder', async () => {
  const result = await dialog.showOpenDialog({ properties: ['openDirectory'] })
  return result.canceled ? [] : result.filePaths
})

handle('folder:select-output', async () => {
  const result = await dialog.showOpenDialog({ properties: ['openDirectory', 'createDirectory'] })
  return result.canceled ? null : result.filePaths[0]
})
handle('folder:default-output', () => path.join(app.getPath('pictures'), t('Imagenes convertidas')))

handle('conversion:start', async (_event, options: ConversionOptions) => {
  if (conversionInProgress || previewInProgress || watcherState.active || startingWatcher) throw new Error('Ya hay una conversión en curso.')
  options = validateConversionOptions(options)
  conversionInProgress = true
  try {
    return await convertBatch(options)
  } finally {
    conversionInProgress = false
    if (closeAfterConversion) win?.close()
  }
})
handle('conversion:cancel', () => { cancelRequested = true })
handle('documents:select', async (_event, kind: string) => {
  const pdf = kind === 'pages'
  const result = await dialog.showOpenDialog({ properties: pdf ? ['openFile'] : ['openFile', 'multiSelections'], filters: [{ name: pdf ? 'PDF' : t('Imágenes'), extensions: pdf ? ['pdf'] : kind === 'heic' ? ['heic', 'heif'] : kind === 'tiff' ? ['tif', 'tiff'] : [...supportedInputs].map(extension => extension.slice(1)) }] })
  return result.canceled ? [] : result.filePaths
})
handle('documents:convert', async (_event, request: unknown) => {
  if (conversionInProgress || previewInProgress || watcherState.active || startingWatcher) throw new Error('Ya hay una conversión en curso.')
  conversionInProgress = true; cancelRequested = false
  try {
    return await runDocumentWorker(request, () => cancelRequested, (done, total) => win?.webContents.send('documents:progress', { done, total }))
  } finally { conversionInProgress = false; if (closeAfterConversion) win?.close() }
})
handle('folder:open', async (_event, folder: unknown) => {
  if (typeof folder !== 'string' || !path.isAbsolute(folder) || !(await fs.stat(folder)).isDirectory()) throw new Error(t('Carpeta inválida.'))
  const error = await shell.openPath(folder)
  if (error) throw new Error(error)
})
handle('app:version', () => app.getVersion())
handle('app:sponsor', () => shell.openExternal('https://github.com/sponsors/deimisq'))
handle('app:language', () => language)
let savingLanguage = false
handle('app:set-language', async (_event, value: unknown) => {
  if (!isLanguage(value) || savingLanguage) throw new Error(t('No se pudo guardar el idioma.'))
  savingLanguage = true
  try {
    await writeLanguage(app.getPath('userData'), value)
    setLanguage(value)
    updateTray()
    for (const window of BrowserWindow.getAllWindows()) window.setTitle(t('Forma | Conversor de Imágenes'))
    return value
  } finally {
    savingLanguage = false
  }
})
handle('updates:check', () => checkForUpdates())
handle('updates:open-store', () => storeManaged ? shell.openExternal('ms-windows-store://downloadsandupdates') : undefined)
handle('updates:download', async () => {
  if (!app.isPackaged || storeManaged) return
  sendUpdateState({ status: 'downloading', percent: 0 })
  await autoUpdater.downloadUpdate()
})
handle('updates:install', () => {
  if (!app.isPackaged || storeManaged || conversionInProgress) return
  autoUpdater.quitAndInstall(false, true)
})

handle('files:cancel-inspection', () => { inspectionCancelled = true })
handle('files:inspect', async (_event, filePaths: string[]) => {
  if (!Array.isArray(filePaths) || !filePaths.every((file) => typeof file === 'string' && path.isAbsolute(file))) throw new Error(t('Rutas inválidas.'))
  if (inspectionInProgress) throw new Error(t('Ya hay una búsqueda en curso.'))
  inspectionInProgress = true
  inspectionCancelled = false
  const errors: { path: string; message: string }[] = []
  try {
    const roots: Record<string, string> = Object.create(null)
    const files = await collectImages(filePaths, errors, roots)
    const inspected: { path: string; name: string; size: number; sourceRoot: string }[] = []
    for (let start = 0; start < files.length; start += 200) {
      if (inspectionCancelled) break
      const batch = files.slice(start, start + 200)
      const metadata = await Promise.all(batch.map(async (file) => {
        try {
          const stats = await fs.stat(file)
          return { path: file, name: path.basename(file), size: stats.size, sourceRoot: roots[file] }
        } catch (error) {
          errors.push({ path: file, message: error instanceof Error ? error.message : t('No se pudo leer el archivo.') })
          return null
        }
      }))
      for (const file of metadata) if (file) inspected.push(file)
    }
    return { files: inspected, errors, cancelled: inspectionCancelled }
  } finally { inspectionInProgress = false }
})

function createWindow() {
  win = new BrowserWindow({
    show: false,
    width: 1100,
    height: 760,
    minWidth: 760,
    minHeight: 600,
    title: t('Forma | Conversor de Imágenes'),
    backgroundColor: '#f5f6f2',
    autoHideMenuBar: true,
    icon: path.join(process.env.VITE_PUBLIC, 'forma-logo.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
    },
  })
  win.setMenuBarVisibility(false)
  win.on('query-session-end', () => { exiting = true })
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
  win.webContents.on('will-navigate', (event) => event.preventDefault())
  win.webContents.on('will-attach-webview', (event) => event.preventDefault())
  win.webContents.session.setPermissionRequestHandler((_contents, _permission, callback) => callback(false))
  win.on('close', (event) => {
    if (!exiting) {
      event.preventDefault()
      if (closePromptOpen) return
      void (async () => {
        closePromptOpen = true
        try {
          let action = background.closeAction
          if (action === 'ask') {
            const answer = await dialog.showMessageBox(win!, {
              type: 'question', title: 'Forma', message: local('¿Quieres cerrar Forma o mantenerla en la bandeja del sistema?', 'Quit Forma or keep it in the system tray?'),
              detail: local('Al ocultarla, la vigilancia y las conversiones continúan. Puedes abrirla o salir desde su icono junto al reloj.', 'When hidden, watching and conversions continue. Open or quit it using its icon beside the clock.'),
              buttons: [local('Cerrar Forma', 'Quit Forma'), local('Ocultar en la bandeja', 'Hide in tray'), local('Cancelar', 'Cancel')], defaultId: 1, cancelId: 2,
              checkboxLabel: local('Recordar mi elección', 'Remember my choice'), checkboxChecked: false, noLink: true,
            })
            if (answer.response === 2) return
            action = answer.response === 1 ? 'hide' : 'quit'
            if (answer.checkboxChecked) background = await writeBackgroundPreferences(app.getPath('userData'), { ...background, closeAction: action })
          }
          if (action === 'hide') { ensureTray(); win?.hide(); win?.setSkipTaskbar(true) }
          else requestExit()
        } catch (error) { console.error('Close action:', error); restoreWindow() }
        finally { closePromptOpen = false }
      })()
      return
    }
    folderWatcher?.stop()
    if (!conversionInProgress && !previewInProgress) return
    event.preventDefault()
    // Stop queued work, finish active encoders, then close without partial files.
    closeAfterConversion = true
    cancelRequested = true
  })
  win.once('ready-to-show', () => {
    win?.maximize()
    win?.show()
    if (releaseNoticePending && win) {
      releaseNoticePending = false
      const date = new Intl.DateTimeFormat(language === 'en' ? 'en-US' : 'es-UY', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(`${currentRelease.date}T00:00:00Z`))
      void dialog.showMessageBox(win, {
        type: 'info',
        title: `${t('Novedades de Forma')} ${app.getVersion()}`,
        message: `${t('Forma se actualizó a la versión')} ${app.getVersion()}`,
        detail: `${date}\n\n${currentRelease.notes[language].map((note) => `• ${note}`).join('\n\n')}`,
        buttons: [t('Entendido')],
        defaultId: 0,
        noLink: true,
      }).catch((error) => console.error('Release notice:', error))
    }
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

app.on('before-quit', () => { exiting = true; folderWatcher?.stop(); clearTimeout(watchNoticeTimer) })
app.on('will-quit', () => { tray?.destroy(); tray = undefined })

app.whenReady().then(async () => {
  if (process.platform === 'win32' && !storeManaged) app.setAppUserModelId('com.forma.imageconverter')
  background = await readBackgroundPreferences(app.getPath('userData'))
  setLanguage(await readLanguage(app.getPath('userData'), systemLanguage(app.getPreferredSystemLanguages())))
  try {
    releaseNoticePending = await consumeReleaseNotice(app.getPath('userData'), app.getVersion())
  } catch (error) {
    // A read-only profile must never prevent the app from opening.
    console.error('Release notice state:', error)
  }
  Menu.setApplicationMenu(null)
  createWindow()
  if (app.isPackaged && !storeManaged) {
    setTimeout(() => void checkForUpdates(), 10_000)
    setInterval(() => void checkForUpdates(), updateCheckInterval)
  }
})
