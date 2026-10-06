import fs from 'node:fs/promises'
import path from 'node:path'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

const version = JSON.parse(await fs.readFile('package.json', 'utf8')).version
const releaseDir = path.resolve('release', version)
const publicBaseUrl = process.env.R2_PUBLIC_BASE_URL?.trim().replace(/\/+$/, '')

if (!publicBaseUrl) throw new Error('Falta R2_PUBLIC_BASE_URL: define la URL pública directa del bucket o dominio de descargas.')
const parsedBaseUrl = new URL(publicBaseUrl)
if (parsedBaseUrl.protocol !== 'https:' || parsedBaseUrl.username || parsedBaseUrl.password) {
  throw new Error('R2_PUBLIC_BASE_URL debe ser una URL HTTPS pública, sin credenciales embebidas.')
}

let accountId = process.env.R2_ACCOUNT_ID?.trim()
const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim()
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim()
const bucket = process.env.R2_BUCKET_NAME?.trim()

if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
  throw new Error('Faltan R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY o R2_BUCKET_NAME.')
}

// Limpiar accountId si se pegó la URL completa del endpoint de R2 por error
if (accountId.includes('r2.cloudflarestorage.com')) {
  const match = accountId.match(/(?:https?:\/\/)?([^.]+)\.r2\.cloudflarestorage\.com/)
  if (match) {
    accountId = match[1]
  }
} else if (accountId.startsWith('https://')) {
  try {
    const url = new URL(accountId)
    accountId = url.hostname.split('.')[0]
  } catch (e) {
    // ignorar error
  }
}

const client = new S3Client({
  region: 'auto',
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  forcePathStyle: true,
  credentials: { accessKeyId, secretAccessKey },
})

// Buscar instaladores generados (.exe, .appx, .msix)
const supportedExtensions = ['.exe', '.appx', '.msix']
const filesToUpload = []

try {
  const dirEntries = await fs.readdir(releaseDir)
  for (const file of dirEntries) {
    const ext = path.extname(file).toLowerCase()
    if (supportedExtensions.includes(ext)) {
      filesToUpload.push({
        filePath: path.join(releaseDir, file),
        ext,
      })
    }
  }
} catch (e) {
  throw new Error(`No se pudo leer la carpeta de release (${releaseDir}): ${e.message}`)
}

if (filesToUpload.length === 0) {
  throw new Error(`No se encontraron instaladores (.exe, .appx, .msix) en ${releaseDir}`)
}

function getContentType(ext) {
  if (ext === '.exe') return 'application/vnd.microsoft.portable-executable'
  if (ext === '.appx' || ext === '.msix') return 'application/appx'
  return 'application/octet-stream'
}

for (const item of filesToUpload) {
  const installer = await fs.readFile(item.filePath)
  const ext = item.ext
  const versionedKey = `forma-setup-${version}${ext}`
  const latestKey = `forma-setup-latest${ext}`
  const contentType = getContentType(ext)

  console.log(`\nArchivo: ${item.filePath} (${installer.length} bytes)`)
  console.log(`URL estable: ${publicBaseUrl}/${latestKey}`)
  console.log(`URL versionada: ${publicBaseUrl}/${versionedKey}`)

  if (process.argv.includes('--dry-run')) continue

  await client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: versionedKey,
    Body: installer,
    ContentLength: installer.length,
    ContentType: contentType,
    CacheControl: 'public, max-age=31536000, immutable',
  }))

  await client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: latestKey,
    Body: installer,
    ContentLength: installer.length,
    ContentType: contentType,
    CacheControl: 'no-store, no-cache, must-revalidate, max-age=0',
  }))

  const response = await fetch(`${publicBaseUrl}/${latestKey}`, { method: 'HEAD', redirect: 'manual' })
  if (response.status >= 300 && response.status < 400) {
    throw new Error(`La URL (${latestKey}) redirige (${response.status}) a otro host. Configura el dominio público de R2 sin redirección.`)
  }
  if (!response.ok) {
    throw new Error(`No se pudo verificar la URL pública de R2 para ${latestKey}: HTTP ${response.status}. Comprueba el dominio y el acceso público al bucket.`)
  }
}

if (process.argv.includes('--dry-run')) {
  console.log('\n[Dry Run] Simulación completada.')
} else {
  console.log('\nInstalador(es) publicado(s) exitosamente en Cloudflare R2.')
}
