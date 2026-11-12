# Forma 2.0 · Meta y criterios de entrega

## Estado actual · 12 de noviembre de 2026

Según informa el propietario, Forma 2.0 ya fue enviada a Microsoft Store y está pendiente de aprobación. Este estado procede de su comunicación; no se ha consultado Partner Center. La 2.0 está en main, con tag v2.0.0. Su compilación 43254721865 terminó correctamente y genera un release borrador sin R2. La prueba 43252700285 pasó en ES/EN. El envío no acredita aprobación, publicación efectiva ni todos los escenarios de instalación y actualización; los resultados históricos siguientes se conservan con ese alcance.

## Objetivo

Publicar **Forma 2.0.0** como única edición gratuita cuando las ocho herramientas estén completas y verificadas. El código de trabajo prepara la versión 2.0.0; la última entrega publicada referida por este plan es 1.3.0. Cambiar los metadatos locales no constituye una publicación.

## Herramientas implementadas en desarrollo

- [x] Redimensionado por ancho, alto, porcentaje y dimensiones máximas, conservando proporciones.
- [x] Ajustes personalizados: crear, aplicar, actualizar, eliminar y persistir.
- [x] Organización por subcarpetas con raíces de origen y validación del destino.
- [x] Renombrado por lotes con prefijos, sufijos, numeración y protección contra sobrescrituras.
- [x] Marcas de agua de texto o imagen con posición, tamaño, margen y opacidad.
- [x] Vista previa sin modificar originales ni guardar resultados.
- [x] Peso objetivo para JPEG, WebP y AVIF, con calidad mínima y reducción opcional de dimensiones. Si no alcanza el límite, no guarda un resultado mayor.
- [x] Carpeta vigilada con espera de archivos estables, subcarpetas, procesamiento opcional de existentes y bloqueo de destinos que se contengan con el origen.

La vigilancia funciona solo mientras Forma está abierta. Se inicia y detiene manualmente; no se registra un servicio ni un arranque con Windows. Usa una copia de las opciones al iniciarse. Mientras está activa, se bloquean conversiones manuales y cambios de opciones. Un archivo que falla se vuelve a intentar al modificarse. Las marcas sobre GIF animados se rechazan explícitamente; no se descarta silenciosamente su animación.

## Validación de desarrollo

- [x] Tipos y compilación de la aplicación española.
- [x] 33 pruebas automatizadas: dimensiones, EXIF, seis formatos, marcas, nombres, colisiones, persistencia, peso objetivo, vigilancia, recuperación de errores de lectura y manejo de respuestas de Store.
- [x] Electron real: API, idiomas, conversión, reintentos, cancelación, cierre seguro, vista previa, subcarpetas y vigilancia.
- [x] Verificar la variante inglesa con herramientas, ajustes por interfaz, vista previa y cambio ES/EN.
- [x] Completar revisión visual con opciones expandidas, teclado y tamaños de ventana reducidos (760 × 600); Tab permanece en el diálogo y Escape lo cierra.
- [x] Verificar migración de preferencias básicas en Electron y validación de secuencias de numeración.
- [x] Ampliar pruebas de permisos y cierre durante vigilancia: recuperación de subcarpetas inaccesibles sin duplicar trabajos; Electron espera al codificador activo antes de cerrar y conserva un AVIF válido.

Comprobaciones locales del 12 de noviembre de 2026: escritorio español con cierre durante conversión manual; escritorio español e inglés con cierre durante vigilancia; compilación inglesa y 30 pruebas del motor aprobadas. La recuperación de permisos se prueba con errores de lectura inyectados en el motor; no sustituye la validación de instalación en equipos con políticas restrictivas. `npm run test:desktop:watch-close` reproduce el cierre durante vigilancia después de compilar; para inglés, compilar la variante inglesa y ejecutar `node scripts/run-desktop-tests.mjs en --watch-close`.

Se generó un APPX local firmado **Forma Preview 2.0.0.0**, con identidad independiente, ES/EN y sin actualizaciones automáticas. Se verificaron firma criptográfica, manifiesto e integridad de los 87 archivos del mapa de bloques. Este paquete de prueba no acredita instalación ni actualizaciones de Microsoft Store.

Las pruebas de consulta de Store verifican la invocación oculta de PowerShell/WinRT, límites de tiempo/salida, respuestas con/sin actualizaciones y fallos de conexión, proceso o JSON. Sustituyen el ejecutor de PowerShell por una respuesta controlada; no acreditan identidad heredada del APPX ni acceso real a los servicios de Store. Esas comprobaciones siguen pendientes en la puerta de publicación.

Tras sincronizar los metadatos a 2.0.0 se repitieron regresiones, 33 pruebas automatizadas, compilación española y escritorio español: aprobados. El escritorio parte ahora de un marcador de novedades 1.3.0 y preferencias básicas antiguas, comprueba su migración y el contenido nuevo del aviso 2.0.0. Esto valida datos de migración, sin acreditar una actualización instalada mediante NSIS o Store. La variante inglesa y los paquetes finales deben volver a validarse con estos metadatos.

