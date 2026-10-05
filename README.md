# Forma | Conversor de Imágenes

Aplicación de escritorio para Windows que convierte colecciones grandes de imágenes localmente. La interfaz está construida con Vue 3 y TypeScript; Electron proporciona los diálogos y el acceso a archivos, y Sharp realiza las conversiones.

Forma se distribuye bajo la licencia [GNU GPL v3.0](LICENSE).

## Requisitos

- Windows 10 o posterior, 64 bits
- Node.js 20 o posterior y npm para desarrollo/compilación

## Desarrollo

```powershell
npm install
npm run dev
```

La ventana de Electron se abre junto al servidor local de Vite. Para comprobar tipos y generar la aplicación sin instalador:

```powershell
npm run typecheck
npm run build:app
```

## Instalador de Windows

```powershell
npm run build
```

El instalador NSIS x64 se genera en `release/1.1.0/`.

El instalador de desarrollo no está firmado con un certificado de publicación, por lo que Windows puede mostrar una advertencia de SmartScreen.

## Descargas y actualizaciones

Cada tag `vX.Y.Z` ejecuta el workflow de GitHub Actions y publica el instalador Windows x64 en [Releases](https://github.com/deimisq/forma-conversor-imagenes/releases). No hace falta clonar ni compilar: descarga `imagen-lote-setup-X.Y.Z.exe` desde la última versión.

La aplicación instalada consulta Releases al abrirse y cada seis horas. Si hay una versión nueva, muestra un aviso; el usuario puede descargarla y elegir cuándo instalarla y reiniciar. La consulta usa los metadatos y checksums de electron-updater; no se envían imágenes ni datos personales.

Al ejecutar el instalador con Forma ya instalada, detecta y muestra la versión actual, y ofrece actualizar, modificar los accesos directos o reparar los archivos de la aplicación. La configuración y los archivos de usuario se conservan.

## Versiones y entregas

El proyecto sigue SemVer: incrementa MAJOR para cambios incompatibles, MINOR para funciones nuevas y PATCH para correcciones. Mantén `version` en `package.json` y `package-lock.json` sincronizados, añade una entrada a `CHANGELOG.md` y etiqueta cada entrega como `vX.Y.Z`. electron-builder usa esa versión para el nombre y carpeta del instalador.

El remoto público está registrado en Git y en los metadatos de `package.json`. Para publicar una versión, sincroniza `package.json` y `package-lock.json`, actualiza `CHANGELOG.md` y sube el tag correspondiente; GitHub Actions compila y publica los artefactos usando su `GITHUB_TOKEN` de alcance limitado.

## Uso

Añade archivos individuales mediante el selector, suelta archivos sobre la ventana o selecciona una carpeta para buscar imágenes en sus subcarpetas. Elige formato, calidad y carpeta de destino; luego inicia la conversión. Los originales se conservan. Los archivos resultantes llevan el sufijo `-converted`; si el nombre ya existe, se agrega un número para evitar sobrescribirlo. Por defecto, los resultados se guardan en `Imágenes/Imagenes convertidas`.

La cola convierte hasta tres imágenes en paralelo, actualiza cada estado por separado y permite cancelar el resto del lote. Todo el procesamiento ocurre en el equipo.

## Formatos

Sharp puede leer los formatos de imagen que tengan soporte en su build de libvips. La aplicación acepta JPEG, PNG, WebP, AVIF, TIFF, GIF, BMP, SVG y HEIC/HEIF como entradas; un codec puede faltar para ciertos archivos y el error se informa en la cola.

Los formatos de salida disponibles son JPEG, PNG, WebP, AVIF, TIFF y GIF. La calidad ajustable aplica a los formatos con pérdida; PNG y TIFF usan sus opciones predeterminadas. Convertir una animación a un formato estático conserva el primer fotograma.