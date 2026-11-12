import type { Language } from './locale'
const english: Record<string, string> = {
  'Los ajustes de imagen no son válidos.': 'Invalid image adjustments.',
  'WebP sin pérdida no admite peso objetivo.': 'Lossless WebP cannot use target file size.',
  'No se pudo leer una carpeta vigilada. Revisa sus permisos y disponibilidad.': 'A watched folder could not be read. Check its permissions and availability.',
  'El peso objetivo admite JPEG, WebP y AVIF.': 'Target file size supports JPEG, WebP and AVIF.',
  'El peso objetivo admite hasta 40 megapíxeles.': 'Target file size supports images up to 40 megapixels.',
  'La calidad mínima no puede superar la calidad elegida.': 'Minimum quality cannot exceed the selected quality.',
  'No se pudo alcanzar el peso objetivo. Permite reducir dimensiones, baja la calidad mínima o aumenta el límite.': 'Could not reach the target size. Allow smaller dimensions, lower minimum quality or increase the limit.',
  'Las carpetas vigilada y de destino deben estar separadas, sin contenerse entre sí.': 'Watched and output folders must be separate and must not contain each other.',
  'Selecciona carpetas absolutas de origen y destino.': 'Select valid source and output folders.',
  'El origen debe ser una carpeta.': 'The source must be a folder.',
  'El nombre debe tener entre 1 y 60 caracteres.': 'The preset name must have 1 to 60 characters.',
  'Ya existe un ajuste con ese nombre.': 'A preset with that name already exists.',
  'Puedes guardar hasta 100 ajustes.': 'You can save up to 100 presets.',
  'No se encontró el ajuste que quieres actualizar.': 'The preset to update was not found.',
  'No se encontró el ajuste que quieres eliminar.': 'The preset to delete was not found.',
  'No se pudo leer la configuración guardada. Se conserva el archivo original.': 'Saved settings could not be read. The original file has been preserved.',
  'La configuración guardada no es compatible. Se conserva el archivo original.': 'Saved settings are not compatible. The original file has been preserved.',
  'Las dimensiones deben estar entre 1 y 30 000 píxeles.': 'Dimensions must be between 1 and 30,000 pixels.',
  'El porcentaje debe estar entre 1 y 400.': 'Percentage must be between 1 and 400.',
  'La calidad debe ser un número entero entre 1 y 100.': 'Quality must be an integer between 1 and 100.',
  'Activa la numeración si quieres reemplazar el nombre original.': 'Enable numbering to replace the original name.',
  'El nombre resultante no es válido para Windows o supera los 240 caracteres. Revisa el prefijo y el sufijo.': 'The output name is not valid for Windows or exceeds 240 characters. Check the prefix and suffix.',
  'Los prefijos y sufijos no pueden contener caracteres reservados de Windows y admiten hasta 60 caracteres.': 'Prefixes and suffixes must not contain reserved Windows characters and support up to 60 characters.',
  'La numeración debe comenzar entre 1 y 999 999 999 y usar de 1 a 9 dígitos mínimos.': 'Numbering must start between 1 and 999,999,999 with 1 to 9 minimum digits.',
  'El texto de la marca debe tener entre 1 y 120 caracteres en una sola línea.': 'Watermark text must have 1 to 120 characters on one line.',
  'Selecciona una imagen válida para la marca de agua.': 'Select a valid watermark image.',
  'El color de la marca no es válido.': 'Watermark color is not valid.',
  'La imagen de marca debe ser un archivo de hasta 20 MB.': 'The watermark image must be a file up to 20 MB.',
  'La marca debe ser una imagen PNG, JPEG o WebP sin animación.': 'The watermark must be a non-animated PNG, JPEG or WebP image.',
  'Las marcas de agua en GIF animados todavía no están disponibles. Desactiva la marca o elige un formato estático.': 'Watermarks on animated GIFs are not supported yet. Disable the watermark or choose a static format.',
  'Las marcas de agua admiten hasta 40 megapíxeles tanto en el original como en el resultado. Reduce la ampliación o desactiva la marca.': 'Watermarks support up to 40 megapixels in both source and output. Reduce enlargement or disable the watermark.',
  'La vista previa admite hasta 40 megapíxeles tanto en el original como en el resultado.': 'Preview supports up to 40 megapixels in both source and output.',
  'El peso objetivo debe estar entre 1 y 100 000 KB y la calidad entre 1 y 100.': 'Target size must be 1 to 100,000 KB and quality must be 1 to 100.',
  'El tamaño debe estar entre 5 y 80 %, la opacidad entre 0 y 100 % y el margen entre 0 y 500 píxeles.': 'Size must be 5 to 80%, opacity 0 to 100%, and margin 0 to 500 pixels.',
  'Ya hay una conversión en curso.': 'A conversion, preview or folder watcher is already running.',
}
export function toolMessage(error: unknown, language: Language): string {
  const message = error instanceof Error ? error.message.replace(/^Error invoking remote method '[^']+': (?:Error: )?/, '') : ''
  if (language === 'en') return english[message] || (/^[A-Z][a-z]/.test(message) && Object.values(english).includes(message) ? message : 'The operation failed. Check the settings, files and folder permissions.')
  if ((error as { code?: string })?.code === 'ENOENT') return 'No se encontró el archivo o la carpeta.'
  return /^(La |Las |El |Los |No |Una |Un |Selecciona |Ya |Puedes |Revisa |Se |Activa )/.test(message) ? message : 'No se pudo completar la operación. Revisa las opciones, archivos y permisos.'
}