Paquete local posterior: `release/local-2.0.0/forma-setup-2.0.0.appx`, identidad habitual de Forma, versión APPX 2.0.0.0 y aplicación 2.0.0. Compilación española con ES/EN; firma local verificada criptográficamente, mapa de bloques de 91 archivos válido y JavaScript/HTML empaquetados iguales a la compilación actual. Incluye licencia de Forma e inventario generado de terceros. SHA-256: `88211F9A75B091196A2C42F0BBC38C15F1DB364A1B6AAABBA190DBD455C2066B`. Entregado para instalación manual, sin instalarlo automáticamente. No acredita certificación, instalación ni actualización real de Store. La compilación inglesa 2.0.0 pasó; su escritorio y paquetes siguen pendientes de revalidar.

## Puerta de publicación 2.0

GitHub Actions [43238483621](https://github.com/deimisq/forma-conversor-imagenes/actions/runs/43238483621) completó correctamente ambos trabajos ES/EN para el commit `a2d28ea`: tipos, regresiones, escritorio con cierre manual y vigilado y generación de EXE/APPX. Los artefactos se entregaron para pruebas, sin release estable ni carga a R2. La verificación adicional de contenido usa `scripts/verify-windows-package.ps1`: compara código compilado y empaquetado, metadatos, manifiesto, mapa de bloques, avisos y proveedor/canal de actualización. Pasó sobre el APPX local español; su ejecución en CI para ambos pares de paquetes se comprueba por separado. La presencia de un EXE válido no prueba su instalación.

- [ ] Cerrar cualquier fallo detectado durante la validación final.
- [ ] Revisar avisos y licencias de los componentes que se distribuyen.
- [x] Generar y verificar EXE y APPX ES/EN de prueba en CI. Revalidar los paquetes del tag antes de publicación estable.
- [ ] Probar instalación limpia y actualización sobre 1.3.0 conservando idioma y preferencias.
- [ ] Verificar el APPX instalado desde Store, incluida consulta de actualizaciones con/sin conexión.
- [x] Sincronizar `package.json`, lockfile, metadatos de novedades, ambos changelogs y documentación en 2.0.0. La fecha incluida es de preparación y debe confirmarse al autorizar la publicación.
- [ ] Publicar el tag y verificar GitHub Actions, paquetes y metadatos de actualización.
- [x] Enviar el APPX a Microsoft Store: comunicado por el propietario el 12 de noviembre de 2026.
- [ ] Recibir aprobación de Microsoft Store y confirmar la versión disponible en la ficha.

No publicar un tag 2.0 ni sustituir paquetes existentes mientras falte la validación. El lanzamiento debe utilizar los canales EXE/GitHub y APPX/Store; R2 sigue siendo una copia opcional para descargas directas.

### Revisión de avisos de terceros

La compilación genera `generated/notices/THIRD-PARTY-NOTICES.txt`, un inventario JSON y las versiones de las bibliotecas nativas de Sharp. Los paquetes incluyen esos archivos y la licencia de Forma en `resources/licenses`; Electron conserva sus propios avisos junto al ejecutable. El inventario abarca los paquetes de producción instalados, incluidos componentes incorporados al JavaScript y paquetes opcionales presentes. No constituye por sí solo una verificación completa de cumplimiento.

Pendientes concretos de esta revisión:

- `lazy-val@1.0.5` declara MIT y autor Vladimir Krivosheev, pero ni el paquete instalado ni la raíz de su repositorio original incluyen el texto de licencia. El inventario lo marca `reviewRequired`; no se ha inventado un aviso de copyright.
- El paquete nativo de Sharp incluye una tabla de licencias de libvips y sus dependencias. Conservar esa tabla y las versiones no sustituye reunir los textos y fuentes correspondientes a los binarios LGPL distribuidos; falta cerrar y documentar ese conjunto antes de publicar.
- Verificar estos nuevos recursos dentro de los instaladores finales ES/EN. El APPX Preview ya entregado se construyó antes de añadir la generación consolidada de avisos.

## Datos locales y compatibilidad

La preferencia `background` en `preferences.json` guarda `closeAction` (`ask`, `hide`, `quit`) y `watchNotifications`. El valor inicial pregunta al cerrar y habilita avisos. Cancelar no guarda una elección; ocultar mantiene el proceso y la vigilancia activos, y salir conserva el cierre seguro. La selección se cambia en Herramientas avanzadas → Bandeja y notificaciones. Las notificaciones muestran inicio y resumen agrupado tras tres segundos sin nuevos resultados; al pulsarlas se restaura la ventana. No se configura inicio automático con Windows.

Las preferencias básicas e idioma conservan `preferences.json`. Las herramientas y ajustes usan `tools-settings.json`; en el primer uso se recuperan formato, calidad y destino antiguos. Los archivos dañados de herramientas se conservan y se informa del error. Las imágenes y previsualizaciones no se guardan en ese archivo. La vigilancia no se reanuda automáticamente tras reiniciar.

## English

Goal: release Forma 2.0.0 as the only free edition once all eight tools and release checks are complete. The development code implements advanced tools, target-size encoding for JPEG/WebP/AVIF, and a session-only folder watcher. Publication remains gated by bilingual desktop validation, real EXE/Store APPX installation and update checks, dependency notices, and synchronized release metadata. The published version remains 1.3.0 during development.
