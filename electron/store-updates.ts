import { execFile } from 'node:child_process'
import path from 'node:path'

// Windows PowerShell provides the built-in WinRT projection. The child process
// inherits the APPX identity; never run this query for an unpackaged EXE.
const query = `
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Runtime.WindowsRuntime
$null = [Windows.Services.Store.StoreContext, Windows.Services.Store, ContentType=WindowsRuntime]
$null = [Windows.Services.Store.StorePackageUpdate, Windows.Services.Store, ContentType=WindowsRuntime]
$context = [Windows.Services.Store.StoreContext]::GetDefault()
$operation = $context.GetAppAndOptionalStorePackageUpdatesAsync()
$resultType = [System.Collections.Generic.IReadOnlyList[Windows.Services.Store.StorePackageUpdate]]
$method = [System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { $_.Name -eq 'AsTask' -and $_.IsGenericMethod -and $_.GetGenericArguments().Count -eq 1 -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation\u00601' } | Select-Object -First 1
$task = $method.MakeGenericMethod($resultType).Invoke($null, @($operation))
if (-not $task.Wait(30000)) { throw 'Microsoft Store update query timed out.' }
@{ available = ($task.Result.Count -gt 0) } | ConvertTo-Json -Compress
`

export function checkStoreUpdates(run: typeof execFile = execFile): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const powershell = path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe')
    run(powershell, ['-NoProfile', '-NonInteractive', '-EncodedCommand', Buffer.from(query, 'utf16le').toString('base64')],
      { windowsHide: true, timeout: 40000, maxBuffer: 65536 }, (error, stdout) => {
        if (error) { reject(new Error('No se pudo consultar Microsoft Store.')); return }
        try {
          const result = JSON.parse(stdout.replace(/^\uFEFF/, '').trim())
          if (typeof result.available !== 'boolean') throw new Error('Invalid Store response')
          resolve(result.available)
        } catch { reject(new Error('No se pudo consultar Microsoft Store.')) }
      })
  })
}
