# Nuevos formatos: implementación posterior a 2.0

Estas herramientas pertenecen al desarrollo local posterior a la versión enviada a Store. No actualizan el tag ni el paquete 2.0.0. Se accede desde **PDF y otros formatos**, debajo de Herramientas avanzadas. La selección de archivos y el destino de este panel son independientes de la cola de conversión habitual.

| Herramienta | Alcance implementado |
| --- | --- |
| Imágenes → PDF | PDF combinado o uno por imagen; reordenación, A4/Letter/tamaño físico de imagen, orientación vertical/horizontal/automática y margen en puntos. DPI para tamaño físico de imagen. Fondo blanco y JPEG calidad 95 dentro del PDF. |
| PDF → PNG/JPEG | Rango de páginas, 72–600 DPI, hasta 100 MB por documento y 40 MP por página. Fuentes estándar, CMaps y WASM locales de PDF.js. Contraseña opcional proporcionada por el usuario; sin OCR. JPEG permite elegir calidad y ambos formatos llevan resolución DPI. La contraseña no se guarda en preferencias y se limpia al terminar/cambiar de archivo. |
| ICO | Un icono por imagen con 16/32/48/64/128/256 píxeles; conserva proporción con relleno transparente. No es un PNG renombrado. |
| JPEG XL, beta | Exportación de imágenes estáticas SDR de 8 bits; con pérdida o sin pérdida de píxeles. Códec WASM local, máximo 16 MP, esfuerzo 3. No reconstruye el archivo JPEG original ni conserva metadatos/HDR/animación. Admite entrada JXL y vista previa mediante un worker decodificador independiente. |
| HEIC → PNG, beta | Decodificador libheif independiente de Sharp; primera imagen, máximo 100 MB y 40 MP. Resultado SDR de 8 bits, sin metadatos ni Live Photos. No implica soporte universal de todas las variantes HEIF. |
| TIFF → PNG | Selección de páginas y conversión secuencial, hasta 40 MP por página. |
| GIF/WebP animado → WebP | Codificación sin pérdida conservando duración de fotogramas y repetición; máximo 500 fotogramas y 40 MP totales. No incluye APNG. |
| JFIF/JPE | Extensiones adicionales en selección, arrastre y vigilancia del lote de imágenes. |
| SVGZ | Descompresión acotada a 16 MB y conversión con el motor SVG existente. |
| BMP | Entrada RGB sin compresión BI_RGB de 24/32 bits; cabeceras de al menos 40 bytes, filas con padding y orientación superior/inferior; máximo 40 MP. En BMP BI_RGB de 32 bits el byte reservado se interpreta como opaco. Paletas, RLE y bitfields se rechazan expresamente. |

## Entrada JPEG XL y PDF protegido

La entrada JXL beta se normaliza a PNG de 8 bits mediante un worker separado, disponible para la cola, vista previa y herramientas de imagen. Máximo 20 MB de archivo, 16 MP decodificados y 30 segundos por decodificación. El límite de píxeles se comprueba después de decodificar porque el wrapper no expone lectura de dimensiones: no es protección total frente a agotamiento de memoria WASM. No se promete conservación de HDR, animación ni metadatos.

Las pruebas cubren PDF cifrado con contraseña correcta, ausente e incorrecta, salida JPEG y DPI; también conversión y vista previa JXL. Los secretos no se incluyen en ajustes guardados; sus copias temporales en memoria quedan sujetas a la gestión de memoria de JavaScript.

## Ejecución y límites

PDF, ICO, JXL, HEIC, TIFF por páginas y WebP animado se ejecutan en un worker de Node separado del proceso de interfaz. Comparte una señal de cancelación; espera que termine la operación del códec en curso antes de cancelar. La app usa el mismo bloqueo de conversión, vigilancia y cierre seguro que el lote normal. No se ejecutan programas descargados ni se envían documentos a servidores.

