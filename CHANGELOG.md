# Registro de cambios

## Sin publicar · Desarrollo posterior a 2.0

- Añade apoyo voluntario mediante GitHub Sponsors en la pantalla principal, sin desbloqueo de funciones.
- Compara original/resultado, selecciona la imagen del lote y muestra el peso real del archivo codificado.
- Añade recorte central, relleno de lienzo, fondo JPEG, giro, espejos y escala de grises.
- Permite incluir perfil sRGB sin EXIF, JPEG progresivo y WebP sin pérdida.
- Añade ejemplos Web/Catálogo e importación/exportación de ajustes JSON sin rutas de marcas.
- Mantiene compatibilidad de ajustes anteriores y documenta la investigación de próximas herramientas.

Estos cambios no forman parte del tag 2.0.0 ni del paquete enviado a Store. [Estado y límites](docs/NEXT_VERSION.md).

## [2.0.0] - En preparación, sin publicar

- Muestra banderas también en las opciones del selector de idioma, con navegación por teclado.
- Ajusta el texto completo de las marcas de agua sin recortar su final; conserva proporciones y coincidencia con la vista previa.

- Pregunta si cerrar u ocultar en la bandeja del sistema, permite recordar y cambiar la elección y mantiene la vigilancia mientras está oculta.
- Notifica el inicio y el resultado agrupado de conversiones vigiladas; permite desactivar los avisos y abrir Forma desde una notificación.

- Incluye todas las herramientas en una única aplicación gratuita.
- Redimensiona por ancho, alto, porcentaje y límites conservando proporciones.
- Crea, aplica, actualiza y elimina ajustes personalizados persistentes.
- Conserva subcarpetas y renombra con prefijos, sufijos y numeración sin sobrescribir resultados.
- Añade marcas de texto o imagen y previsualiza sin modificar originales.
- Ajusta JPEG, WebP y AVIF a un peso objetivo; reduce dimensiones solo con permiso e informa si no alcanza el límite.
- Vigila carpetas durante la sesión, espera archivos estables y termina la conversión activa al cerrar.
- Detecta el idioma del equipo al primer inicio y conserva la selección posterior del usuario.
- Consulta actualizaciones de APPX mediante Store y conserva GitHub para EXE.
- Migra preferencias y amplía pruebas de herramientas, errores, teclado y cierre seguro.

Pendientes de publicación y validaciones: [criterios de entrega](V2_RELEASE.md).

## [1.3.0] - 2026-11-06

- Muestra las novedades de la versión una sola vez al abrir la app después de actualizar; funciona sin conexión y respeta el idioma guardado.

- Cierre seguro durante conversiones; búsqueda cancelable con errores visibles.
- Valida IPC y restringe navegación, ventanas, permisos y recursos del renderer.
- Optimiza las colas grandes, añade reintento de fallidos y recuerda las opciones.
- Muestra el tamaño final y ahorro; conserva el destino real del lote.
- Mejora el teclado, progreso accesible y movimiento reducido.
- Amplía pruebas de formatos, animación, entradas corruptas, cancelación y cierre.

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
