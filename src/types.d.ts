export {}

declare global {
  interface Window {
    imageDesk: {
      getVersion: () => Promise<string>
      checkForUpdates: () => Promise<void>
      downloadUpdate: () => Promise<void>
      installUpdate: () => Promise<void>
      selectFiles: () => Promise<string[]>
      selectFolder: () => Promise<string[]>
      selectOutput: () => Promise<string | null>
      defaultOutput: () => Promise<string>
      inspectFiles: (paths: string[]) => Promise<{ path: string; name: string; size: number }[]>
      convert: (options: { files: string[]; outputDir: string; format: string; quality: number }) => Promise<{ total: number; completed: number; failed: number; cancelled: boolean }>
      cancel: () => Promise<void>
      openFolder: (folder: string) => Promise<void>
      onProgress: (callback: (payload: { type: string; total?: number; completed?: number; failed?: number; cancelled?: boolean; input?: string; output?: string; status?: string; message?: string }) => void) => () => void
      onUpdateState: (callback: (payload: { status: 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error'; version?: string; percent?: number; message?: string }) => void) => () => void
      onDroppedFiles: (callback: (paths: string[]) => void) => () => void
    }
  }
}