Los nombres de salida se reservan de forma exclusiva y añaden sufijos para conservar archivos existentes y originales. Un error o cancelación elimina los resultados nuevos de esa tarea. Esto no equivale a recuperación frente a apagado o caída del proceso; no hay historial transaccional persistente. Máximo 500 entradas por tarea; el PDF combinado limita sus imágenes JPEG incrustadas a 128 MB. El límite del heap del worker no es un límite total de memoria nativa/WASM del proceso.

Estos trabajos no aplican los ajustes, marcas, nombres ni peso objetivo del panel de imágenes. La interfaz los presenta como herramientas independientes. Los PDF rasterizados pierden texto seleccionable, formularios, enlaces y firmas del documento original; el PDF original siempre se conserva.

## Validación

La suite completa pasó 54 pruebas automatizadas. Compilación ES y EN correcta. Escritorio ES y EN pasó con PDF, páginas PDF, ICO y JXL mediante IPC/worker, además de los flujos anteriores.

- Pruebas automatizadas de orden/color/tamaño físico del PDF, extracción de páginas, cancelación, colisiones y limpieza de resultados.
- Verificación de seis entradas reales en el contenedor ICO.
- Comparación exacta RGBA tras codificar JXL sin pérdida y decodificarlo con el módulo decodificador.
- Comprobación de fotogramas, duración y repetición del WebP animado, y extracción de una página TIFF.
- BMP de 24 bits con padding y orientación de filas, cabeceras truncadas y límites; SVGZ real.
- Ensayo local con [example.heic de libheif](https://github.com/strukturag/libheif/blob/master/examples/example.heic): primera imagen convertida a PNG 1280 × 854. Esta imagen de prueba no se distribuye en el repositorio.

También se creó una carpeta win-unpacked sin instalador ni publicación: PDF, páginas PDF, ICO, JXL y HEIC se probaron desde su app.asar con Electron, usando perfiles y archivos de prueba aislados. La validación de paquetes instalados EXE/APPX sigue pendiente. Consultar el resultado de las pruebas de escritorio de esta rama antes de distribuir; no se declara certificación Store.

## Dependencias y distribución

PDFKit, PDF.js, @napi-rs/canvas, png-to-ico, @jsquash/jxl y libheif-js se incluyen como dependencias de producción con sus recursos locales. Los tipos de PDFKit son de desarrollo. El generador de avisos conserva la licencia del wrapper canvas y el SBOM de su binario, además de los avisos existentes. fontkit 2.0.4 carece de LICENSE en su paquete npm: se incluye el texto oficial consultado en https://raw.githubusercontent.com/foliojs/fontkit/master/LICENSE en `licenses/upstream/`.

**Pendiente antes de distribución:** completar la revisión de textos ausentes de brotli 1.3.3, dfa 1.2.0 y lazy-val 1.0.5; verificar atribuciones/licencias y fuentes correspondientes a las bibliotecas nativas/WASM (incluidos Skia, libjxl, libheif y sus códecs). libheif-js declara LGPL-3.0: incluir su texto no completa por sí solo todas las obligaciones de distribución. No se declara finalizada esa revisión.

## Próximos incrementos

Reconstrucción JPEG ↔ JXL mediante libjxl; compresión PDF consciente del tipo de contenido; APNG; BMP indexado/RLE y salida BMP; HEIC integrado en todas las herramientas una vez validado. JP2, RAW de cámaras, Ultra HDR, vectorización y PSD/EPS continúan como investigaciones y no se anuncian como formatos soportados.

## English

Unreleased local PDF/image tools, ICO export, static 8-bit SDR JPEG XL export beta, first-image HEIC-to-PNG beta, TIFF page extraction, lossless animated WebP, JFIF/JPE/SVGZ inputs and bounded uncompressed 24/32-bit BMP input. Document jobs run in a separate Node worker with cooperative cancellation and exclusive output names. Installed EXE/APPX and native/WASM license/source reviews are still required before distribution. See the feature table and limits above.
