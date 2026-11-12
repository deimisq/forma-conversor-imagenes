# Instrucciones del proyecto

- App de escritorio Windows: Electron, Vue 3, TypeScript y Vite.
- Sharp procesa las imágenes en el proceso principal; limitar el paralelismo a tres conversiones.
- Mantener `contextIsolation` activado y exponer al renderer solo métodos IPC específicos mediante el preload.
- Mantener la interfaz y documentación en español e inglés. Forma tiene una única edición gratuita; incorporar las funciones nuevas en ella, sin edición Pro ni niveles de pago.
- Los formatos de salida soportados actualmente son JPEG, PNG, WebP, AVIF, TIFF y GIF.
- Sigue SemVer; sincroniza `package.json` y `package-lock.json`, registra cambios en `CHANGELOG.md` y usa tags `vX.Y.Z`.
- El repo público para Releases y `electron-updater` es `deimisq/forma-conversor-imagenes`; publica instaladores únicamente desde tags SemVer mediante `.github/workflows/release.yml`.
- Distribución: EXE/NSIS desde GitHub con actualizaciones de GitHub; APPX en Microsoft Store con actualizaciones de Store. R2 aloja copias opcionales para descarga directa.
- Comandos: `npm run dev`, `npm run typecheck`, `npm run build:app` y `npm run build` (instalador NSIS x64).

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
## Meta Forma 2.0

- Completar las ocho herramientas y los criterios de V2_RELEASE.md antes de lanzar 2.0.0. No crear tags ni publicar paquetes durante la validación.
- Mantener los archivos de preferencias anteriores, preservar originales y separar EXE/GitHub de APPX/Store.
- Ejecutar npm test (incluye herramientas), typecheck y pruebas de Electron de ambas variantes secuencialmente.
