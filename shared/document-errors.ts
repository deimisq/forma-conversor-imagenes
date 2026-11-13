// Only these known document messages may cross IPC without the generic fallback.
export const documentErrors: Record<string, { es: string; en: string }> = {
  "Invalid document paths / Rutas de documento inválidas": {
    "es": "Rutas de documento inválidas",
    "en": "Invalid document paths"
  },
  "Invalid page options / Opciones de página inválidas": {
    "es": "Opciones de página inválidas",
    "en": "Invalid page options"
  },
  "Select one PDF / Selecciona un PDF": {
    "es": "Selecciona un PDF",
    "en": "Select one PDF"
  },
  "Cancelled / Cancelado": {
    "es": "Cancelado",
    "en": "Cancelled"
  },
  "PDF image data exceeds 128 MB / Las imágenes del PDF superan 128 MB": {
    "es": "Las imágenes del PDF superan 128 MB",
    "en": "PDF image data exceeds 128 MB"
  },
  "Select TIFF / Selecciona TIFF": {
    "es": "Selecciona TIFF",
    "en": "Select TIFF"
  },
  "Empty page range / Rango vacío": {
    "es": "Rango vacío",
    "en": "Empty page range"
  },
  "Select animated GIF/WebP, maximum 500 frames / Selecciona GIF/WebP animado, máximo 500 fotogramas": {
    "es": "Selecciona GIF/WebP animado, máximo 500 fotogramas",
    "en": "Select animated GIF/WebP, maximum 500 frames"
  },
  "PDF exceeds 100 MB / PDF supera 100 MB": {
    "es": "PDF supera 100 MB",
    "en": "PDF exceeds 100 MB"
  },
  "Missing or incorrect PDF password / Falta la contraseña del PDF o es incorrecta": {
    "es": "Falta la contraseña del PDF o es incorrecta",
    "en": "Missing or incorrect PDF password"
  },
  "Page range is empty / Rango de páginas vacío": {
    "es": "Rango de páginas vacío",
    "en": "Page range is empty"
  },
  "Page exceeds 40 megapixels / Página supera 40 megapíxeles": {
    "es": "Página supera 40 megapíxeles",
    "en": "Page exceeds 40 megapixels"
  },
  "Unsupported BMP header / Cabecera BMP no compatible": {
    "es": "Cabecera BMP no compatible",
    "en": "Unsupported BMP header"
  },
  "BMP requires 24/32-bit uncompressed RGB, maximum 40 MP / BMP requiere RGB sin compresión de 24/32 bits, máximo 40 MP": {
    "es": "BMP requiere RGB sin compresión de 24/32 bits, máximo 40 MP",
    "en": "BMP requires 24/32-bit uncompressed RGB, maximum 40 MP"
  },
  "Truncated BMP / BMP incompleto": {
    "es": "BMP incompleto",
    "en": "Truncated BMP"
  },
  "Input exceeds 160 MB / Entrada supera 160 MB": {
    "es": "Entrada supera 160 MB",
    "en": "Input exceeds 160 MB"
  },
  "HEIC exceeds 100 MB / HEIC supera 100 MB": {
    "es": "HEIC supera 100 MB",
    "en": "HEIC exceeds 100 MB"
  },
  "No HEIC image / No se encontró imagen HEIC": {
    "es": "No se encontró imagen HEIC",
    "en": "No HEIC image"
  },
  "HEIC exceeds 40 MP / HEIC supera 40 MP": {
    "es": "HEIC supera 40 MP",
    "en": "HEIC exceeds 40 MP"
  },
  "HEIC decoding failed / Falló la decodificación HEIC": {
    "es": "Falló la decodificación HEIC",
    "en": "HEIC decoding failed"
  },
  "JPEG XL decoding timed out / La decodificación JPEG XL agotó el tiempo": {
    "es": "La decodificación JPEG XL agotó el tiempo",
    "en": "JPEG XL decoding timed out"
  },
  "JPEG XL decoding failed / Falló la decodificación JPEG XL": {
    "es": "Falló la decodificación JPEG XL",
    "en": "JPEG XL decoding failed"
  },
  "JPEG XL exceeds 20 MB / JPEG XL supera 20 MB": {
    "es": "JPEG XL supera 20 MB",
    "en": "JPEG XL exceeds 20 MB"
  },
  "JPEG XL exceeds 16 MP / JPEG XL supera 16 MP": {
    "es": "JPEG XL supera 16 MP",
    "en": "JPEG XL exceeds 16 MP"
  }
}
