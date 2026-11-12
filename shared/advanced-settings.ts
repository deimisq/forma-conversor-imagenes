export type OutputFormat = 'jpeg' | 'png' | 'webp' | 'avif' | 'tiff' | 'gif'
export type ResizeMode = 'none' | 'width' | 'height' | 'percentage' | 'bounds' | 'cover' | 'contain'
export type ImageAdjustments = { background: string; rotation: 0 | 90 | 180 | 270; flip: boolean; flop: boolean; grayscale: boolean; metadata: 'strip' | 'color'; jpegProgressive: boolean; webpLossless: boolean }
export type ResizeSettings = { mode: ResizeMode; width: number; height: number; percentage: number; allowEnlargement: boolean }
export type NamingSettings = { enabled: boolean; prefix: string; suffix: string; numbered: boolean; start: number; padding: number; keepOriginalName: boolean }
export type WatermarkSettings = { mode: 'none' | 'text' | 'image'; text: string; imagePath: string; color: string; size: number; opacity: number; margin: number; position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center' }
export type TargetSettings = { enabled: boolean; maxKB: number; minQuality: number; allowResize: boolean }
export type ConversionSettings = { adjustments: ImageAdjustments; target: TargetSettings; format: OutputFormat; quality: number; resize: ResizeSettings; preserveFolders: boolean; naming: NamingSettings; watermark: WatermarkSettings }
export type Preferences = ConversionSettings & { outputDirectory: string }
export type SavedPreset = { id: string; name: string; settings: ConversionSettings }
export type SavedSettings = { version: 1; preferences: Preferences; presets: SavedPreset[] }

export function defaultSettings(): ConversionSettings {
  return { adjustments: { background: '#ffffff', rotation: 0, flip: false, flop: false, grayscale: false, metadata: 'strip', jpegProgressive: false, webpLossless: false }, target: { enabled: false, maxKB: 500, minQuality: 30, allowResize: false }, format: 'webp', quality: 84, resize: { mode: 'none', width: 1920, height: 1080, percentage: 50, allowEnlargement: false }, preserveFolders: false,
    naming: { enabled: false, prefix: '', suffix: '', numbered: false, start: 1, padding: 3, keepOriginalName: true },
    watermark: { mode: 'none', text: '© Mi marca', imagePath: '', color: '#ffffff', size: 25, opacity: 65, margin: 20, position: 'bottom-right' } }
}

export function validateSettings(value: unknown): ConversionSettings {
  if (!value || typeof value !== 'object') throw new Error('La configuración no es válida.')
  const settings = value as Record<string, unknown>
  if (typeof settings.format !== 'string' || !['jpeg', 'png', 'webp', 'avif', 'tiff', 'gif'].includes(settings.format)) throw new Error('El formato de salida no está permitido.')
  if (typeof settings.quality !== 'number' || !Number.isInteger(settings.quality) || settings.quality < 1 || settings.quality > 100) throw new Error('La calidad debe ser un número entero entre 1 y 100.')
  const defaults = defaultSettings()
  const resize = settings.resize ?? defaults.resize
  if (!resize || typeof resize !== 'object') throw new Error('El redimensionado no es válido.')
  const r = resize as Record<string, unknown>
  if (typeof r.mode !== 'string' || !['none', 'width', 'height', 'percentage', 'bounds', 'cover', 'contain'].includes(r.mode)) throw new Error('El modo de redimensionado no es válido.')
  for (const dimension of ['width', 'height'] as const) {
    if (typeof r[dimension] !== 'number' || !Number.isInteger(r[dimension]) || r[dimension] < 1 || r[dimension] > 30000) throw new Error('Las dimensiones deben estar entre 1 y 30 000 píxeles.')
  }
  if (typeof r.percentage !== 'number' || !Number.isFinite(r.percentage) || r.percentage < 1 || r.percentage > 400) throw new Error('El porcentaje debe estar entre 1 y 400.')
  if (typeof r.allowEnlargement !== 'boolean') throw new Error('La opción de ampliación no es válida.')
  if (settings.preserveFolders !== undefined && typeof settings.preserveFolders !== 'boolean') throw new Error('La opción de subcarpetas no es válida.')
  const target = settings.target ?? defaults.target
  if (!target || typeof target !== 'object') throw new Error('El peso objetivo no es válido.')
  const g = target as Record<string, unknown>
  if (typeof g.enabled !== 'boolean' || typeof g.allowResize !== 'boolean' || !Number.isInteger(g.maxKB) || (g.maxKB as number) < 1 || (g.maxKB as number) > 100000 || !Number.isInteger(g.minQuality) || (g.minQuality as number) < 1 || (g.minQuality as number) > 100) throw new Error('El peso objetivo debe estar entre 1 y 100 000 KB y la calidad entre 1 y 100.')
  if (g.enabled && !['jpeg', 'webp', 'avif'].includes(settings.format)) throw new Error('El peso objetivo admite JPEG, WebP y AVIF.')
  if (g.enabled && (g.minQuality as number) > settings.quality) throw new Error('La calidad mínima no puede superar la calidad elegida.')
  const naming = settings.naming ?? defaults.naming
  const adjustments = settings.adjustments ?? defaults.adjustments
  if (!adjustments || typeof adjustments !== 'object') throw new Error('Los ajustes de imagen no son válidos.')
  const a = adjustments as Record<string, unknown>
  if (typeof a.background !== 'string' || !/^#[0-9a-f]{6}$/i.test(a.background) || ![0, 90, 180, 270].includes(a.rotation as number) || !['strip', 'color'].includes(a.metadata as string) || ['flip', 'flop', 'grayscale', 'jpegProgressive', 'webpLossless'].some(key => typeof a[key] !== 'boolean')) throw new Error('Los ajustes de imagen no son válidos.')
  if (g.enabled && settings.format === 'webp' && a.webpLossless) throw new Error('WebP sin pérdida no admite peso objetivo.')
  const watermark = settings.watermark ?? defaults.watermark
  validateNaming(naming)
  validateWatermark(watermark)
  return { adjustments: { ...(adjustments as ImageAdjustments) }, target: { ...(target as TargetSettings) }, format: settings.format as OutputFormat, quality: settings.quality,
    resize: { mode: r.mode as ResizeMode, width: r.width as number, height: r.height as number, percentage: r.percentage, allowEnlargement: r.allowEnlargement },
    preserveFolders: (settings.preserveFolders as boolean | undefined) ?? false,
    naming: { ...(naming as NamingSettings) }, watermark: { ...(watermark as WatermarkSettings) } }
}

function validateNaming(value: unknown): asserts value is NamingSettings {
  if (!value || typeof value !== 'object') throw new Error('El renombrado no es válido.')
  const n = value as Record<string, unknown>
  for (const key of ['enabled', 'numbered', 'keepOriginalName']) if (typeof n[key] !== 'boolean') throw new Error('Las opciones de renombrado no son válidas.')
  for (const key of ['prefix', 'suffix']) if (typeof n[key] !== 'string' || n[key].length > 60 || /[<>:"/\\|?*\x00-\x1f]/.test(n[key])) throw new Error('Los prefijos y sufijos no pueden contener caracteres reservados de Windows y admiten hasta 60 caracteres.')
  if (!Number.isInteger(n.start) || (n.start as number) < 1 || (n.start as number) > 999999999 || !Number.isInteger(n.padding) || (n.padding as number) < 1 || (n.padding as number) > 9) throw new Error('La numeración debe comenzar entre 1 y 999 999 999 y usar de 1 a 9 dígitos mínimos.')
  if (n.enabled && !n.keepOriginalName && !n.numbered) throw new Error('Activa la numeración si quieres reemplazar el nombre original.')
}

function validateWatermark(value: unknown): asserts value is WatermarkSettings {
  if (!value || typeof value !== 'object') throw new Error('La marca de agua no es válida.')
  const w = value as Record<string, unknown>
  if (typeof w.mode !== 'string' || !['none', 'text', 'image'].includes(w.mode) || typeof w.position !== 'string' || !['top-left', 'top-right', 'bottom-left', 'bottom-right', 'center'].includes(w.position)) throw new Error('El tipo o la posición de la marca de agua no son válidos.')
  if (typeof w.text !== 'string' || w.text.length > 120 || /[\x00-\x1f]/.test(w.text) || (w.mode === 'text' && !w.text.trim())) throw new Error('El texto de la marca debe tener entre 1 y 120 caracteres en una sola línea.')
  if (typeof w.imagePath !== 'string' || w.imagePath.includes('\0') || (w.mode === 'image' && !/^(?:[A-Za-z]:[\\/]|\\\\[^\\/]+[\\/][^\\/]+|\/)/.test(w.imagePath))) throw new Error('Selecciona una imagen válida para la marca de agua.')
  if (typeof w.color !== 'string' || !/^#[0-9a-f]{6}$/i.test(w.color)) throw new Error('El color de la marca no es válido.')
  for (const [key, min, max] of [['size', 5, 80], ['opacity', 0, 100], ['margin', 0, 500]] as const) {
    if (typeof w[key] !== 'number' || !Number.isInteger(w[key]) || w[key] < min || w[key] > max) throw new Error('El tamaño debe estar entre 5 y 80 %, la opacidad entre 0 y 100 % y el margen entre 0 y 500 píxeles.')
  }
}
