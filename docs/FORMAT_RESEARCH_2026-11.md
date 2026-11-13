# Formatos para Forma: PDF, JPEG XL y ampliaciones

Este documento conserva la investigación previa. El desarrollo posterior se describe en [Implementación de formatos](FORMAT_IMPLEMENTATION.md).

Investigación del 12 de noviembre de 2026. Rama de desarrollo posterior a 2.0; **no se ha añadido ningún formato a la aplicación en esta investigación**. Las conclusiones combinan documentación primaria y comprobaciones sobre Sharp 0.35.5 / libvips 8.18.7 en Windows x64. Se deben repetir sobre los binarios finales EXE/APPX.

## Conclusión y prioridad

1. **Imágenes a PDF**: mayor utilidad general; propondría implementarlo primero como herramienta de documentos, no como otro codec de imagen.
2. **JFIF/JPE y SVGZ**: ampliación pequeña de entrada, con motor ya disponible. También conviene corregir el anuncio de BMP/HEIC para distinguir selección de extensión y decodificación real.
3. **ICO de salida**: útil para iconos/favicons y viable mediante un generador específico. BMP de entrada/salida es otra ampliación acotada con dependencia adicional.
4. **PDF a imágenes**: muy útil, pero requiere renderizador, selección de páginas y control de memoria; etapa independiente.
5. **JPEG XL de entrada/salida**: viable mediante libjxl, con trabajo nativo o WebAssembly. Priorizar primero imágenes estáticas y probar integración antes de anunciarlo.
6. **HEIC de entrada**: útil para fotos de teléfonos, pero necesita un decoder HEVC realmente incluido. No prometer soporte universal por detectar libheif.
7. Después: animaciones WebP/APNG, TIFF multipágina, JPEG 2000, RAW y Ultra HDR según casos reales.

Prioridad y esfuerzo son estimaciones de ingeniería, no resultados de encuestas ni benchmarks de velocidad/ahorro.

## Qué existe y qué falta en el motor instalado

Consulta realizada a `sharp.format` y pequeños ensayos en memoria:

| Caso | Resultado local | Consecuencia |
| --- | --- | --- |
| JPEG, PNG, WebP, TIFF, GIF | Entrada/salida declaradas por el motor | Ya disponibles en Forma con las restricciones de su pipeline |
| AVIF | Disponible mediante HEIF con alias AVIF | Ya disponible; no confundir HEIF/AVIF con HEIC/HEVC |
| JPEG JFIF | JPEG generado y reconocido correctamente | Falta aceptar `.jfif`/`.jpe` en selector, arrastre y vigilancia |
| SVG comprimido con gzip | Reconocido como SVG | `.svgz` se puede habilitar tras pruebas y límites de expansión |
| BMP básico de 24 bits | `Input buffer contains unsupported image format` | La app permite elegir `.bmp`, pero esta instalación no lo decodifica |
| JPEG XL | `jxlsave_buffer` ausente | No basta con llamar a `sharp.jxl()` |
| JPEG 2000 | Exige libvips con OpenJPEG | Necesita componente nativo adicional |
| HEIC/HEVC de salida | `heifsave: Unsupported compression` | libheif presente no implica encoder HEVC; no se verificó entrada con fotos HEIC reales |
| PDF | Entrada/salida deshabilitadas en `sharp.format` | Crear y renderizar documentos requieren otra ruta |
| SVG | Entrada disponible, salida deshabilitada | Rasterizar SVG sí; vectorizar fotos a SVG no está resuelto |
| RAW de Sharp | Búfer de píxeles con dimensiones/canales | No equivale a abrir RAW de cámaras |

Los ensayos no cubren todas las variantes de BMP, HEIC o perfiles. No se ha instalado una biblioteca nueva, descargado un codec ni modificado el paquete Store. Las extensiones aceptadas actualmente están en `electron/files.ts`; el conjunto de extensiones no es una prueba de decodificación.

## PDF: separar dos herramientas

### A. Imágenes a PDF

Propuesta inicial:

