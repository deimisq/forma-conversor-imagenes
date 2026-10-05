import { contextBridge, ipcRenderer, webUtils } from 'electron'

contextBridge.exposeInMainWorld('imageDesk', {
  getVersion: () => ipcRenderer.invoke('app:version'),
  checkForUpdates: () => ipcRenderer.invoke('updates:check'),
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
