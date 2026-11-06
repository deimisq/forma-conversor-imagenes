// Update this metadata together with package.json and both changelogs.
export const currentRelease = {
  version: '1.3.0',
  date: '2026-11-06',
  notes: {
    es: [
      'Cierre seguro: se detiene la cola y finalizan los archivos activos antes de salir.',
      'Búsqueda de imágenes cancelable con información sobre rutas inaccesibles.',
      'Reintenta únicamente los archivos fallidos y conserva los resultados correctos.',
      'Recuerda el formato, la calidad y la carpeta de destino entre sesiones.',
      'Muestra el tamaño final y el ahorro o aumento del último lote.',
      'Mejor rendimiento en lotes grandes, seguridad y navegación por teclado.',
      'Aviso de novedades una sola vez después de cada actualización.',
    ],
    en: [
      'Safe closing stops queued work and finishes active files before exiting.',
      'Cancel image searches and see which paths could not be accessed.',
      'Retry only failed files while keeping successful results.',
      'Format, quality and output folder are remembered between sessions.',
      'See output size and savings or growth for the last batch.',
      'Improved large batch performance, security and keyboard navigation.',
      'Release notes appear once after each update.',
    ],
  },
}
