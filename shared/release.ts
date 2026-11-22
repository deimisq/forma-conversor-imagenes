// Update this metadata together with package.json and both changelogs.
export const currentRelease = {
  version: '2.1.0',
  date: '2026-11-22', // Preparation date; confirm when publication is authorized.
  notes: {
    es: [
      'Nuevas herramientas de documentos: combina imágenes en un PDF (o uno por imagen) y exporta las páginas de un PDF a PNG o JPEG, con contraseña si hace falta.',
      'Convierte a ICO, a JPEG XL (beta), HEIC a PNG (beta), páginas TIFF y GIF/WebP animados a WebP.',
      'Acepta también entradas JFIF, JPE, JPEG XL, SVGZ y BMP.',
      'Compara original y resultado, elige una imagen del lote y consulta el peso real del archivo.',
      'Recorta o rellena el lienzo, gira, voltea y convierte a escala de grises.',
      'Opciones de salida: perfil sRGB sin EXIF, JPEG progresivo y WebP sin pérdida.',
      'Ajustes de ejemplo para Web y Catálogo, e importación y exportación de ajustes en JSON.',
      'Apoyo voluntario mediante GitHub Sponsors, sin desbloquear funciones.',
      'Más fiabilidad: la vigilancia y las conversiones se cancelan por separado y no se instala una actualización con trabajo en curso.',
    ],
    en: [
      'New document tools: combine images into one PDF (or one per image) and export PDF pages to PNG or JPEG, with a password when needed.',
      'Convert to ICO and JPEG XL (beta), HEIC to PNG (beta), TIFF pages, and animated GIF/WebP to WebP.',
      'Also accepts JFIF, JPE, JPEG XL, SVGZ and BMP inputs.',
      'Compare original and result, pick an image from the batch and see the real file size.',
      'Crop or pad the canvas, rotate, flip and convert to grayscale.',
      'Output options: sRGB profile without EXIF, progressive JPEG and lossless WebP.',
      'Web and Catalog example presets, plus JSON import and export of presets.',
      'Voluntary support through GitHub Sponsors, without unlocking features.',
      'More reliable: folder watching and conversions cancel separately, and updates are not installed while work is running.',
    ],
  },
}
