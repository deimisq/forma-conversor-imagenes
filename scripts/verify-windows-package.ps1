param(
  [Parameter(Mandatory=$true)][string]$OutputDirectory,
  [ValidateSet('es','en')][string]$Language = 'es',
  [switch]$AppxOnly
)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
$package = Get-Content (Join-Path $PSScriptRoot '../package.json') -Raw | ConvertFrom-Json
$stem = if ($Language -eq 'en') { 'forma-setup-en-' } else { 'forma-setup-' }
$appx = Join-Path $OutputDirectory ($stem + $package.version + '.appx')
$unpacked = Join-Path $OutputDirectory 'win-unpacked'
$verifyPayload = @'
const fs = require('node:fs');
const path = require('node:path');
const asar = require('@electron/asar');
const [directory, version, language, root] = process.argv.slice(1);
const archive = path.join(directory, 'resources', 'app.asar');
const metadata = JSON.parse(asar.extractFile(archive, 'package.json'));
if (metadata.version !== version || metadata.name !== 'imagen-lote') throw Error('Unexpected packaged application metadata');
for (const file of ['dist-electron/main.js', 'dist-electron/preload.mjs', 'dist/index.html']) {
  if (!asar.extractFile(archive, file).equals(fs.readFileSync(path.join(root, file)))) throw Error('Stale packaged code: ' + file);
}
if (!asar.extractFile(archive, 'dist/index.html').toString().includes('lang="' + language + '"')) throw Error('Wrong built HTML language');
'@
& node -e $verifyPayload $unpacked $package.version $Language (Join-Path $PSScriptRoot '..')
if ($LASTEXITCODE -ne 0) { throw 'Packaged application verification failed' }
$archive = [IO.Compression.ZipFile]::OpenRead((Resolve-Path -LiteralPath $appx))
try {
  $entries = @{}
  foreach ($entry in $archive.Entries) { $entries[[Uri]::UnescapeDataString($entry.FullName)] = $entry }
  function Read-PackageText([string]$Name) {
    if (-not $entries.ContainsKey($Name)) { throw "Missing package entry: $Name" }
    $reader = [IO.StreamReader]::new($entries[$Name].Open())
    try { $reader.ReadToEnd() } finally { $reader.Dispose() }
  }
  [xml]$manifest = Read-PackageText 'AppxManifest.xml'
  if ($manifest.Package.Identity.Name -ne 'DeimisQuintanilla.FormaConversordeImgenes') { throw 'Unexpected package identity' }
  if ($manifest.Package.Identity.Publisher -ne 'CN=5EE69F12-D1D5-44E6-810D-F3E75E2B3C3F') { throw 'Unexpected publisher' }
  if ($manifest.Package.Identity.Version -ne ($package.version + '.0')) { throw 'Unexpected APPX version' }
  if ($manifest.Package.Identity.ProcessorArchitecture -ne 'x64') { throw 'Unexpected architecture' }
  $languages = @($manifest.Package.Resources.Resource | ForEach-Object Language)
  $expectedLanguages = if ($Language -eq 'en') { @('en-US','es-ES') } else { @('es-ES','en-US') }
  if (($languages -join ',') -ne ($expectedLanguages -join ',')) { throw 'Unexpected package languages' }
  [xml]$blockMap = Read-PackageText 'AppxBlockMap.xml'
  $sha = [Security.Cryptography.SHA256]::Create()
  try {
    foreach ($file in $blockMap.BlockMap.File) {
      $name = $file.Name.Replace('\','/')
      $entry = $entries[$name]
      if (-not $entry -or $entry.Length -ne [long]$file.Size) { throw "Invalid package file: $name" }
      $stream = $entry.Open()
      try {
        $total = 0L
        foreach ($block in $file.Block) {
          $buffer = [byte[]]::new(65536)
          $count = 0
          do { $read = $stream.Read($buffer, $count, $buffer.Length - $count); $count += $read } while ($read -gt 0 -and $count -lt $buffer.Length)
          $total += $count
          if ([Convert]::ToBase64String($sha.ComputeHash($buffer,0,$count)) -ne $block.Hash) { throw "Invalid block hash: $name" }
        }
        if ($total -ne [long]$file.Size) { throw "Incomplete block map: $name" }
      } finally { $stream.Dispose() }
    }
    foreach ($relative in @('app.asar','licenses/Forma-LICENSE.txt','licenses/third-party/THIRD-PARTY-NOTICES.txt','licenses/third-party/dependencies.json','licenses/third-party/native-library-versions.json')) {
      $entry = $entries['app/resources/' + $relative]
      if (-not $entry -or $entry.Length -eq 0) { throw "Missing packaged resource: $relative" }
      $stream = $entry.Open()
      try { $hash = [Convert]::ToHexString($sha.ComputeHash($stream)) } finally { $stream.Dispose() }
      $diskHash = (Get-FileHash -LiteralPath (Join-Path $unpacked ('resources/' + $relative)) -Algorithm SHA256).Hash
      if ($hash -ne $diskHash) { throw "APPX resource differs from staging: $relative" }
    }
  } finally { $sha.Dispose() }
  foreach ($notice in @('LICENSE.electron.txt','LICENSES.chromium.html')) {
    if (-not $entries.ContainsKey('app/' + $notice)) { throw "Missing runtime notice: $notice" }
  }
  if (-not $AppxOnly) {
    $exe = Join-Path $OutputDirectory ($stem + $package.version + '.exe')
    $stream = [IO.File]::OpenRead((Resolve-Path -LiteralPath $exe))
    try { if ($stream.ReadByte() -ne 77 -or $stream.ReadByte() -ne 90 -or $stream.Length -lt 1MB) { throw 'Invalid EXE installer' } } finally { $stream.Dispose() }
    $feed = Get-Content (Join-Path $unpacked 'resources/app-update.yml') -Raw
    if ($feed -notmatch 'provider: github' -or $feed -notmatch 'owner: deimisq' -or $feed -notmatch 'repo: forma-conversor-imagenes') { throw 'Unexpected EXE update provider' }
    if ($Language -eq 'en' -and $feed -notmatch 'channel: en') { throw 'Missing English update channel' }
    if ($Language -eq 'es' -and $feed -match 'channel: en') { throw 'Spanish installer uses English channel' }
  }
  [pscustomobject]@{ Version=$package.version; Language=$Language; FilesVerified=@($blockMap.BlockMap.File).Count; Appx=$appx; ExeChecked=(-not $AppxOnly); InstallationTested=$false }
} finally { $archive.Dispose() }