- Unir imágenes en un documento o crear un PDF por imagen.
- Reordenar páginas con controles accesibles; elegir A4, Carta o tamaño adaptado a imagen.
- Márgenes, orientación y modos ajustar/rellenar, con vista previa del encuadre.
- Indicar resolución de rasterización/impresión y distinguir píxeles de tamaño físico.
- Respetar originales, crear salida temporal y finalizarla solo al completar el documento.

**Ruta recomendada para evaluar: PDFKit.** Genera documentos y acepta JPEG/PNG como imágenes; los otros formatos se normalizarían antes con Sharp. Su salida por stream encaja con archivos locales, aunque eso no garantiza memoria constante: deben medirse documentos con muchas páginas. [Documentación de imágenes](https://pdfkit.org/docs/images.html), [proyecto y licencia MIT](https://github.com/foliojs/pdfkit).

**Alternativa: pdf-lib.** Permite crear documentos y embeber JPEG/PNG y páginas existentes; es una opción para combinar/modificar documentos, con licencia MIT. Su mantenimiento y consumo de memoria deben evaluarse con la versión elegida. No es un renderizador y su propia documentación advierte que no maneja correctamente documentos cifrados; `ignoreEncryption` no los descifra. [Proyecto](https://github.com/Hopding/pdf-lib), [API de PDFDocument](https://pdf-lib.js.org/docs/api/classes/pdfdocument).

No recomendaría empezar con una promesa de «comprimir cualquier PDF»: rasterizar un documento puede perder texto seleccionable, enlaces, formularios, estructura y firmas. Un PDF de fotos tampoco se vuelve OCR/searchable sin otra herramienta. Si se cambia tamaño, marca, orientación o privacidad, no se puede incrustar siempre el JPEG original sin procesar.

La cola actual es principalmente una imagen → un resultado. Un PDF combinado exige un trabajo de documento con progreso por página, orden definido y cancelación del conjunto. La carpeta vigilada necesitaría reglas explícitas de agrupación antes de generar PDFs combinados automáticamente.

### B. PDF a imágenes

**Candidato principal: PDF.js de Mozilla**, renderer con ejemplos de páginas/canvas y Node, bajo Apache 2.0. Ejecutarlo con recursos empaquetados localmente y tareas aisladas; no cargar documentos personales en un servicio remoto. [Ejemplos oficiales](https://mozilla.github.io/pdf.js/examples/), [proyecto](https://github.com/mozilla/pdf.js).

UI propuesta: páginas o rangos, miniaturas, resolución, fondo transparente/blanco cuando corresponda y nombres `documento-pagina-001.png`. Renderizar una página a la vez, liberar recursos, cancelar y limitar píxeles/páginas. Un tamaño A4 a 300 ppp ronda 2480 × 3508 píxeles: conviene estimar memoria antes de crear el canvas, no después.

Debe probar documentos con fuentes incrustadas, transparencia, rotación, escaneos, páginas enormes y archivos dañados. Para documentos protegidos, diseñar un flujo de contraseña local explícito; no persistirla ni intentar ignorar el cifrado. Esta fase no implica editar texto PDF ni extraer automáticamente imágenes originales incrustadas: son operaciones diferentes.

Evitar basarse en un navegador remoto, en impresión silenciosa de HTML o en el visor PDF de Electron como si fuera una API de exportación de páginas. Al incorporar PDF.js hay que fijar versión, revisar avisos de seguridad, empaquetar workers/CMaps/fuentes necesarios y comprobar CSP y EXE/APPX.

## JPEG XL: el otro JPEG

**JPEG XL usa `.jxl`; no es JPEG 2000 (`.jp2`), JPEG progresivo ni jpegli.** Ofrece compresión con/sin pérdida y capacidades de imagen avanzadas. La implementación de referencia es [libjxl](https://github.com/libjxl/libjxl), con licencia BSD-3-Clause; el comité JPEG mantiene una [relación de software](https://jpeg.org/jpegxl/software.html).

### Integración recomendada para un prototipo

Evaluar `cjxl`/`djxl` incluidos con la app, compilados de una versión fijada y con dependencias y licencias inventariadas. Permite conservar Sharp para edición y usar una imagen intermedia cuando haya transformaciones. Una alternativa es WebAssembly para reducir acoplamiento con DLLs, pero requiere medir memoria, rendimiento y funcionamiento en Electron; no se ha elegido un wrapper npm ni verificado una distribución WASM concreta.

Sharp expone una API JXL, pero su documentación la marca experimental y exige libvips compilado con libjxl; los binarios precompilados no la incluyen. Recompilar toda la cadena Sharp/libvips es una alternativa de mayor mantenimiento, no una casilla de configuración. [API JXL](https://sharp.pixelplumbing.com/api-output/#jxl).

### Dos modos diferentes

- **JPEG existente → JXL con reconstrucción:** libjxl permite recomprimir un JPEG y reconstruir sus bytes cuando se conserva la información correspondiente. Se debe entregar el JPEG original al codec, sin decodificarlo primero a PNG ni aplicar resize/marca. Comprobar la vuelta mediante SHA-256. [Comportamiento documentado](https://github.com/libjxl/libjxl).
- **Imagen editada → JXL:** encode de píxeles con pérdida/sin pérdida. No prometer reconstrucción del JPEG de origen ni tratar la escala de calidad como equivalente a otros codecs.

Pruebas necesarias: alfa, fotos/texto, orientación, ICC, archivos truncados, límites de recursos y vuelta sin pérdida. Las primeras versiones deberían limitarse a imagen estática SDR de 8 bits; HDR/16 bits/animación necesitan ruta de datos y pruebas propias. Medir velocidad, memoria, tamaño del instalador y ahorro con imágenes reales, sin porcentajes prometidos.

El preview debe decodificar JXL a una imagen visible mediante el decoder integrado; no asumir que el Chromium de Electron o el software del destinatario lo abrirán. El modo de archivo local y el de imagen para publicar en web tienen compatibilidades distintas.

## Otros formatos y ampliaciones

| Formato / función | Entrada / salida propuesta | Valor | Dependencia o trabajo | Prioridad |
| --- | --- | --- | --- | --- |
| JFIF / JPE | Entrada; salida sigue siendo JPEG | Abrir descargas JPEG con otra extensión | Motor existente; actualizar filtros y pruebas | Alta, pequeña |
| SVGZ | Entrada | SVG comprimido sin descomprimir a mano | Motor local probado; validar límites gzip y SVG | Alta, pequeña |
| ICO / favicon | Primero salida | Iconos Windows y web con varias resoluciones | Generador de contenedor; no es solo PNG renombrado | Alta/media |
| BMP | Entrada y salida básica | Compatibilidad con herramientas antiguas | Decoder/encoder específico; formatos de bits/RLE a probar | Media |
| HEIC / HEIF con HEVC | Primero entrada | Fotografías de teléfonos | libheif más decoder HEVC o integración de plataforma validada | Alta utilidad, esfuerzo alto |
| TIFF multipágina | Elegir/exportar páginas | Documentos escaneados | Sharp dispone de páginas; el flujo actual no las expone como tareas | Media |
| WebP animado / APNG | Entrada/salida preservando animación | Evitar pérdida silenciosa de fotogramas | Tiempos, bucles, disposición y soporte exacto del encoder | Media/alta complejidad |
| JPEG 2000 | Entrada/salida | Archivos técnicos y heredados | OpenJPEG/libvips personalizado o proceso codec aislado | Baja salvo demanda |
| RAW de cámaras: DNG/CR2/NEF/ARW | Entrada | Fotografías de cámaras | LibRaw, demosaicing, color y matriz de cámaras | Posterior, alta complejidad |
| JPEG Ultra HDR | Preservar/importar según caso | Fotos con mapa de ganancia HDR | Capacidades recientes de Sharp; pipeline SDR actual no garantiza HDR | Posterior |
| SVG de salida | Solo si se define un caso vectorial | Diagramas/trazados | Vectorizador; Sharp no lo produce | No priorizar para convertir fotos |
| PSD, EPS/PS, DDS, TGA | Revisar por demanda concreta | Casos especializados | No se acreditó soporte local ni se eligió biblioteca | No comprometer todavía |

### ICO y BMP

Forma ya usa `png-to-ico@3.0.2` para generar sus recursos de compilación. Eso facilita estudiar exportación ICO, pero es una dependencia de desarrollo: no se garantiza su presencia al ejecutar una app instalada. Tendría que incluirse y auditarse como dependencia de producción. Empezar con PNG fuente y tamaños 16/32/48/64/128/256; evitar deformar y ofrecer padding. Abrir ICO existentes es otra tarea, con varias imágenes y representaciones BMP/PNG posibles.

Para BMP, [fast-bmp de image-js](https://github.com/image-js/fast-bmp) es candidato de evaluación con licencia MIT. No se ha instalado ni auditado. Empezar por RGB básico y ampliar variantes solo con fixtures; no anunciar soporte de todo BMP por superar un archivo de ejemplo.

### HEIC y RAW

[libheif](https://github.com/strukturag/libheif) distingue codecs: HEIC necesita componentes HEVC; AVIF utiliza AV1. El codec exacto, sus avisos/licencias y cualquier obligación de distribución deben revisarse antes de incluirlo. La licencia de libheif por sí sola no acredita todo el conjunto ni posibles derechos de terceros. Una ruta que dependa de extensiones opcionales instaladas en Windows tiene que detectar su ausencia y no puede anunciarse como universal/offline en cualquier equipo.

[LibRaw](https://www.libraw.org/docs) es una ruta para RAW de cámaras, pero la compatibilidad depende del modelo y la compilación; consultar [su matriz](https://www.libraw.org/supported-cameras). Leer un RAW no resuelve automáticamente revelado, balance de blancos, color y nitidez. No confundirlo con el búfer raw de Sharp.

### jpegli y JPEG progresivo

[jpegli](https://github.com/google/jpegli) es otro encoder/decoder JPEG; **produce JPEG, no un nuevo formato de salida**. Puede investigarse como elección de encoder si benchmarks justifican el coste. El JPEG progresivo del desarrollo actual también sigue siendo `.jpg`. Son mejoras de JPEG distintas de incorporar `.jxl` o `.jp2`.

## Diseño común para ampliar formatos

- Registrar capacidades reales de lectura/escritura por backend, con detección y prueba en el paquete instalado. La UI debe distinguir «reconocemos esta extensión» de «podemos decodificarla».
- Separar trabajos de imagen, páginas y documentos; diseñar nombres, progreso, reintentos y cancelación para uno-a-muchos y muchos-a-uno.
- Los procesos codec deben ejecutarse por ruta y argumentos fijos, sin concatenación de comandos; limitar duración, memoria/salida y procesos simultáneos; limpiar solo temporales propios.
- No reutilizar opciones sin significado: calidad JPEG no equivale a distancia JXL, peso por archivo no es peso del PDF combinado y DPI no son dimensiones en píxeles.
- Definir explícitamente qué pasa con alfa, metadatos, ICC, orientación, animación y profundidad de bits. El pipeline actual no es una garantía de preservación HDR/16 bits.
- Incluir bibliotecas y workers localmente, inventariar licencias y actualizar privacidad solo si cambian datos/conexiones. No descargar ejecutables o subir documentos de forma silenciosa.
- Validar entrada dañada, límites, versiones x64, instalación limpia, actualización, EXE y APPX/Store. Un prototipo con Node no acredita el paquete firmado.

## Secuencia de trabajo recomendada

**Tanda pequeña:** detección de codecs, JFIF/JPE/SVGZ y diagnóstico BMP/HEIC. **Primera herramienta nueva:** imágenes a PDF. **Siguiente:** PDF a páginas PNG/JPEG e ICO de salida. **Prototipo paralelo controlado:** JXL estático con libjxl. **Más adelante:** HEIC, animaciones/multipágina y RAW según pruebas y demanda.

## English summary

The current Windows engine does not provide PDF/JXL/JP2 output or HEVC encoding; a basic BMP decode also failed despite the app accepting its extension. JFIF JPEG and gzipped SVG decoded successfully. Prioritize images-to-PDF using an evaluated PDF writer, then PDF page rendering with PDF.js, ICO output and small input extensions. JPEG XL needs a real libjxl backend; reversible JPEG recompression must bypass pixel editing. HEIC requires a verified HEVC decoder, while camera RAW requires a separate development pipeline. All recommendations remain research, with no format implementation or new dependency added here.
