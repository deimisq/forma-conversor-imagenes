import { contextBridge, ipcRenderer, webUtils } from 'electron'

contextBridge.exposeInMainWorld('imageDesk', {
  watchStatus: () => ipcRenderer.invoke('tools:watch-status'),
  startWatching: (value: unknown) => ipcRenderer.invoke('tools:watch-start', value),
  stopWatching: () => ipcRenderer.invoke('tools:watch-stop'),
  onWatchState: (callback: (value: unknown) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, value: unknown) => callback(value)
    ipcRenderer.on('tools:watch-state', listener)
    return () => ipcRenderer.removeListener('tools:watch-state', listener)
  },
  loadTools: () => ipcRenderer.invoke('tools:load'),
  saveTools: (value: unknown) => ipcRenderer.invoke('tools:preferences', value),
  savePreset: (value: unknown) => ipcRenderer.invoke('tools:preset-save', value),
  deletePreset: (id: string) => ipcRenderer.invoke('tools:preset-delete', id),
  selectWatermark: () => ipcRenderer.invoke('tools:watermark'),
  preview: (value: unknown) => ipcRenderer.invoke('tools:preview', value),
  getPreferences: () => ipcRenderer.invoke('preferences:read'),
  setPreferences: (value: unknown) => ipcRenderer.invoke('preferences:write', value),
  cancelInspection: () => ipcRenderer.invoke('files:cancel-inspection'),
  getVersion: () => ipcRenderer.invoke('app:version'),
  getLanguage: () => ipcRenderer.invoke('app:language'),
  setLanguage: (language: 'es' | 'en') => ipcRenderer.invoke('app:set-language', language),
  checkForUpdates: () => ipcRenderer.invoke('updates:check'),
  openStoreUpdates: () => ipcRenderer.invoke('updates:open-store'),
  downloadUpdate: () => ipcRenderer.invoke('updates:download'),
  installUpdate: () => ipcRenderer.invoke('updates:install'),
  selectFiles: () => ipcRenderer.invoke('files:select'),
  selectFolder: () => ipcRenderer.invoke('files:select-folder'),
  selectOutput: () => ipcRenderer.invoke('folder:select-output'),
  defaultOutput: () => ipcRenderer.invoke('folder:default-output'),
  inspectFiles: (paths: string[]) => ipcRenderer.invoke('files:inspect', paths),
  convert: (options: unknown) => ipcRenderer.invoke('conversion:start', options),
  cancel: () => ipcRenderer.invoke('conversion:cancel'),
  openFolder: (folder: string) => ipcRenderer.invoke('folder:open', folder),
  onProgress: (callback: (payload: unknown) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, payload: unknown) => callback(payload)
    ipcRenderer.on('conversion:progress', listener)
    return () => ipcRenderer.removeListener('conversion:progress', listener)
  },
  onUpdateState: (callback: (payload: unknown) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, payload: unknown) => callback(payload)
    ipcRenderer.on('updates:state', listener)
    return () => ipcRenderer.removeListener('updates:state', listener)
  },
  onDroppedFiles: (callback: (paths: string[]) => void) => {
    const listener = (event: DragEvent) => {
      if (event.type !== 'drop' || !event.dataTransfer) return
      const paths = Array.from(event.dataTransfer.files).map((file) => webUtils.getPathForFile(file)).filter(Boolean)
      if (paths.length) {
        event.preventDefault()
        callback(paths)
      }
    }
    window.addEventListener('drop', listener)
    return () => window.removeEventListener('drop', listener)
  },
})
