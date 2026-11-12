import type { ConversionSettings } from './advanced-settings.ts'

export function plannedFilename(input: string, settings: ConversionSettings, index: number) {
  const filename = input.split(/[\\/]/).pop() ?? ''
  const dot = filename.lastIndexOf('.')
  const stem = dot > 0 ? filename.slice(0, dot) : filename
  const n = settings.naming
  const extension = settings.format === 'jpeg' ? 'jpg' : settings.format
  const number = String(n.start + index).padStart(n.padding, '0')
  const base = n.enabled
    ? `${n.prefix}${n.keepOriginalName ? stem : ''}${n.numbered ? `${n.keepOriginalName ? '-' : ''}${number}` : ''}${n.suffix}`
    : `${stem}-converted`
  const result = `${base}.${extension}`
  if (!base.trim() || /[<>:"/\\|?*\x00-\x1f]/.test(base) || /[. ]$/.test(base) || /^(?:con|prn|aux|nul|com[1-9¹²³]|lpt[1-9¹²³])(?:\.|$)/i.test(base) || result.length > 240) {
    throw new Error('El nombre resultante no es válido para Windows o supera los 240 caracteres. Revisa el prefijo y el sufijo.')
  }
  return result
}
