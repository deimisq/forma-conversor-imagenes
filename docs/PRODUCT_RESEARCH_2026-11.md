# Forma · Investigación de mejoras posteriores a 2.0

Fecha: 12 de noviembre de 2026. Estado de Store comunicado por el propietario: **enviada, pendiente de aprobación**. No se ha consultado Partner Center. Este documento propone trabajo; no anuncia funciones implementadas ni compromete fechas o versiones.

## Recomendación

La siguiente etapa debería mejorar el control visual del resultado y la confianza en los lotes. La base 2.0 ya contiene conversión, redimensionado, ajustes, subcarpetas, nombres, marcas, vista previa, peso objetivo, vigilancia, bandeja e idiomas. Añadir más controles en el mismo diálogo puede dificultar su uso: conviene organizarlo en secciones de salida, transformación, marca y automatización, con un resumen permanente de opciones activas.

Propuesta: 2.1 centrada en comparación visual, recorte/relleno, fondo de transparencia y control explícito de metadatos; después, exportación múltiple y vigilancia más robusta. Los números de versión son propuestas, no entregas acordadas.

## Método y alcance

Se inspeccionaron `shared/advanced-settings.ts`, `electron/conversion.ts`, `electron/folder-watcher.ts`, `electron/watermark.ts`, `src/App.vue` y `src/components/AdvancedTools.vue`, y se consultaron fuentes primarias de productos comparables y del motor Sharp. Se consultó `sharp.format` en la instalación local Windows x64. No se hicieron entrevistas de usuarios ni benchmarks comparativos: prioridad y esfuerzo son estimaciones de ingeniería, no demanda demostrada ni medidas de rendimiento.

La viabilidad de una operación del motor no implica que su interfaz, presets, IPC, memoria y validación estén resueltos. Todas las propuestas deben conservar ES/EN, datos locales, originales y compatibilidad EXE/Store.

## Referencias comparadas

