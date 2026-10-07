import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pngToIco from 'png-to-ico'
import sharp from 'sharp'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const source = path.join(root, 'src', 'assets', 'forma-logo.svg')
const pngPath = path.join(root, 'public', 'forma-logo.png')
const icoPath = path.join(root, 'assets', 'forma-logo.ico')
const appxDir = path.join(root, 'build', 'appx')

// Crear directorios si no existen
await fs.mkdir(path.dirname(pngPath), { recursive: true })
await fs.mkdir(path.dirname(icoPath), { recursive: true })
await fs.mkdir(appxDir, { recursive: true })

// Generar PNG principal e ICO ejecutable
await sharp(source).resize(256, 256).png().toFile(pngPath)
await fs.writeFile(icoPath, await pngToIco(pngPath))

// Mosaicos y assets requeridos por la Microsoft Store (AppX)
const appxAssets = [
  { name: 'Square44x44Logo.png', width: 44, height: 44 },
  { name: 'Square71x71Logo.png', width: 71, height: 71 },
  { name: 'Square150x150Logo.png', width: 150, height: 150 },
  { name: 'Square310x310Logo.png', width: 310, height: 310 },
  { name: 'Wide310x150Logo.png', width: 310, height: 150 },
  { name: 'StoreLogo.png', width: 50, height: 50 },
  { name: 'SplashScreen.png', width: 620, height: 300 }
]

for (const asset of appxAssets) {
  const outputPath = path.join(appxDir, asset.name)
  await sharp(source)
    .resize(asset.width, asset.height, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png()
    .toFile(outputPath)
}

console.log('✅ Íconos e imágenes de mosaico AppX creados correctamente.')
