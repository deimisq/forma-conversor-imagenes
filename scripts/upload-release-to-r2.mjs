import fs from 'node:fs/promises'
import path from 'node:path'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

const version = JSON.parse(await fs.readFile('package.json', 'utf8')).version
const installerPath = path.resolve('release', version, `forma-setup-${version}.exe`)
const installer = await fs.readFile(installerPath)
const publicBaseUrl = process.env.R2_PUBLIC_BASE_URL?.trim().replace(/\/+$/, '')
const latestKey = 'forma-setup-latest.exe'
const versionedKey = `forma-setup-${version}.exe`

if (!publicBaseUrl) throw new Error('Falta R2_PUBLIC_BASE_URL: define la URL pública directa del bucket o dominio de descargas.')
const parsedBaseUrl = new URL(publicBaseUrl)
if (parsedBaseUrl.protocol !== 'https:' || parsedBaseUrl.username || parsedBaseUrl.password) {
  throw new Error('R2_PUBLIC_BASE_URL debe ser una URL HTTPS pública, sin credenciales embebidas.')
}

console.log(`Instalador: ${installerPath} (${installer.length} bytes)`)
console.log(`URL estable para Microsoft Store: ${publicBaseUrl}/${latestKey}`)
console.log(`URL versionada: ${publicBaseUrl}/${versionedKey}`)

if (process.argv.includes('--dry-run')) process.exit(0)

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
const contentType = 'application/vnd.microsoft.portable-executable'

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
  throw new Error(`La URL de Microsoft Store redirige (${response.status}) a otro host. Configura el dominio público de R2 sin redirección.`)
}
if (!response.ok) {
  throw new Error(`No se pudo verificar la URL pública de R2: HTTP ${response.status}. Comprueba el dominio y el acceso público al bucket.`)
}

console.log('Instalador publicado en Cloudflare R2.')
