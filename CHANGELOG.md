# Registro de cambios

## [1.2.0] - 2026-10-28

- Añade selector de idioma ES / EN con banderas SVG locales, accesibilidad por teclado y cambio inmediato sin reiniciar.
- Guarda la preferencia de idioma localmente y la restaura en próximos inicios; traduce también diálogos y notificaciones.
- Publica ambas variantes con canales de actualización y URLs de descarga separados; declara ambos idiomas en los manifiestos APPX.
- Sincroniza la versión 1.2.0 en los metadatos, el lockfile y la documentación; documenta los pasos para Microsoft Store en español e inglés.

- Añade una variante inglesa de interfaz, diálogos, notificaciones e instaladores, conservando la compilación española.
- Evita sobrescribir resultados cuando varios trabajadores convierten archivos con el mismo nombre.
- Elimina duplicados de la cola al importar carpetas y bloquea cambios del lote durante una conversión.
- Informa errores de archivos eliminados después de agregarlos y muestra los errores generales del lote.
- Ajusta la lista virtual a la altura de la ventana.
- Delega actualizaciones APPX en Microsoft Store y separa el canal de actualizaciones inglés de NSIS.
- Añade validación de opciones de conversión y pruebas de regresión con imágenes reales.

- Se agregaron los valores de Cloudflare R2 y la URL estable para Microsoft Store.
- Añade una política de privacidad pública para la distribución de Forma.

## [1.1.1] - 2026-10-05

- Mantiene el instalador NSIS estándar para actualizar instalaciones previas sin páginas de mantenimiento personalizadas.
- Conserva las comprobaciones de versión y descarga desde GitHub Releases dentro de la app.
- Nombra el instalador `forma-setup-X.Y.Z.exe`, el ejecutable `Forma.exe` y la carpeta de instalación nueva `Forma`.

## [1.1.0] - 2026-10-05

- Publica instaladores Windows en GitHub Releases desde tags SemVer.
- Comprueba actualizaciones al iniciar y cada seis horas; permite descargarlas e instalarlas desde la aplicación.
- Configura el instalador para actualizar una instalación previa con el mismo identificador de producto.

## [1.0.2] - 2026-10-05

- Inicia la ventana maximizada y oculta el menú de Electron.
- Ajusta el diseño al área de trabajo disponible.
- Usa la misma marca SVG para el encabezado, la ventana y los recursos del instalador.
- Muestra la versión del paquete en la aplicación.
- Maneja sin errores la vista previa abierta fuera de Electron.
