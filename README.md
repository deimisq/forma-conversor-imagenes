<div align="center">

<img src="assets/forma-logo-1080x1080.png" alt="Forma" width="112" />

# Forma · Conversor de imágenes

Conversión de imágenes por lotes para Windows. Gratis, de código abierto y en tu equipo.

[![License: GPL v3](https://img.shields.io/badge/license-GPL_v3-blue.svg)](LICENSE)
[![GitHub release](https://img.shields.io/github/v/release/deimisq/forma-conversor-imagenes)](https://github.com/deimisq/forma-conversor-imagenes/releases/latest)
[![Windows release](https://github.com/deimisq/forma-conversor-imagenes/actions/workflows/release.yml/badge.svg)](https://github.com/deimisq/forma-conversor-imagenes/actions/workflows/release.yml)

![Windows x64](https://img.shields.io/badge/Windows-x64-0078D4)
![Electron · Vue · TypeScript](https://img.shields.io/badge/Electron-Vue_3_%C2%B7_TypeScript-42b883)
![Idiomas ES / EN](https://img.shields.io/badge/idiomas-ES_%2F_EN-64748b)
![Gratis](https://img.shields.io/badge/gratis-100%25-16a34a)

[Descargar](https://github.com/deimisq/forma-conversor-imagenes/releases/latest) · [Cómo usar](#uso) · [Contribuir](CONTRIBUTING.md) · [Hoja de ruta](ROADMAP.md) · [Soporte](SUPPORT.md) · [English](README.en.md)

</div>

## Una única app gratuita

La carpeta vigilada muestra notificaciones de Windows al convertir imágenes y un resumen del resultado. Al cerrar Forma puedes salir u ocultarla en la bandeja junto al reloj y recordar tu elección. La vigilancia continúa mientras está oculta. Puedes restaurarla o salir desde el icono, y cambiar la elección o desactivar los avisos en **Herramientas avanzadas → Bandeja y notificaciones**.

Forma tiene una sola edición gratuita. Las funciones futuras se incorporarán a esta misma aplicación, sin una edición Pro separada ni niveles de pago. Los paquetes en español e inglés son variantes de la misma app.

La meta activa es **Forma 2.0**: ocho herramientas incluidas en la única app gratuita. El código de desarrollo ya integra redimensionado, ajustes, subcarpetas, renombrado, marcas, vista previa, peso objetivo y vigilancia. Consulta [los criterios de entrega](V2_RELEASE.md) y la [hoja de ruta](ROADMAP.md).

> **Estado de desarrollo:** este README describe el código de trabajo. Las mejoras posteriores a 1.3.0 aún no están publicadas; consulta las notas del release que descargues. Las herramientas de 2.0 están en validación y no forman parte del release 1.3.0.

La **2.0.0** está integrada en `main` y tiene tag `v2.0.0`. Su workflow genera un release borrador y omite R2; los paquetes siguen sujetos a los [criterios de entrega](V2_RELEASE.md). No equivale a publicación estable ni certificación Store.

## APPX local de prueba

Para generar un paquete independiente de desarrollo:

```powershell
npm run build:preview:appx
```

La salida está en `release/preview/`. Se instala como **Forma Preview**, con identidad y datos separados de la app estable, incluye ES/EN y no recibe actualizaciones automáticas. El comando no publica ni instala la app; el APPX necesita una firma y un certificado de prueba confiable para instalarse localmente. No usar esta configuración para enviar paquetes a Store.

## Descargar

Descarga el instalador EXE para Windows x64 desde [GitHub Releases](https://github.com/deimisq/forma-conversor-imagenes/releases/latest). Ambas variantes incluyen español e inglés: Forma utiliza el idioma de Windows al abrirse por primera vez y recuerda los cambios que hagas después.

| Distribución | Instalación | Actualizaciones |
| --- | --- | --- |
| GitHub Releases | EXE / NSIS para Windows x64 | GitHub Releases, desde la app |
| Microsoft Store | APPX | Microsoft Store |

La preparación de Store y las comprobaciones pendientes están en la [guía de publicación](STORE_RELEASE.md). R2 es una copia opcional para descargas directas.

## Qué puedes hacer

- Convertir a **JPEG, PNG, WebP, AVIF, TIFF y GIF** sin subir imágenes a servidores.
- Añadir archivos, arrastrarlos a la ventana o buscar en carpetas y subcarpetas.
- Procesar hasta tres imágenes en paralelo conservando los originales.
- Cancelar la cola, reintentar fallidos y consultar el tamaño final y el ahorro.
- Conservar formato, calidad, carpeta de destino e idioma entre sesiones.
- Redimensionar, guardar ajustes, conservar subcarpetas y renombrar con numeración.
- Añadir marcas de texto o imagen con vista previa y limitar el peso de JPEG/WebP/AVIF.
- Vigilar carpetas, recibir avisos y seguir convirtiendo desde la bandeja del sistema.

[Novedades](CHANGELOG.md) · [Privacidad](PRIVACY.md) · [Soporte](SUPPORT.md) · [Licencia GPL v3](LICENSE)

## Uso

Añade archivos individuales mediante el selector, suelta archivos sobre la ventana o selecciona una carpeta para buscar imágenes en sus subcarpetas. Elige formato, calidad y carpeta de destino; luego inicia la conversión. Los originales se conservan. Los archivos resultantes llevan el sufijo `-converted`; si el nombre ya existe, se agrega un número para evitar sobrescribirlo. Por defecto, los resultados se guardan en `Imágenes/Imagenes convertidas`.

La cola convierte hasta tres imágenes en paralelo, actualiza cada estado por separado y permite cancelar el resto del lote. Todo el procesamiento ocurre en el equipo.

## Formatos

Sharp puede leer los formatos de imagen que tengan soporte en su build de libvips. La aplicación acepta JPEG, PNG, WebP, AVIF, TIFF, GIF, BMP, SVG y HEIC/HEIF como entradas; un codec puede faltar para ciertos archivos y el error se informa en la cola.

Los formatos de salida disponibles son JPEG, PNG, WebP, AVIF, TIFF y GIF. La calidad ajustable aplica a los formatos con pérdida; PNG y TIFF usan sus opciones predeterminadas. Convertir una animación a un formato estático conserva el primer fotograma.

## Mejoras conservadas de 1.3

En 2.0, al cerrar eliges entre salir (cierre seguro) u ocultar en la bandeja (continúa el trabajo).

La configuración de formato, calidad y destino se conserva entre sesiones. La búsqueda de carpetas se puede cancelar e informa las rutas inaccesibles. Al finalizar se muestra el tamaño de salida y el ahorro (o aumento) del último lote; puedes reintentar solo los archivos fallidos. Abrir destino utiliza la carpeta del último lote aunque cambies la selección. Si cierras Forma durante una conversión, se detiene la cola y se espera a los archivos activos antes de salir.

Después de actualizar, Forma muestra una sola vez un diálogo con la versión, fecha y novedades en el idioma guardado. No requiere conexión; las instalaciones nuevas no muestran este aviso.

## Requisitos

- Windows 10 o posterior, 64 bits
- Node.js 24 (versión usada en CI) y npm para desarrollo/compilación

## Desarrollo

### Variante en inglés

Ambas variantes incluyen español e inglés. El selector de la barra superior muestra
una bandera y las siglas **ES / EN**, admite teclado y cambia la interfaz al instante.
La elección se guarda localmente en `preferences.json`, dentro del directorio de datos
de la aplicación, y se restaura al abrirla. También cambia los textos de los diálogos
de Forma y las notificaciones; los botones del sistema conservan el idioma de Windows.
Cambiar el idioma conserva la cola, las opciones y la carpeta de destino actuales.
Sin preferencia guardada, usa los idiomas preferidos de Windows (español o inglés); si ninguno está soportado, usa inglés.

```powershell
npm run dev:en
npm run build:app:en
npm run build:en
```

El último comando genera NSIS y APPX en `release/2.0.0/en/`, con el nombre
**Forma Image Converter**. `npm run build` conserva los paquetes en español.
Ambas compilaciones comparten los directorios intermedios; compílalas secuencialmente.

La variante conserva la identidad y el editor de Microsoft Store: se trata de una
variante del producto actual y reemplaza la instalación existente. Para publicarla
como aplicación independiente hace falta reservar otra identidad en Partner Center.
El flujo automático publica ambas variantes y sus metadatos en GitHub Releases.
Los manifiestos APPX declaran ambos idiomas, con el idioma inicial de cada variante primero.
El EXE/NSIS de descarga directa consulta GitHub Releases. El APPX de Microsoft Store consulta las actualizaciones en la tienda. Son las dos vías de distribución admitidas.
NSIS en inglés consulta el canal `en` (`en.yml`), separado de `latest.yml` para evitar
que una actualización reinstale el español. Ese canal requiere publicar también los
artefactos ingleses y sus metadatos; el workflow ya publica ambos. El canal se mantiene
ligado al instalador aunque el usuario cambie el idioma de la interfaz.

Para validar conversiones, idiomas, persistencia, versiones y configuración, ejecuta `npm test`.
Después de `npm run build:app`, `npm run test:desktop` verifica Electron real con
ventana oculta y datos temporales: preload, IPC, cambio de idioma, restauración,
título nativo y conversiones. Tras `npm run build:app:en`, usa `npm run test:desktop:en`.
Para empaquetar las dos variantes secuencialmente, usa `npm run build:all`.

```powershell
npm ci
npm run dev
```

La ventana de Electron se abre junto al servidor local de Vite. Para comprobar tipos y generar la aplicación sin instalador:

```powershell
npm run typecheck
npm run build:app
```

## Instalador de Windows

Para probar Forma 2.0 antes del lanzamiento, abre [Compilar Forma 2.0 para pruebas](https://github.com/deimisq/forma-conversor-imagenes/actions/workflows/test-build.yml), selecciona la ejecución más reciente y descarga el artefacto `forma-2.0.0-windows-x64-es` (o `-en`). Extrae el ZIP y ejecuta el EXE. [Instrucciones de instalación](docs/INSTALL-TEST.md). Estas compilaciones no publican un release estable.

```powershell
npm run build
```

El instalador NSIS x64 y el APPX se generan en `release/2.0.0/`.

El instalador de desarrollo no está firmado con un certificado de publicación, por lo que Windows puede mostrar una advertencia de SmartScreen.

### Parámetros y códigos de salida

- Instalación silenciosa: `/S` (S mayúscula). No se requiere la opción de instalación silenciosa sin modificadores.
- Directorio alternativo: `/D=<ruta>`; debe ser el último parámetro de la línea de comandos.
- Código `0`: instalación o actualización completada correctamente.
- Código `2`: electron-builder no pudo desinstalar correctamente la versión anterior durante una actualización. Debe tratarse como error de instalación, no como “la aplicación ya existe”.

El instalador estándar gestiona la actualización de una instalación existente usando el identificador estable de Forma. No se definen códigos personalizados separados para cancelación, falta de espacio, reinicio o errores de red; no los mapees a códigos inventados en el catálogo de Store.

## Descargas y actualizaciones

**Excepción actual:** el tag existente `v2.0.0` usa `EP_DRAFT=true` y omite R2. No recrearlo ni moverlo. El borrador requiere acceso y no sustituye la descarga estable. [STORE_RELEASE.md](STORE_RELEASE.md) incluye los datos ES/EN preparados para Partner Center.

Cada tag `vX.Y.Z` ejecuta pruebas y `npm run release:all` en GitHub Actions. Publica ambos instaladores x64, ambos APPX y los metadatos `latest.yml` y `en.yml` en [Releases](https://github.com/deimisq/forma-conversor-imagenes/releases). Descarga `forma-setup-X.Y.Z.exe` para la variante estándar o `forma-setup-en-X.Y.Z.exe` para la variante inglesa; el idioma inicial de la interfaz sigue las preferencias de Windows.

Si está configurado Cloudflare R2, el workflow también sube una copia versionada (`forma-setup-X.Y.Z.exe`) y reemplaza `forma-setup-latest.exe`. R2 sirve como copia opcional de descarga directa; Microsoft Store recibe únicamente el APPX. Los alias `latest` son para descargas generales.

La variante inglesa usa `forma-setup-en-X.Y.Z.exe` y `forma-setup-en-latest.exe`.
También se copian los APPX con la misma nomenclatura. Se comprueba que existan los
cuatro paquetes antes de cambiar los enlaces públicos, y las URLs de ambos idiomas
permanecen separadas. La configuración y los secretos existentes sirven para ambos.

Para habilitar la copia, crea un bucket R2 y asígnale un dominio público HTTPS que sirva los objetos directamente, sin redirecciones. En **Settings → Secrets and variables → Actions** del repositorio, añade:

- Variable `R2_BUCKET_NAME`: nombre del bucket.
- Variable `R2_PUBLIC_BASE_URL`: base HTTPS del dominio público, sin barra final (por ejemplo `https://descargas.ejemplo.com`).
- Secretos `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID` y `R2_SECRET_ACCESS_KEY`: token de API de R2 con permisos de lectura/escritura de objetos solo en ese bucket.

Si `R2_PUBLIC_BASE_URL` no está definida, el workflow publica normalmente GitHub Releases y omite el paso de R2. Cuando sí está configurada, verifica después de subir que `forma-setup-latest.exe` responde directamente con HTTP 200 y falla si la URL redirige.

Para cargar en R2 la versión que ya está publicada, configura primero las variables y secretos y ejecuta manualmente **Publicar instalador Windows** desde GitHub Actions. La ejecución manual compila el paquete actual y solo lo copia a R2; no vuelve a crear ni modificar el GitHub Release. Las versiones futuras se copiarán automáticamente al subir sus tags.

La aplicación instalada mediante NSIS consulta Releases al abrirse y cada seis horas. Si hay una versión nueva, muestra un aviso; el usuario puede descargarla y elegir cuándo instalarla y reiniciar. La consulta usa los metadatos y checksums de electron-updater; no se envían imágenes; GitHub recibe los datos técnicos habituales de la conexión, según [Privacidad](PRIVACY.md). Los paquetes APPX delegan sus actualizaciones en Microsoft Store.

### Microsoft Store

En Partner Center se publica únicamente el APPX, conservando la identidad del producto. El EXE de GitHub es para instalación directa en equipos Windows compatibles. Consulta [STORE_RELEASE.md](STORE_RELEASE.md) para preparar la publicación y validar las actualizaciones.

Al ejecutar el instalador con Forma ya instalada, NSIS usa el mismo identificador de producto para reconocerla y actualizar sus archivos en la ubicación seleccionada. Los datos de usuario y las imágenes convertidas se conservan.

## Versiones y entregas

El proyecto sigue SemVer: incrementa MAJOR para cambios incompatibles, MINOR para funciones nuevas y PATCH para correcciones. Mantén `version` en `package.json` y `package-lock.json` sincronizados, añade una entrada a `CHANGELOG.md` y etiqueta cada entrega como `vX.Y.Z`. electron-builder usa esa versión para el nombre y carpeta del instalador.

El remoto público está registrado en Git y en los metadatos de `package.json`. Para publicar una versión, sincroniza `package.json` y `package-lock.json`, actualiza `CHANGELOG.md` y sube el tag correspondiente; GitHub Actions compila y publica los artefactos usando su `GITHUB_TOKEN` de alcance limitado.
