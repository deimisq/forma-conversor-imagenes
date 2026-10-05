# Instrucciones del proyecto

- App de escritorio Windows: Electron, Vue 3, TypeScript y Vite.
- Sharp procesa las imágenes en el proceso principal; limitar el paralelismo a tres conversiones.
- Mantener `contextIsolation` activado y exponer al renderer solo métodos IPC específicos mediante el preload.
- La interfaz y la documentación del producto deben permanecer en español.
- Los formatos de salida soportados actualmente son JPEG, PNG, WebP, AVIF, TIFF y GIF.
- Sigue SemVer; sincroniza `package.json` y `package-lock.json`, registra cambios en `CHANGELOG.md` y usa tags `vX.Y.Z`.
- El repo público para Releases y `electron-updater` es `deimisq/forma-conversor-imagenes`; publica instaladores únicamente desde tags SemVer mediante `.github/workflows/release.yml`.
- Comandos: `npm run dev`, `npm run typecheck`, `npm run build:app` y `npm run build` (instalador NSIS x64).

## Preparación

- [x] Verificar instrucciones Copilot en `.github`.
- [x] Aclarar requisitos: aplicación de escritorio para Windows y conversión por lotes.
- [x] Crear la base Electron/Vue/TypeScript en la raíz del workspace.
- [x] Implementar selección, cola, conversión, progreso, cancelación y salida configurable.
- [x] Extensiones de VS Code: ninguna es necesaria para compilar o ejecutar.
- [x] Compilar y validar la versión actualizada y su instalador; `npm audit` reporta cero vulnerabilidades.
- [x] Tarea de VS Code: no hace falta; los comandos están definidos en npm scripts.
- [x] Iniciar la aplicación interactiva tras confirmación del usuario.
- [x] Verificar que README e instrucciones reflejan el producto final.