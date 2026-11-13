import type { ConversionSettings, SavedSettings } from '../shared/advanced-settings.ts'
import type { WatchStatus } from '../electron/folder-watcher.ts'
export {}

declare global {
  interface Window {
    imageDesk: {
      selectDocuments: (kind: string) => Promise<string[]>
      convertDocuments: (value: import('../electron/documents.ts').DocumentRequest) => Promise<string[]>
      onDocumentProgress: (callback: (value: { done: number; total: number }) => void) => () => void
      openSponsors: () => Promise<void>
      getBackgroundPreferences: () => Promise<{ closeAction: 'ask' | 'hide' | 'quit'; watchNotifications: boolean }>
      setBackgroundPreferences: (value: { closeAction: 'ask' | 'hide' | 'quit'; watchNotifications: boolean }) => Promise<{ closeAction: 'ask' | 'hide' | 'quit'; watchNotifications: boolean }>
      watchStatus: () => Promise<WatchStatus>
      startWatching: (value: { source: string; outputDir: string; settings: ConversionSettings; includeExisting: boolean }) => Promise<WatchStatus>
      stopWatching: () => Promise<WatchStatus>
      onWatchState: (callback: (value: WatchStatus) => void) => () => void
      loadTools: () => Promise<SavedSettings>
      saveTools: (value: ConversionSettings & { outputDirectory: string }) => Promise<SavedSettings>
      savePreset: (value: { id?: string; name: string; settings: ConversionSettings }) => Promise<SavedSettings>
      deletePreset: (id: string) => Promise<SavedSettings>
      selectWatermark: () => Promise<string | null>
      preview: (value: ConversionSettings & { files: string[]; sequence?: number[]; outputDir: string }) => Promise<{ filename: string; width: number; height: number; animated: boolean; dataUrl: string; originalDataUrl: string; outputBytes: number }>
      getPreferences: () => Promise<{ format: 'jpeg' | 'png' | 'webp' | 'avif' | 'tiff' | 'gif'; quality: number; outputDir: string } | null>
      setPreferences: (value: { format: string; quality: number; outputDir: string }) => Promise<void>
      cancelInspection: () => Promise<void>
      getVersion: () => Promise<string>
      getLanguage: () => Promise<'es' | 'en'>
      setLanguage: (language: 'es' | 'en') => Promise<'es' | 'en'>
      checkForUpdates: () => Promise<void>
      openStoreUpdates: () => Promise<void>
      downloadUpdate: () => Promise<void>
      installUpdate: () => Promise<void>
      selectFiles: () => Promise<string[]>
      selectFolder: () => Promise<string[]>
      selectOutput: () => Promise<string | null>
      defaultOutput: () => Promise<string>
      inspectFiles: (paths: string[]) => Promise<{ files: { path: string; name: string; size: number; sourceRoot?: string }[]; errors: { path: string; message: string }[]; cancelled: boolean }>
      convert: (options: Partial<ConversionSettings> & { sequence?: number[]; sourceRoots?: Record<string, string>; files: string[]; outputDir: string; format: string; quality: number }) => Promise<{ total: number; completed: number; failed: number; cancelled: boolean; outputDir: string; inputBytes: number; outputBytes: number }>
      cancel: () => Promise<void>
      openFolder: (folder: string) => Promise<void>
      onProgress: (callback: (payload: { type: string; total?: number; completed?: number; failed?: number; cancelled?: boolean; input?: string; output?: string; outputSize?: number; status?: string; message?: string }) => void) => () => void
      onUpdateState: (callback: (payload: { status: 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error'; source?: 'store'; version?: string; percent?: number; message?: string }) => void) => () => void
      onDroppedFiles: (callback: (paths: string[]) => void) => () => void
    }
  }
}
