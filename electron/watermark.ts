import fs from 'node:fs/promises'
import sharp from 'sharp'
import type { Sharp } from 'sharp'
import type { WatermarkSettings } from '../shared/advanced-settings.ts'

function escapeXml(value: string) {
  return value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[character]!)
}

export async function applyWatermark(image: Sharp, settings: WatermarkSettings) {
  if (settings.mode === 'none' || settings.opacity === 0) return image
  const { data, info } = await image.png().toBuffer({ resolveWithObject: true })
  const margin = Math.min(settings.margin, Math.floor((Math.min(info.width, info.height) - 1) / 2))
  const maxWidth = Math.max(1, info.width - margin * 2)
  const maxHeight = Math.max(1, info.height - margin * 2)
  const width = Math.min(maxWidth, Math.max(1, Math.round(info.width * settings.size / 100)))
  let overlay: Sharp
  if (settings.mode === 'text') {
    const height = Math.max(1, Math.round(width * .22))
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><text x="0" y="${height * .8}" font-family="sans-serif" font-size="${height * .85}" fill="${settings.color}" textLength="${width}" lengthAdjust="spacingAndGlyphs">${escapeXml(settings.text)}</text></svg>`
    overlay = sharp(Buffer.from(svg))
  } else {
    const stat = await fs.stat(settings.imagePath)
    if (!stat.isFile() || stat.size > 20 * 1024 * 1024) throw new Error('La imagen de marca debe ser un archivo de hasta 20 MB.')
    overlay = sharp(settings.imagePath, { limitInputPixels: 40000000 }).rotate()
    const metadata = await overlay.metadata()
    if (!['png', 'jpeg', 'webp'].includes(metadata.format ?? '') || (metadata.pages ?? 1) > 1) throw new Error('La marca debe ser una imagen PNG, JPEG o WebP sin animación.')
  }
  const prepared = await overlay.resize({ width, height: maxHeight, fit: 'inside' }).toColourspace('srgb').ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  for (let offset = 3; offset < prepared.data.length; offset += 4) prepared.data[offset] = Math.round(prepared.data[offset] * settings.opacity / 100)
  const left = settings.position === 'center' ? Math.floor((info.width - prepared.info.width) / 2)
    : settings.position.endsWith('right') ? info.width - margin - prepared.info.width : margin
  const top = settings.position === 'center' ? Math.floor((info.height - prepared.info.height) / 2)
    : settings.position.startsWith('bottom') ? info.height - margin - prepared.info.height : margin
  return sharp(data).composite([{ input: prepared.data, raw: { width: prepared.info.width, height: prepared.info.height, channels: 4 }, left, top }])
}
