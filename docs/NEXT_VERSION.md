# Forma 2.1.0 · Cambios sobre 2.0

Estos cambios forman parte de **Forma 2.1.0**, actualización de la 2.0.0 ya enviada a Store (el tag `v2.0.0` y sus binarios no se modifican). La 2.1.0 requiere su propia validación antes de publicarse: ver [V2_RELEASE.md](../V2_RELEASE.md).

## Implementado

- Continuación: entrada y vista previa JPEG XL beta mediante worker independiente; PDF con contraseña temporal y exportación de páginas PNG/JPEG con calidad y DPI. 54 pruebas automatizadas aprobadas.

- [Nuevas herramientas de formatos](FORMAT_IMPLEMENTATION.md): PDF combinado/individual y páginas a PNG; ICO; exportación JXL beta; HEIC a PNG beta; páginas TIFF; WebP animado; entradas JFIF/JPE/SVGZ y BMP RGB sin compresión. Los límites y las validaciones pendientes se detallan en esa página.

- Botón visible de GitHub Sponsors en la barra superior, con icono de corazón, ES/EN, foco de teclado y etiqueta accesible cuando se reduce a icono. Abre únicamente `https://github.com/sponsors/deimisq` mediante un IPC específico. No hay pagos integrados ni desbloqueo de herramientas. También se declara GitHub Sponsors en la configuración del repositorio.
- Comparación de miniaturas original/resultado; permite elegir una imagen del lote e informa bytes realmente codificados. La numeración usa la posición del archivo elegido. Todavía no hay zoom real al 100 %, comparación por regiones ni deslizador.
- Recorte central para llenar y relleno de lienzo; selector de fondo para lienzo/JPEG. Sin ampliación autorizada, un original pequeño puede dar un recorte menor: el comportamiento se explica en la interfaz.
- Giro 0/90/180/270, espejos horizontal/vertical y escala de grises. Orientación EXIF normalizada antes del giro adicional.
- Metadatos: eliminar todo o adjuntar perfil sRGB. No se conserva EXIF/GPS/copyright ni se promete conservar ICC original. Esto evita anunciar la conservación selectiva todavía no implementada.
- JPEG progresivo y WebP sin pérdida. WebP sin pérdida y peso objetivo se rechazan juntos explícitamente; no se finge optimizarlo variando calidad con pérdida.
- Presets de ejemplo Web 1920 × 1080 (límites) y Catálogo 1200 × 1200 (lienzo), más importación/exportación JSON versionada. El archivo importado se valida y limita a 1 MB. Exportar elimina imagen/ruta de marca y desactiva esa marca de imagen; el texto se conserva y se explica al usuario.
- Migración de ajustes previos con valores neutros para mantener la salida anterior.

## Validación

Las pruebas nuevas cubren píxeles, dimensiones, EXIF, JPEG progresivo, WebP sin pérdida, ICC sin EXIF, bytes del preview y validación. Escritorio español e inglés pasaron con botón de Sponsors, importación/exportación JSON sin rutas privadas, comparación, idiomas, bandeja y cierre seguro. Se revisó el botón en la pantalla principal y las herramientas expandidas en ventana reducida. El ensayo del acceso a Sponsors sustituye la apertura real del navegador y confirma la URL fija. No sustituye validar un paquete instalado.

## Investigación pendiente y alcance

La [investigación específica de formatos](FORMAT_RESEARCH_2026-11.md) amplía PDF, JPEG XL, ICO, BMP, HEIC y otras opciones. Se probó que el motor local reconoce JFIF/SVGZ y carece de JXL/JP2/HEVC de salida; falló un BMP básico. Esa investigación documenta el punto de partida; el estado actual y sus límites están en [la implementación](FORMAT_IMPLEMENTATION.md).

El [análisis de producto](PRODUCT_RESEARCH_2026-11.md) conserva las propuestas. No se han implementado todavía múltiples salidas por imagen, vigilancia simultánea de varias carpetas, historial/recuperación persistente, CLI/Explorador, marcas con fuentes/contornos ni zoom de regiones. Requieren diseñar persistencia, memoria y compatibilidad EXE/APPX, no solo añadir controles. JPEG XL/PDF se añaden mediante motores independientes del Sharp instalado. No se añaden modelos IA ni servicios remotos silenciosamente.

## English

Included in Forma 2.1.0, the update to the 2.0.0 Store package: voluntary GitHub Sponsors button, image selection and original/result thumbnail comparison with encoded byte size, crop/pad and background, rotation/mirrors/grayscale, explicit metadata stripping or sRGB embedding, progressive JPEG/lossless WebP, portable JSON presets and the PDF/ICO/JPEG XL/HEIC/TIFF/animation tools. No original ICC/EXIF preservation or full-resolution zoom is claimed. More advanced automation and integrations remain research proposals. Real installation and Store validation are required before distribution.