| Producto | Evidencia relevante | Implicación para Forma |
| --- | --- | --- |
| [PowerToys Image Resizer](https://learn.microsoft.com/en-us/windows/powertoys/image-resizer) | Flujo desde Explorador, modos de tamaño, controles de metadatos y nombres | Importa llegar rápido a una tarea y explicar cómo cambia la imagen |
| [XnConvert](https://www.xnview.com/en/xnconvert/) | Transformaciones, ajustes de color, presets y vigilancia | Amplia cobertura; Forma puede mantener una experiencia más contenida |
| [Caesium](https://saerasoft.com/caesium/) | Vista previa, procesamiento múltiple y opciones de metadatos | La calidad visible y la elección consciente de metadatos son valiosas |
| [Squoosh](https://github.com/GoogleChromeLabs/squoosh) | Optimización local con distintos codecs | Es útil comparar decisiones de compresión antes del lote |

No se han probado sus últimas versiones en este equipo ni se afirma que Forma sea más rápida, comprima más o tenga mejor calidad. Sus licencias y modelos comerciales no se trasladan a Forma.

## Prioridades propuestas

Esfuerzo bajo: extensión acotada del modelo y controles. Medio: cambia pipeline, UI y persistencia. Alto: cambia ejecución, recuperación o integración Windows. Incluye pruebas, sin estimaciones de días.

| Prioridad | Mejora | Utilidad concreta | Esfuerzo |
| --- | --- | --- | --- |
| 1 | Comparador antes/después con zoom | Ver si la compresión daña texto, piel o detalles antes de procesar cientos de fotos | Medio |
| 2 | Recortar o rellenar a medidas exactas | Obtener productos cuadrados, miniaturas y banners sin deformar | Medio |
| 3 | Fondo y transparencia explícitos | Elegir el fondo al convertir PNG/WebP transparente a JPEG | Bajo/medio |
| 4 | Metadatos y color como opciones separadas | Elegir privacidad, copyright y fidelidad cromática sin decisiones invisibles | Medio |
| 5 | Presets listos e importación/exportación | Repetir tareas entre equipos y compartir configuraciones | Bajo/medio |
| 6 | Marcas de agua con control visual | Tamaño legible, fuente, contorno y posición más precisos | Medio |
| 7 | Exportación de varias versiones por imagen | Crear miniatura, web y original optimizado en un único lote | Alto |
| 8 | Vigilancia de varias carpetas con reglas | Automatizar flujos diferentes sin cambiar continuamente opciones | Alto |
| 9 | Pausa, recuperación y registro de trabajos | Continuar lotes interrumpidos y entender fallos | Alto |
| 10 | Compresión avanzada y política de ahorro | Evitar recomprimir sin beneficio y ofrecer opciones específicas por formato | Medio |
| 11 | Rotación/volteo y ajustes de imagen básicos | Resolver correcciones frecuentes sin abrir un editor externo | Bajo/medio |
| 12 | Integración con Explorador/CLI | Iniciar tareas desde el lugar donde están las imágenes | Medio/alto |
| 13 | Accesibilidad, tema de Windows y ajustes separados | Menos pasos, controles legibles y mejor uso diario | Medio |
| 14 | Diagnóstico de formatos y errores | Distinguir archivo dañado, codec ausente, permisos o falta de espacio | Medio |

## Diseño y criterios de aceptación de las primeras mejoras

### Comparador visual

Hoy la vista previa trabaja con la primera imagen y genera una miniatura de hasta 640 × 480. No ofrece comparación con el original, zoom al 100 % ni el tamaño real del archivo como parte del resultado de preview. Proponer selección de cualquier archivo, vistas lado a lado/deslizador y ampliación de una región bajo demanda. Un recorte de píxeles al 100 % es más útil que ampliar la miniatura existente.

Mostrar dimensiones, bytes reales codificados y porcentaje de diferencia, con aviso de ampliación o pérdida de animación. Usar el mismo pipeline de salida: ningún cálculo aproximado debe presentarse como peso final exacto. Los originales y resultados de distinto tamaño necesitan encuadre alineado; el zoom debe indicar qué resolución se compara. Limitar caché, cancelar previews antiguas y evitar guardar vistas previas por defecto.

Aceptación: JPEG/WebP/AVIF, transparencia, EXIF y texto fino; el preview final coincide con la conversión y un cambio rápido de opciones no muestra un resultado antiguo. La consulta de bytes puede ser costosa en AVIF: evaluar respuesta interactiva sin prometer tiempo real.

### Dimensiones exactas, recorte y fondo

Actualmente el motor usa `fit: inside`: ajusta dentro de un límite, sin garantizar un lienzo exacto. Añadir modos diferenciados: ajustar sin recorte, rellenar lienzo con fondo y recortar para llenar. Empezar con anclajes y proporciones 1:1, 4:3, 3:2, 16:9 y personalizadas; después permitir mover el recorte en preview.

Sharp expone `cover`, `contain`, `extract` y anclajes en [Resize](https://sharp.pixelplumbing.com/api-resize/). Su estrategia `attention` puede ayudar a proponer un encuadre, pero no es un detector fiable de caras ni debe anunciarse como tal. No deformar para alcanzar medidas salvo elección explícita.

El JPEG actual aplana transparencia sobre blanco. Añadir selector de color, damero de transparencia y advertencia previa. El fondo de lienzo y el fondo usado al quitar alfa deben quedar claramente diferenciados.

Aceptación: retratos/apaisadas, originales pequeños sin ampliación, EXIF girado, logos transparentes y recorte junto a una marca de agua; el orden de operaciones debe producir lo mismo en preview y salida.

### Metadatos, privacidad y color

No se propone añadir un simple botón de borrar EXIF como si nada existiera: el código actual no llama a conservación de metadatos y Sharp documenta que los elimina por defecto y convierte a sRGB. Falta que el usuario pueda elegirlo y ver qué ocurre. [Opciones de salida de Sharp](https://sharp.pixelplumbing.com/api-output/).

Proponer por separado: eliminar metadatos personales, conservar datos compatibles de autor/copyright y gestionar ICC. Nunca conservar GPS por accidente al pedir solo fidelidad de color. Empezar por eliminar todo/conservar perfil de color; añadir conservación selectiva solo cuando haya pruebas de GPS, XMP, EXIF, IPTC y formatos. No basta con copiar todos los metadatos y borrar un campo conocido.

La ruta de marcas rasteriza a PNG y requiere especial atención al propagar información: no puede prometerse conservación completa mediante una llamada aislada. Mantener la orientación visual normalizada sin reutilizar una etiqueta EXIF que gire de nuevo el resultado. Documentar diferencias entre preservar perfil y convertir colores.

Aceptación: fixtures con GPS, copyright, orientación y perfiles; confirmar tanto ausencia como presencia de los campos prometidos y equivalencia de apariencia en cada formato. El informe no acredita compatibilidad de impresión CMYK/P3 del pipeline actual.

### Presets y marcas

Ya existen presets propios: mejorar con ejemplos neutrales de web, correo y catálogo, que expliciten tamaño y formato en lugar de prometer requisitos vigentes de redes sociales. Importar/exportar JSON versionado con validación; no exportar rutas privadas por defecto. Una marca de imagen externa necesita reubicación al importarse en otro equipo.

En marcas, añadir fuente, contorno/sombra opcionales, márgenes porcentuales y posición arrastrable con controles numéricos accesibles. Separar ancho de la marca y altura de letra: un texto largo ajustado a un ancho fijo queda completo pero puede ser diminuto. Líneas múltiples y repetición diagonal pueden venir después. Las fuentes deben empaquetarse con sus licencias o tratar su disponibilidad explícitamente.

## Automatización y control de lotes

### Exportación múltiple

Una receta podría generar `miniatura/`, `web/` y `alta/` con diferentes formatos y tamaños. Necesita progreso por archivo/variante, reintento solo de variantes fallidas y protección contra colisiones. Decidir si cada variante se considera resultado independiente, y comunicar fallos parciales sin borrar resultados correctos.

### Vigilancia de siguiente nivel

La actual es una carpeta por sesión y no se restaura al reiniciar. Proponer varias reglas con nombre, origen/destino/preset, filtros por extensión y tamaño, pausa y horario opcional. Persistir la definición por separado del permiso para iniciarla; reanudación e inicio con Windows deben ser opcionales y respetar las vías de instalación.

Para recuperación tras reinicio, registrar identidad del trabajo y huella suficiente del origen, opciones y salida. No saltar archivos solo porque existe un nombre: puede corresponder a otra receta o a un trabajo incompleto. Tampoco suprimir cambios genuinos que el usuario espera convertir. Probar discos externos, carpetas de red, archivos parcialmente escritos y recuperación de permisos.

### Cola, historial y recuperación

Pausar entre archivos, limitar concurrencia por usuario/memoria, retomar pendientes y exportar un informe CSV/JSON de errores. Actualmente ya hay cancelación y reintento; la mejora es persistir y reanudar de forma segura, no reemplazarlos.

Historial opcional, local y con borrado/retención configurables: las rutas y nombres pueden ser personales. No restaurar automáticamente accesos a ubicaciones movidas ni borrar originales en una limpieza. No añadir un botón general de deshacer que elimine archivos que el usuario haya modificado después.

## Otras mejoras viables

- Giro 90/180/270 y volteos, distinguiéndolos de la corrección EXIF ya existente. [Operaciones de Sharp](https://sharp.pixelplumbing.com/api-operation/).
- Brillo, saturación, escala de grises y nitidez suave, con vista previa y restablecimiento. Evitar mezclar una larga lista de filtros en la pantalla principal. [Color](https://sharp.pixelplumbing.com/api-colour/).
- PNG optimizado, WebP sin pérdida, JPEG progresivo y esfuerzo de AVIF. Explicar que la calidad no equivale a tamaño, que más esfuerzo consume CPU y que una recompresión con pérdida no es sin pérdida.
- Política «solo conservar optimización si ahorra» para casos compatibles. No copiar el original cuando cambia extensión, dimensiones, marca o receta: el resultado podría incumplir lo solicitado.
- Renombrado con variables de dimensiones y fecha y una simulación de nombres/destinos antes de convertir; bloquear rutas inyectadas y colisiones como hoy.
- Tema claro/oscuro según Windows, alto contraste, foco visible, escalado y avisos legibles con lector de pantalla. Ya existe trabajo de teclado; probarlo no equivale a una auditoría de accesibilidad completa.
- Sección de diagnóstico con versión de app/motor y formatos detectados; exportación de informe sin rutas privadas por defecto.
- Acceso desde Explorador y una CLI con contrato de errores. Verificar registro/desregistro y actualización por separado en EXE y APPX; no dar por hecho que comparten integración.

## Formatos y funciones que conviene posponer

La consulta local de `sharp.format` confirma JPEG/PNG/WebP/TIFF/GIF y AVIF como alias de HEIF. JXL y PDF aparecen sin entrada/salida; SVG tiene entrada pero no salida. La capacidad HEIF anunciada por el motor no garantiza decodificación HEIC/HEVC: comprobar muestras reales. Estos datos son del entorno local, no de todas las instalaciones.

- **JPEG XL, RAW y HEIC universal:** antes, resolver codecs, tamaño del instalador, licencias y compatibilidad Store; no basta con añadir una extensión en la UI.
- **PDF:** salida de imágenes a PDF sería una función distinta, con paginado y una nueva dependencia; importar PDF añade otra superficie de validación. No está resuelto por Sharp instalado.
- **Marcas sobre animaciones/WebP animado:** alto coste en fotogramas, tiempos, bucles y memoria; conservar la restricción visible actual hasta tener un pipeline probado.
- **Eliminar fondos y ampliar con IA:** potencial utilidad, pero implican modelos, descarga/licencia, CPU/GPU, memoria y pruebas. Si se retoman, priorizar ejecución local con consentimiento de descarga y mostrar limitaciones; no usar servicios cloud silenciosamente.
- **Nube, cuentas, sincronización y plugins arbitrarios:** no son necesarios para mejorar el flujo local actual y añaden mantenimiento, privacidad y distribución.

## Secuencia sugerida y cómo decidir

1. **Estabilización posterior a 2.0:** observar aprobación Store, probar instalación/update/notificaciones reales, recoger fallos reproducibles y medir tiempos/memoria con fixtures. No confundir una aprobación comercial con las pruebas de cada escenario.
2. **Propuesta 2.1, control visual:** comparador, selección de imagen, fondo/transparencia, medidas exactas y primeros controles de metadatos; reorganizar el diálogo para que siga siendo manejable.
3. **Propuesta 2.2, productividad:** recetas de varias salidas, presets compartibles, marcas más configurables y reportes.
4. **Propuesta posterior, automatización:** varias reglas vigiladas, pausa/recuperación persistente e integración Explorador/CLI.

Antes de comprometer una versión, validar con casos de tres perfiles: catálogo/tienda, fotografías personales y publicación web. Medir con el mismo conjunto: fotos grandes, capturas con texto, alfa, orientación EXIF, perfiles ICC, animaciones, archivos corruptos y carpetas grandes. Registrar bytes, dimensiones, tiempos, memoria y fallos; no fijar porcentajes de ahorro o velocidad sin resultados.

La mejor primera inversión, según este análisis, es **comparar el resultado y controlar su encuadre, transparencia y metadatos**. Son capacidades útiles en tareas frecuentes y aprovechan el motor actual, sin introducir cuentas o servicios remotos.
