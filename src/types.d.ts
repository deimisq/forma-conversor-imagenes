export {}

declare global {
  interface Window {
    imageDesk: {
      getPreferences: () => Promise<{ format: 'jpeg' | 'png' | 'webp' | 'avif' | 'tiff' | 'gif'; quality: number; outputDir: string } | null>
      setPreferences: (value: { format: string; quality: number; outputDir: string }) => Promise<void>
      cancelInspection: () => Promise<void>
      getVersion: () => Promise<string>
      getLanguage: () => Promise<'es' | 'en'>
      setLanguage: (language: 'es' | 'en') => Promise<'es' | 'en'>
      checkForUpdates: () => Promise<void>
      downloadUpdate: () => Promise<void>
      installUpdate: () => Promise<void>
      selectFiles: () => Promise<string[]>
      selectFolder: () => Promise<string[]>
      selectOutput: () => Promise<string | null>
      defaultOutput: () => Promise<string>
      inspectFiles: (paths: string[]) => Promise<{ files: { path: string; name: string; size: number }[]; errors: { path: string; message: string }[]; cancelled: boolean }>
      convert: (options: { files: string[]; outputDir: string; format: string; quality: number }) => Promise<{ total: number; completed: number; failed: number; cancelled: boolean; outputDir: string; inputBytes: number; outputBytes: number }>
      cancel: () => Promise<void>
      openFolder: (folder: string) => Promise<void>
      onProgress: (callback: (payload: { type: string; total?: number; completed?: number; failed?: number; cancelled?: boolean; input?: string; output?: string; outputSize?: number; status?: string; message?: string }) => void) => () => void
      onUpdateState: (callback: (payload: { status: 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error'; version?: string; percent?: number; message?: string }) => void) => () => void
      onDroppedFiles: (callback: (paths: string[]) => void) => () => void
    }
  }
}
