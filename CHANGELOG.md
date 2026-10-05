# Registro de cambios

## [1.1.1] - 2026-10-05

- Mantiene el instalador NSIS estándar para actualizar instalaciones previas sin páginas de mantenimiento personalizadas.
- Conserva las comprobaciones de versión y descarga desde GitHub Releases dentro de la app.

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