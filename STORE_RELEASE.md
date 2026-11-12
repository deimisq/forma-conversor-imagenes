# Preparación de Forma 2.0.0 para Microsoft Store

## Cambios implementados después de 1.3.0 (sin publicar)

- El primer inicio usa los idiomas preferidos de Windows: español o inglés.
  Si ninguno está soportado, usa inglés. La elección guardada del usuario tiene
  prioridad en los siguientes inicios, aunque cambie el idioma del equipo.
- NSIS descargado desde GitHub consulta GitHub Releases mediante electron-updater.
  Mantiene los canales latest/en del instalador, independientes del idioma elegido.
  R2 aloja copias de descarga; no actúa como feed de actualización.
- APPX consulta StoreContext.GetAppAndOptionalStorePackageUpdatesAsync mediante
  Windows PowerShell/WinRT. Informa si hay actualizaciones y permite abrir la
  sección de actualizaciones de Microsoft Store. Los errores no se presentan
  como ausencia de actualizaciones. Nunca descarga un EXE de GitHub.

La distribución utiliza únicamente EXE/NSIS para instalación directa y APPX para Microsoft Store. No se publica EXE en Store ni se necesitan marcadores o argumentos de origen.

Validado localmente: tipos, regresiones, compilaciones española e inglesa y pruebas de Electron con Windows simulado en español/inglés, incluida la compilación española con Windows en inglés. Estas pruebas no sustituyen una instalación real desde Store.

Validación pendiente en equipos reales: APPX instalado desde Store con/sin una actualización disponible y sin conexión; EXE de GitHub con ambos canales y cambio de idioma.
Los cambios anteriores no forman parte del tag v1.3.0.

Esta entrega incluye cierre seguro, búsqueda cancelable, reintento de fallidos,
preferencias de conversión, resumen de ahorro y un aviso de novedades después de actualizar.
La app sigue incluyendo español e inglés y procesa las imágenes localmente.

## Paquetes e identidad

| Variante inicial | NSIS x64 | APPX x64 |
| --- | --- | --- |
| Español | `release/2.0.0/forma-setup-2.0.0.exe` | `release/2.0.0/forma-setup-2.0.0.appx` |
| English | `release/2.0.0/en/forma-setup-en-2.0.0.exe` | `release/2.0.0/en/forma-setup-en-2.0.0.appx` |

Versión de aplicación: **2.0.0**. Versión de manifiesto APPX: **2.0.0.0**.
Ambas variantes declaran `es-ES` y `en-US`, con el idioma inicial primero. Conservan:

- Identity: `DeimisQuintanilla.FormaConversordeImgenes`.
- Publisher: `CN=5EE69F12-D1D5-44E6-810D-F3E75E2B3C3F`.
- Application ID: `FormaConversorDeImagenes`.

Los APPX son alternativas con la misma identidad, arquitectura y versión: elegir uno
para la ficha existente y mantener las dos localizaciones. No subir ambos como si fueran
productos diferentes. Una aplicación inglesa independiente requiere otra identidad.

## Preparación y validación

1. Ejecutar `npm ci`, `npm run typecheck` y `npm test`.
2. Compilar y probar cada idioma secuencialmente; comparten directorios intermedios:

   `npm run build:app` → `npm run test:desktop` →
   `npm run build:app:en` → `npm run test:desktop:en`.

3. Ejecutar `npm run build:all` para generar ambos instaladores y ambos APPX.
4. Revisar los manifiestos y confirmar que 2.0.0/2.0.0.0 sea superior a la versión publicada.
5. Probar instalación limpia y actualización sobre la versión anterior con el mismo
   tipo de paquete. Confirmar idioma, preferencias, archivos originales y resultados.
6. Verificar los seis formatos de salida, GIF animado, archivos corruptos, cancelación,
   cierre durante un lote, reintento de fallidos y apertura del destino original.
7. En una actualización, abrir la app y comprobar el aviso de novedades. Cerrarla y
   volver a abrirla: el aviso no debe repetirse. En instalación limpia no aparece.

Las pruebas automatizadas usan datos temporales y ventana oculta. La instalación real,
la actualización desde Store y la certificación deben verificarse por separado.

## Publicación

1. Revisar [CHANGELOG.md](CHANGELOG.md), [CHANGELOG.en.md](CHANGELOG.en.md) y los datos
   de [shared/release.ts](shared/release.ts), manteniendo versión, fecha y novedades coherentes.
2. Subir el commit y el tag `v2.0.0` únicamente después de completar la validación y obtener autorización de publicación. El workflow publica las dos variantes en GitHub
   Releases y, si está configurado R2, copia los cuatro paquetes. Confirmar su resultado.
3. Abrir el producto existente en Partner Center y crear/editar la actualización.
   La distribución admitida en Store es APPX. Si la ficha actual utiliza EXE, revisar en Partner Center cómo habilitar la distribución APPX antes de enviar.
4. En Packages, cargar el APPX elegido. Guardar el borrador y los cambios del paquete.
5. Actualizar las localizaciones española e inglesa con los textos siguientes,
   verificar privacidad y capturas, y enviar a certificación desde Partner Center.

El workflow no envía la aplicación a Partner Center ni completa la certificación.

### Canales de distribución

- EXE/NSIS x64: descarga directa desde GitHub Releases (o su copia en R2), con actualizaciones desde GitHub.
- APPX x64: publicación en Microsoft Store, con consulta y actualización mediante la tienda. No se descarga un EXE de GitHub sobre APPX.
- R2 es opcional y aloja copias para descargas generales; no se registra una URL de EXE en Partner Center.

## Novedades para la ficha española

Texto preparado, pendiente de validación y publicación: Forma 2.0 reúne todas las
herramientas en una única aplicación gratuita. Redimensiona, guarda ajustes,
conserva subcarpetas, renombra por lotes y añade marcas de texto o imagen con vista
previa. Ajusta el peso de JPEG, WebP y AVIF y vigila carpetas mientras la app está
abierta. Conserva español e inglés, preferencias, cancelación y cierre seguro.
Tus imágenes se procesan localmente.

## What's new for the English listing

Prepared text, pending validation and publication: Forma 2.0 brings all tools into
one free application. Resize, save presets, preserve subfolders, rename batches and
add text or image watermarks with a preview. Target JPEG, WebP and AVIF file sizes
and watch folders while the app is open. Spanish and English, saved preferences,
cancellation and safe closing remain available. Images are processed locally.

## Aviso de novedades después de actualizar

- Se abre un diálogo informativo al iniciar una versión superior a la última abierta,
  con versión, fecha y novedades en el idioma guardado; funciona sin conexión.
- La versión abierta se registra en `release-notice.json`, dentro de los datos locales
  de Forma, separada de las preferencias de idioma y conversión.
- No se repite al cerrar el diálogo, reiniciar, recargar la interfaz o cambiar de idioma.
- Una instalación nueva registra la versión inicial sin mostrar el aviso. Las instalaciones
  anteriores sin marcador se reconocen por sus preferencias y muestran las novedades
  al migrar a esta entrega. Una desinstalación que borre los datos elimina ese historial.
- Funciona con actualizaciones NSIS y APPX mientras se conserve el directorio de datos.
- En próximas entregas actualizar [shared/release.ts](shared/release.ts), ambos changelogs,
  la versión de [package.json](package.json) y su lockfile antes de compilar.

## Privacidad

Las políticas están en [español](PRIVACY.md) y [English](PRIVACY.en.md).
Publicar sus URLs accesibles en las localizaciones correspondientes. El aviso utiliza
únicamente los datos de la versión incluidos en la app y su marcador local.
