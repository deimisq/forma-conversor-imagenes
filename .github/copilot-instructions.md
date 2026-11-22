# Instrucciones del proyecto

- App de escritorio Windows: Electron, Vue 3, TypeScript y Vite.
- Sharp procesa las imágenes en el proceso principal; limitar el paralelismo a tres conversiones.
- Mantener `contextIsolation` activado y exponer al renderer solo métodos IPC específicos mediante el preload.
- Mantener la interfaz y documentación en español e inglés. Forma tiene una única edición gratuita; incorporar las funciones nuevas en ella, sin edición Pro ni niveles de pago.
- Los formatos de salida de la cola de imágenes son JPEG, PNG, WebP, AVIF, TIFF y GIF; las herramientas de documentos añaden PDF, PNG/JPEG de páginas, ICO, JPEG XL, WebP animado y HEIC a PNG.
- Sigue SemVer; sincroniza `package.json` y `package-lock.json`, registra cambios en `CHANGELOG.md` y usa tags `vX.Y.Z`.
- El repo público para Releases y `electron-updater` es `deimisq/forma-conversor-imagenes`; publica instaladores únicamente desde tags SemVer mediante `.github/workflows/release.yml`.
- Distribución: EXE/NSIS desde GitHub con actualizaciones de GitHub; APPX en Microsoft Store con actualizaciones de Store. R2 aloja copias opcionales para descarga directa.
- Comandos: `npm run dev`, `npm run typecheck`, `npm run build:app` y `npm run build` (NSIS y APPX x64).

## Preparación

- [x] Verificar instrucciones Copilot en `.github`.
- [x] Aclarar requisitos: aplicación de escritorio para Windows y conversión por lotes.
- [x] Crear la base Electron/Vue/TypeScript en la raíz del workspace.
- [x] Implementar selección, cola, conversión, progreso, cancelación y salida configurable.
- [x] Extensiones de VS Code: ninguna es necesaria para compilar o ejecutar.
- Antes de publicar, compilar y validar los paquetes y ejecutar la revisión de dependencias; no afirmar resultados de auditoría sin comprobarlos.
- [x] Tarea de VS Code: no hace falta; los comandos están definidos en npm scripts.
- [x] Iniciar la aplicación interactiva tras confirmación del usuario.
- [x] Verificar que README e instrucciones reflejan el producto final.
## Forma 2.0 y 2.1

- Forma 2.0.0 está en Microsoft Store (tag v2.0.0: no recrearlo ni moverlo). La 2.1.0 es su actualización; seguir los criterios de V2_RELEASE.md. Todo tag genera un release borrador sin R2 salvo que la variable del repositorio PUBLISH_RELEASES sea true; no publicar un borrador ni enviar a Store sin autorización del propietario.
- Mantener los archivos de preferencias anteriores, preservar originales y separar EXE/GitHub de APPX/Store.
- Ejecutar npm test (incluye herramientas y la cobertura de traducciones de errores), typecheck y pruebas de Electron de ambas variantes secuencialmente. Todo mensaje de error nuevo debe tener traducción ES/EN.
- El EXE de GitHub no está firmado (decisión del propietario); el APPX lo firma Microsoft Store.
