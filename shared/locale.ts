declare const __APP_LANGUAGE__: string

export type Language = 'es' | 'en'
export const defaultLanguage: Language = __APP_LANGUAGE__ === 'en' ? 'en' : 'es'
export let language: Language = defaultLanguage

export function isLanguage(value: unknown): value is Language {
  return value === 'es' || value === 'en'
}

export function setLanguage(value: Language): void {
  if (!isLanguage(value)) throw new Error('Unsupported language')
  language = value
}

const english: Record<string, string> = {
  'Idioma': 'Language',
  'No se pudo guardar el idioma.': 'Could not save your language preference.',
  'Ligero y moderno': 'Lightweight and modern',
  'Ideal para fotografía': 'Ideal for photos',
  'Con transparencia': 'Supports transparency',
  'Máxima compresión': 'Maximum compression',
  'Alta calidad': 'High quality',
  'Animaciones compatibles': 'Supports animation',
  'Buscando actualizaciones': 'Checking for updates',
  'Descargar': 'Download',
  'Descargando': 'Downloading',
  'Instalar y reiniciar': 'Install and restart',
  'Buscar actualizaciones': 'Check for updates',
  'No se pudo iniciar la conversión.': 'Could not start conversion.',
  'Abre Forma en Windows para acceder a tus archivos.': 'Open Forma on Windows to access your files.',
  'No se pudo conectar con la aplicación de escritorio.': 'Could not connect to the desktop app.',
  'Procesamiento local': 'Local processing',
  'CONVERSIÓN POR LOTES': 'BATCH IMAGE CONVERSION',
  'Tus imágenes,': 'Your images,',
  'en otro formato.': 'in a new format.',
  'Convierte cientos de archivos': 'Convert hundreds of files',
  'sin subirlos a ningún servidor.': 'without uploading them to a server.',
  'Archivos para convertir': 'Files to convert',
  'Archivos': 'Files',
  'Vaciar lista': 'Clear list',
  'Procesando': 'Processing',
  'Suelta tus imágenes aquí': 'Drop your images here',
  'o haz clic para explorar tus archivos': 'or click to browse your files',
  'Elegir archivos': 'Choose files',
  'Añadir carpeta': 'Add folder',
  'Quitar': 'Remove',
  'Convirtiendo': 'Converting',
  'Listo': 'Done',
  'Error': 'Error',
  'Cancelada': 'Cancelled',
  'En cola': 'Queued',
  'Añadir más imágenes': 'Add more images',
  'de': 'of',
  'convertidas': 'converted',
  'en total': 'total',
  'Opciones de conversión': 'Conversion options',
  'Configuración': 'Settings',
  'Formato de salida': 'Output format',
  'Calidad': 'Quality',
  'Menor tamaño': 'Smaller file',
  'Mayor calidad': 'Higher quality',
  'Guardar en': 'Save to',
  'Deteniendo…': 'Stopping…',
  'Convirtiendo imágenes': 'Converting images',
  'Conversión detenida': 'Conversion stopped',
  'Conversión finalizada': 'Conversion finished',
  'Todo listo': 'All done',
  'Cancelar conversión': 'Cancel conversion',
  'Convertir': 'Convert',
  'imagen': 'image',
  'imágenes': 'images',
  'Abrir carpeta de destino': 'Open output folder',
  'Tus archivos nunca salen de este equipo': 'Your files never leave this computer',
  'Salida automática:': 'Output folder:',
  'Suelta para añadir imágenes': 'Drop to add images',
  'No se pudo consultar GitHub Releases.': 'Could not check GitHub Releases.',
  'Actualización disponible': 'Update available',
  'No se pudo convertir.': 'Could not convert image.',
  'Imágenes': 'Images',
  'Imagenes convertidas': 'Converted images',
  'Forma | Conversor de Imágenes': 'Forma | Image Converter',
  'Ya hay una conversión en curso.': 'A conversion is already running.',
  'Opciones de conversión inválidas.': 'Invalid conversion options.',
  'Las actualizaciones se gestionan desde Microsoft Store.': 'Updates are managed by Microsoft Store.',
}

export function t(text: string, locale: Language = language): string {
  return locale === 'en' ? english[text] ?? text : text
}
