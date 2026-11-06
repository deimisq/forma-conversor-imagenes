# Entrega 1.3.0 a Microsoft Store

Esta entrega incluye cierre seguro, búsqueda cancelable, reintento de fallidos,
preferencias de conversión, resumen de ahorro y un aviso de novedades después de actualizar.
La app sigue incluyendo español e inglés y procesa las imágenes localmente.

## Paquetes e identidad

| Variante inicial | NSIS x64 | APPX x64 |
| --- | --- | --- |
| Español | `release/1.3.0/forma-setup-1.3.0.exe` | `release/1.3.0/forma-setup-1.3.0.appx` |
| English | `release/1.3.0/en/forma-setup-en-1.3.0.exe` | `release/1.3.0/en/forma-setup-en-1.3.0.appx` |

Versión de aplicación: **1.3.0**. Versión de manifiesto APPX: **1.3.0.0**.
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
4. Revisar los manifiestos y confirmar que 1.3.0/1.3.0.0 sea superior a la versión publicada.
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
2. Subir el commit y el tag `v1.3.0`. El workflow publica las dos variantes en GitHub
   Releases y, si está configurado R2, copia los cuatro paquetes. Confirmar su resultado.
3. Abrir el producto existente en Partner Center y crear/editar la actualización.
   Conservar el tipo de paquete que ya utiliza la ficha: EXE/NSIS o APPX.
4. En Packages, cargar el APPX elegido o actualizar la URL versionada del EXE,
   según el tipo de ficha. Guardar el borrador y los cambios del paquete.
5. Actualizar las localizaciones española e inglesa con los textos siguientes,
   verificar privacidad y capturas, y enviar a certificación desde Partner Center.

El workflow no envía la aplicación a Partner Center ni completa la certificación.

### Si la ficha utiliza EXE/NSIS

Usar una URL HTTPS directa e inmutable de la versión, por ejemplo:

- Español: `R2_PUBLIC_BASE_URL/forma-setup-1.3.0.exe`.
- English: `R2_PUBLIC_BASE_URL/forma-setup-en-1.3.0.exe`.

Partner Center requiere una URL versionada nueva para cada binario actualizado;
no registrar los alias `latest`, que cambian de contenido. Los alias se conservan
para descargas generales. Comprobar que la URL versionada responde con HTTP 200
sin redirecciones y conservar el archivo sin reemplazarlo tras enviarlo.

El instalador debe admitir instalación silenciosa (`/S` en NSIS). Para esta vía,
Microsoft exige firma digital del instalador y sus archivos PE. La configuración
actual genera NSIS sin firma: antes de enviar por EXE, configurar firma válida,
volver a compilar y verificar el paquete firmado. No presentar este binario de
desarrollo como listo para certificación por EXE. APPX utiliza la firma de Store.

Las actualizaciones de instalaciones EXE corresponden al mecanismo de la app;
APPX instalado desde Store delega las actualizaciones en Microsoft Store.

Referencias oficiales: [requisitos de EXE/MSI](https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/msi/app-package-requirements)
y [actualizar una ficha EXE/MSI](https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/msi/publish-update-to-your-app-on-store).

## Novedades para la ficha española

Forma 1.3.0 mejora las conversiones por lotes: reintenta solo los archivos fallidos,
recuerda formato, calidad y destino, y muestra el tamaño final y el ahorro obtenido.
Permite cancelar la búsqueda de imágenes e informa las rutas inaccesibles. Al cerrar
durante una conversión, termina los archivos activos antes de salir. Incluye mejoras
de rendimiento, seguridad y accesibilidad, y muestra las novedades una sola vez al
abrir la app después de actualizar. Tus imágenes se procesan localmente.

## What's new for the English listing

Forma 1.3.0 improves batch conversion: retry only failed files, remember format,
quality and output folder, and see output size and savings. Cancel image searches
and review inaccessible paths. Closing during conversion finishes active files
before exiting. Performance, security and accessibility are improved, and release
notes appear once when opening the app after an update. Images are processed locally.

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
