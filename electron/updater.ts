import { app, BrowserWindow, Notification, shell } from 'electron'
import electronUpdater from 'electron-updater'
import { t, defaultLanguage } from '../shared/locale'
import { checkStoreUpdates } from './store-updates'

const { autoUpdater } = electronUpdater

export const storeManaged = process.windowsStore === true
let updateCheckInProgress = false
export const updateCheckInterval = 6 * 60 * 60 * 1000

autoUpdater.autoDownload = false
// English installers must never update to the Spanish release feed.
if (defaultLanguage === 'en') autoUpdater.channel = 'en'
autoUpdater.autoInstallOnAppQuit = false
autoUpdater.allowPrerelease = false
autoUpdater.allowDowngrade = false

function sendUpdateState(state: Record<string, unknown>) {
  for (const window of BrowserWindow.getAllWindows()) window.webContents.send('updates:state', state)
}

export async function checkForUpdates() {
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
      sendUpdateState({ status: available ? 'available' : 'not-available', source: 'store', message: t(available ? 'Hay actualizaciones en Microsoft Store.' : 'No hay actualizaciones disponibles en Microsoft Store.') })
    } catch {
      sendUpdateState({ status: 'error', source: 'store', message: t('No se pudo consultar Microsoft Store.') })
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

export function openStoreUpdates() {
  return storeManaged ? shell.openExternal('ms-windows-store://downloadsandupdates') : undefined
}

export async function downloadUpdate() {
  if (!app.isPackaged || storeManaged) return
  sendUpdateState({ status: 'downloading', percent: 0 })
  await autoUpdater.downloadUpdate()
}

// `busy` lets the caller veto restarting while any work is running.
export function installUpdate(busy: () => boolean) {
  if (!app.isPackaged || storeManaged || busy()) return
  autoUpdater.quitAndInstall(false, true)
}
