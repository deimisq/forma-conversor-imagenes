# Forma | Conversor de Imágenes

Aplicación de escritorio para Windows que convierte colecciones grandes de imágenes localmente. La interfaz está construida con Vue 3 y TypeScript; Electron proporciona los diálogos y el acceso a archivos, y Sharp realiza las conversiones.

Forma se distribuye bajo la licencia [GNU GPL v3.0](LICENSE).

Consulta la [Política de privacidad](PRIVACY.md) de la aplicación.

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

El instalador NSIS x64 se genera en `release/1.1.1/`.

El instalador de desarrollo no está firmado con un certificado de publicación, por lo que Windows puede mostrar una advertencia de SmartScreen.

### Parámetros y códigos de salida

- Instalación silenciosa: `/S` (S mayúscula). No se requiere la opción de instalación silenciosa sin modificadores.
- Directorio alternativo: `/D=<ruta>`; debe ser el último parámetro de la línea de comandos.
- Código `0`: instalación o actualización completada correctamente.
- Código `2`: electron-builder no pudo desinstalar correctamente la versión anterior durante una actualización. Debe tratarse como error de instalación, no como “la aplicación ya existe”.

El instalador estándar gestiona la actualización de una instalación existente usando el identificador estable de Forma. No se definen códigos personalizados separados para cancelación, falta de espacio, reinicio o errores de red; no los mapees a códigos inventados en el catálogo de Store.

## Descargas y actualizaciones

Cada tag `vX.Y.Z` ejecuta el workflow de GitHub Actions y publica el instalador Windows x64 en [Releases](https://github.com/deimisq/forma-conversor-imagenes/releases). No hace falta clonar ni compilar: descarga `forma-setup-X.Y.Z.exe` desde la última versión.

Si está configurado Cloudflare R2, el workflow también sube una copia versionada (`forma-setup-X.Y.Z.exe`) y reemplaza `forma-setup-latest.exe`. Para Microsoft Store se registra una sola vez la URL pública directa `R2_PUBLIC_BASE_URL/forma-setup-latest.exe`; no hay que editar el enlace de Store en cada versión.

Para habilitar la copia, crea un bucket R2 y asígnale un dominio público HTTPS que sirva los objetos directamente, sin redirecciones. En **Settings → Secrets and variables → Actions** del repositorio, añade:

- Variable `R2_BUCKET_NAME`: nombre del bucket.
- Variable `R2_PUBLIC_BASE_URL`: base HTTPS del dominio público, sin barra final (por ejemplo `https://descargas.ejemplo.com`).
- Secretos `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID` y `R2_SECRET_ACCESS_KEY`: token de API de R2 con permisos de lectura/escritura de objetos solo en ese bucket.

Si `R2_PUBLIC_BASE_URL` no está definida, el workflow publica normalmente GitHub Releases y omite el paso de R2. Cuando sí está configurada, verifica después de subir que `forma-setup-latest.exe` responde directamente con HTTP 200 y falla si la URL redirige.

La aplicación instalada consulta Releases al abrirse y cada seis horas. Si hay una versión nueva, muestra un aviso; el usuario puede descargarla y elegir cuándo instalarla y reiniciar. La consulta usa los metadatos y checksums de electron-updater; no se envían imágenes ni datos personales.

### Enlace directo para Microsoft Store

GitHub Releases redirige las descargas y Microsoft Store puede rechazar esa URL. El workflow también puede copiar cada instalador a Cloudflare R2, donde se mantiene una URL estable `forma-setup-latest.exe` que se actualiza automáticamente en cada release; la URL versionada se conserva en paralelo.

Para habilitarlo, crea un bucket R2 con acceso público mediante un dominio personalizado de descarga y configura en GitHub:

- Variable `R2_BUCKET_NAME`: nombre del bucket.
- Variable `R2_PUBLIC_BASE_URL`: URL pública HTTPS directa del bucket, sin barra final ni redirección.
- Secretos `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID` y `R2_SECRET_ACCESS_KEY`: credenciales S3 de R2 con permiso de escritura solo en ese bucket.

Después de configurar esos valores y ejecutar el workflow con un tag, usa `R2_PUBLIC_BASE_URL/forma-setup-latest.exe` como URL del paquete en Microsoft Store. La primera versión requiere una publicación etiquetada nueva o volver a ejecutar el workflow para copiar el instalador existente.

Al ejecutar el instalador con Forma ya instalada, NSIS usa el mismo identificador de producto para reconocerla y actualizar sus archivos en la ubicación seleccionada. Los datos de usuario y las imágenes convertidas se conservan.

## Versiones y entregas

El proyecto sigue SemVer: incrementa MAJOR para cambios incompatibles, MINOR para funciones nuevas y PATCH para correcciones. Mantén `version` en `package.json` y `package-lock.json` sincronizados, añade una entrada a `CHANGELOG.md` y etiqueta cada entrega como `vX.Y.Z`. electron-builder usa esa versión para el nombre y carpeta del instalador.

El remoto público está registrado en Git y en los metadatos de `package.json`. Para publicar una versión, sincroniza `package.json` y `package-lock.json`, actualiza `CHANGELOG.md` y sube el tag correspondiente; GitHub Actions compila y publica los artefactos usando su `GITHUB_TOKEN` de alcance limitado.

## Uso

Añade archivos individuales mediante el selector, suelta archivos sobre la ventana o selecciona una carpeta para buscar imágenes en sus subcarpetas. Elige formato, calidad y carpeta de destino; luego inicia la conversión. Los originales se conservan. Los archivos resultantes llevan el sufijo `-converted`; si el nombre ya existe, se agrega un número para evitar sobrescribirlo. Por defecto, los resultados se guardan en `Imágenes/Imagenes convertidas`.

La cola convierte hasta tres imágenes en paralelo, actualiza cada estado por separado y permite cancelar el resto del lote. Todo el procesamiento ocurre en el equipo.

## Formatos

Sharp puede leer los formatos de imagen que tengan soporte en su build de libvips. La aplicación acepta JPEG, PNG, WebP, AVIF, TIFF, GIF, BMP, SVG y HEIC/HEIF como entradas; un codec puede faltar para ciertos archivos y el error se informa en la cola.

Los formatos de salida disponibles son JPEG, PNG, WebP, AVIF, TIFF y GIF. La calidad ajustable aplica a los formatos con pérdida; PNG y TIFF usan sus opciones predeterminadas. Convertir una animación a un formato estático conserva el primer fotograma.