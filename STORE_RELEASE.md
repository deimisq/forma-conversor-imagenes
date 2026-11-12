# Forma 2.0.0 · Datos para Microsoft Store

Revisado el **12 de noviembre de 2026** contra `main`, metadatos 2.0.0 y fuentes oficiales enlazadas al final. Los textos están preparados para copiar; no se ha editado Partner Center ni acreditado certificación.

## Estado y paquetes

**Actualización del propietario:** Forma 2.0 ya está enviada a Microsoft Store y pendiente de aprobación. No se verificó Partner Center desde esta conversación. Los campos siguientes quedan como referencia de la entrega y futuras revisiones; no repetir el envío ni asumir que ya está aprobada.

Forma 2.0 está en `main` e incluye ocho herramientas, bandeja, notificaciones de vigilancia y banderas en el selector. El tag `v2.0.0` ya existe: no recrearlo ni moverlo. Su [compilación](https://github.com/deimisq/forma-conversor-imagenes/actions/runs/43254721865) genera un **release borrador** y omite R2. La ejecución terminó correctamente; comprobar los cuatro paquetes adjuntos del borrador antes de utilizarlos. La [compilación de prueba ES/EN](https://github.com/deimisq/forma-conversor-imagenes/actions/runs/43252700285) terminó correctamente, incluidas pruebas de escritorio y verificación de paquetes. Pendientes reales: [V2_RELEASE.md](V2_RELEASE.md).

| Variante | EXE directo | APPX Store |
| --- | --- | --- |
| ES | `release/2.0.0/forma-setup-2.0.0.exe` | `release/2.0.0/forma-setup-2.0.0.appx` |
| EN | `release/2.0.0/en/forma-setup-en-2.0.0.exe` | `release/2.0.0/en/forma-setup-en-2.0.0.appx` |

| Dato | Configuración |
| --- | --- |
| Aplicación / manifiesto | `2.0.0` / `2.0.0.0` |
| Arquitectura y dispositivo | x64 / Windows Desktop |
| Identity Name | `DeimisQuintanilla.FormaConversordeImgenes` |
| Publisher | `CN=5EE69F12-D1D5-44E6-810D-F3E75E2B3C3F` |
| Publisher Display Name | `Deimis Quintanilla` |
| Application ID | `FormaConversorDeImagenes` |
| Nombre ES | `Forma Conversor de Imágenes` |
| Nombre EN | `Forma Image Converter` |
| Idiomas | `es-ES`, `en-US` |

Contrastar estos datos con Product identity y los nombres reservados en Partner Center. No inventar Store ID ni cambiar la identidad existente. Los APPX son alternativas con la misma identidad, versión y arquitectura: subir **uno**, con ambas localizaciones. El nombre instalado procede del manifiesto elegido; el primer idioma de interfaz sigue Windows, no el orden del manifiesto.

Subir el APPX de distribución, no el EXE, Forma Preview ni el paquete firmado con el certificado de pruebas local. Si la ficha existente está registrada como EXE/MSI, confirmar en Partner Center la vía admitida para pasar a APPX; no asumir que basta con cambiar el archivo.

## Campos generales

| Campo | Dato / acción |
| --- | --- |
| Tipo | Aplicación de escritorio Windows empaquetada APPX |
| Precio | Gratis, sin prueba temporal, suscripciones, compras ni complementos de pago |
| Categoría sugerida | Foto y vídeo / Photo & video; confirmar la opción disponible |
| Inicio de sesión | No requiere cuenta ni credenciales de prueba |
| Sitio web | https://github.com/deimisq/forma-conversor-imagenes |
| Soporte | https://github.com/deimisq/forma-conversor-imagenes/issues |
| Privacidad ES | https://github.com/deimisq/forma-conversor-imagenes/blob/main/PRIVACY.md |
| Privacidad EN | https://github.com/deimisq/forma-conversor-imagenes/blob/main/PRIVACY.en.md |
| Licencia | GPL v3: https://github.com/deimisq/forma-conversor-imagenes/blob/main/LICENSE |
| Mercados y disponibilidad | Decisión del propietario en Partner Center |
| Edades | Completar IARC según la app; no se ha obtenido una clasificación en esta revisión |
| Contacto legal del editor | Usar datos reales de la cuenta; no inventar correo, teléfono o dirección |
| Requisitos | Windows 10/11 x64; el usuario no necesita Node.js, Electron ni Sharp por separado |

Confirmar mínimo exacto de Windows con TargetDeviceFamily del APPX final y soporte del runtime. No declarar ARM64/x86, Xbox, móvil, RAM o espacio mínimos sin validarlos. Verificar las URLs de privacidad sin iniciar sesión después de subir estos documentos.

## Ficha española · es-ES

Copiar solo el texto de cada bloque. Para características, introducir una línea por campo sin viñetas adicionales.

### Nombre

`Forma Conversor de Imágenes`: confirmar que esté reservado para este producto.

### Descripción corta

```text
Convierte, redimensiona y organiza imágenes en tu equipo. Añade marcas de agua, ajusta el peso y automatiza carpetas con una única app gratuita en español e inglés.
```

### Descripción

```text
Forma convierte y prepara imágenes por lotes en tu equipo, conservando los originales. Todas sus herramientas se incluyen en una única aplicación gratuita, sin cuentas, suscripciones ni funciones de pago.

Convierte a JPEG, PNG, WebP, AVIF, TIFF y GIF. Añade archivos o carpetas, elige formato, calidad y destino, y consulta cada resultado. Puedes cancelar trabajos pendientes y reintentar los fallidos.

Redimensiona por ancho, alto, porcentaje o dimensiones máximas. Guarda ajustes personalizados, conserva subcarpetas y renombra con prefijos, sufijos y numeración. Añade marcas de agua de texto o imagen y comprueba el resultado en una vista previa sin guardar archivos.

Define un peso objetivo para JPEG, WebP y AVIF, con reducción opcional de dimensiones. Si no se alcanza el límite, Forma informa del error en lugar de guardar un archivo mayor.

Vigila una carpeta para convertir imágenes nuevas o modificadas cuando terminan de escribirse. Puedes ocultar Forma en la bandeja del sistema y recibir notificaciones de las conversiones. Al cerrar eliges entre salir u ocultar, puedes recordar la elección y cambiarla después en Herramientas avanzadas.

Incluye español e inglés, con banderas en el selector. Usa el idioma de Windows al primer inicio y recuerda tu elección posterior. Las imágenes se procesan localmente; esta edición se actualiza mediante Microsoft Store.

La vigilancia se inicia manualmente y funciona mientras Forma sigue ejecutándose, también oculta; no se inicia con Windows. Las marcas no admiten GIF animados. El peso objetivo está disponible para JPEG, WebP y AVIF. La compatibilidad de entrada depende de los codecs incluidos; los archivos no compatibles muestran un error.
```

### Características

```text
Conversión local por lotes a JPEG, PNG, WebP, AVIF, TIFF y GIF
Redimensionado por ancho, alto, porcentaje y límites
Ajustes personalizados y preferencias persistentes
Subcarpetas y renombrado con numeración sin sobrescribir resultados
Marcas de agua de texto o imagen con vista previa
Peso objetivo para JPEG, WebP y AVIF
Carpetas vigiladas con notificaciones de conversión
Bandeja del sistema y elección recordada al cerrar
Español e inglés con selector de banderas
Una única aplicación gratuita, sin compras ni suscripciones
```

### Novedades 2.0

```text
Forma 2.0 reúne todas las herramientas en una única app gratuita: redimensionado, ajustes, subcarpetas, renombrado, marcas de texto o imagen y vista previa. Añade peso objetivo para JPEG, WebP y AVIF y carpetas vigiladas con avisos del sistema. Puedes ocultar Forma en la bandeja, recordar qué hacer al cerrar y cambiarlo después en ajustes. El selector muestra banderas también en la lista de idiomas. El texto largo de las marcas se ajusta completo sin recortes. Conserva preferencias, originales, cancelación y cierre seguro. El primer inicio sigue el idioma de Windows y los siguientes recuerdan tu selección. El APPX consulta actualizaciones en Microsoft Store.
```

Términos sugeridos si el portal ofrece ese campo: `convertir imágenes`, `redimensionar`, `marca de agua`, `comprimir imágenes`, `conversión por lotes`, `carpeta vigilada`, `WebP AVIF`.

## English listing · en-US

### Product name

`Forma Image Converter`: confirm the reserved name and consistency with the chosen package.

### Short description

```text
Convert, resize and organize images on your computer. Add watermarks, target file sizes and automate folders with one free app in English and Spanish.
```

### Description

```text
Forma converts and prepares image batches on your computer while preserving originals. Every tool is included in one free application, with no accounts, subscriptions or paid features.

Convert to JPEG, PNG, WebP, AVIF, TIFF and GIF. Add files or folders, choose format, quality and output location, and review each result. Cancel pending work and retry failed files.

Resize by width, height, percentage or maximum bounds. Save custom presets, preserve subfolders and rename with prefixes, suffixes and numbering. Add text or image watermarks and preview the result without saving files.

Set a target file size for JPEG, WebP and AVIF, optionally reducing dimensions. When the limit cannot be reached, Forma reports an error instead of saving an oversized result.

Watch a folder to convert new or modified images after they stop changing. Hide Forma in the system tray and receive conversion notifications. When closing, choose to quit or hide, remember your choice and change it later in Advanced tools.

Includes English and Spanish with flags in the language selector. The first launch follows Windows languages; subsequent launches remember your choice. Images are processed locally. This edition is updated through Microsoft Store.

Folder watching starts manually and runs while Forma remains running, including when hidden; it does not start with Windows. Watermarks do not support animated GIFs. Target file size is available for JPEG, WebP and AVIF. Input support depends on included codecs; unsupported files show an error.
```

### Product features

```text
Local batch conversion to JPEG, PNG, WebP, AVIF, TIFF and GIF
Resize by width, height, percentage and bounds
Custom presets and persistent preferences
Subfolders and numbered batch naming without overwriting results
Text or image watermarks with a preview
Target file size for JPEG, WebP and AVIF
Watched folders with conversion notifications
System tray and remembered closing choice
English and Spanish with flag selection
One free app, with no purchases or subscriptions
```

### What's new in version 2.0

```text
Forma 2.0 brings all tools into one free app: resizing, presets, subfolders, batch naming, text or image watermarks and previews. It adds target file sizes for JPEG, WebP and AVIF and watched folders with system notifications. Hide Forma in the tray, remember what happens when closing and change the choice later in settings. Flags appear in the language dropdown. Long watermark text fits completely without clipping. Preferences, originals, cancellation and safe closing are preserved. The first launch follows Windows languages and later launches remember your choice. APPX checks Microsoft Store for updates.
```

Suggested search terms if offered: `image converter`, `resize images`, `watermark`, `image compression`, `batch conversion`, `watched folder`, `WebP AVIF`.

## Notas para certificación / Notes for certification

Nota privada para revisores; no pegarla como descripción pública. Confirmar `runFullTrust` en el manifiesto final antes de copiar la justificación.

```text
Forma is a free Electron/Win32 desktop image utility. No login, payment, trial or test credentials are required. All image processing runs locally using Sharp/libvips. It reads user-selected files/folders and writes to the selected output location. runFullTrust supports the desktop process, filesystem conversion and optional in-process folder watching. No Windows service or automatic startup is installed.

Use non-sensitive sample images. Select input/output folders and convert. In Advanced tools, test resizing, presets, subfolders, numbering, watermarks, preview and target size (JPEG/WebP/AVIF). Animated GIF watermarking is explicitly rejected.

For watching, select disjoint source/output folders, start watching and add an image. Wait for stabilization. Closing offers Quit, Hide in tray or Cancel, with Remember choice. Hidden watching continues. The tray opens Forma, stops watching or quits. Change closing behavior and notifications in Advanced tools > System tray and notifications. Notices show start and grouped results; Windows notification settings may affect delivery.

English and Spanish are supported. First launch follows Windows language preferences, with English fallback; saved choices override them. APPX checks Store using StoreContext through hidden Windows PowerShell/WinRT and opens Microsoft Store for installation. It never downloads a GitHub EXE over the Store package. Image processing works offline; unavailable update services display an error instead of reporting no updates.
```

## Capturas y recursos

Preparar capturas reales de 2.0 en **ambos idiomas**, sin datos privados ni avisos simulados por las pruebas.

| Vista | Pie ES | English caption |
| --- | --- | --- |
| Lote con resultados | Convierte imágenes por lotes y revisa cada resultado. | Convert image batches and review each result. |
| Ajustes y tamaño | Guarda ajustes y redimensiona conservando proporciones. | Save presets and resize while preserving proportions. |
| Marca y vista previa | Añade marcas de agua y comprueba el resultado. | Add watermarks and preview the result. |
| Peso objetivo | Ajusta el peso de JPEG, WebP y AVIF. | Target JPEG, WebP and AVIF file sizes. |
| Vigilancia y bandeja | Automatiza carpetas y continúa desde la bandeja. | Automate folders and keep running in the tray. |

Microsoft requiere descripción y al menos una captura; recomienda cuatro o más por dispositivo. Para Desktop: PNG de al menos 1366 × 768, hasta 50 MB; pies de hasta 200 caracteres. Las capturas de prueba de 760 × 600 o 1100 × 760 no sirven como capturas finales. Los iconos generados por `scripts/create-icons.mjs` no sustituyen capturas. [Requisitos oficiales de imágenes](https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/msix/screenshots-and-images).

## Validación y envío

1. Verificar 2.0.0 en paquete, lockfile, novedades, changelogs y documentación; privacidad ES/EN actualizada.
2. Con Node 24: `npm ci`, `npm run typecheck`, `npm test`. Compilar/probar ES y después EN, secuencialmente; incluir `node scripts/run-desktop-tests.mjs es --watch-close` y equivalente EN.
3. Generar ambos pares EXE/APPX. Ejecutar `scripts/verify-windows-package.ps1` con directorio e idioma correctos inmediatamente después de cada compilación, antes de cambiar los intermedios al otro idioma.
4. Probar instalación limpia y actualización desde 1.3.0, preferencias e idioma, aviso de novedades una sola vez, herramientas, bandeja y cierre con trabajo activo. Ejecutar Windows App Certification Kit.
5. Verificar Store con/sin actualización y sin conexión desde una instalación Store. Cerrar revisión de licencias y fuentes de componentes distribuidos.
6. En el producto existente de Partner Center, cargar un APPX y confirmar identidad, versión, capacidades, requisitos y nombres. Completar precio, mercados, edades, contacto, privacidad, fichas ES/EN, capturas y notas.
7. Para primera publicación dejar Novedades vacío; el texto 2.0 es para actualizar una ficha existente. Resolver los errores del portal y enviar a certificación solo con autorización. GitHub no realiza ese envío.

No publicar el borrador ni reemplazar alias de R2 antes de cerrar validaciones y obtener autorización. Cambiar documentación en main después del tag no cambia los binarios ya compilados.

## Referencias oficiales

- [Ficha MSIX/APPX](https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/msix/add-and-edit-store-listing-info): descripción hasta 10 000 caracteres; novedades hasta 1500; hasta 20 características de 200 caracteres; descripción corta recomendada menor de 270.
- [Requisitos de paquetes](https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/app-package-requirements?pivots=store-installer-msix).
- [Capacidades y runFullTrust](https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/app-capability-declarations): justificar capacidades restringidas durante el envío.
