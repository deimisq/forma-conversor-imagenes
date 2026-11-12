# Contribuir a Forma

Forma es una única aplicación gratuita bajo GPL v3. Las funciones nuevas se incorporan a esta edición. Los paquetes español e inglés pertenecen al mismo producto.

## Errores y propuestas

Busca primero en [Issues](https://github.com/deimisq/forma-conversor-imagenes/issues). Para un error, indica versión de Forma, Windows, tipo de instalación (EXE o APPX), pasos y resultado esperado y obtenido. Comparte únicamente ejemplos sin datos privados.

Para proponer una función, describe el problema y un caso de uso. Una propuesta no implica que esté implementada ni comprometida para una versión.

## Desarrollo

Necesitas Windows x64, Node.js 24 (usado en CI) y npm.

```powershell
npm ci
npm run dev
```

1. Crea una rama con un propósito concreto.
2. Mantén español e inglés, el procesamiento local y la conservación de originales.
3. Conserva el aislamiento de Electron y expón únicamente IPC específico mediante el preload.
4. Ejecuta `npm run typecheck` y `npm test`. Para cambios de aplicación, ejecuta `npm run build:app` y `npm run test:desktop`. Valida también la variante inglesa cuando corresponda. Compila las variantes secuencialmente.
5. Abre un pull request con el problema, la solución y las comprobaciones realizadas. Añade capturas si cambia la interfaz.

No incluyas secretos, datos personales, dependencias instaladas ni paquetes compilados. Coordina las publicaciones por separado; consulta [STORE_RELEASE.md](STORE_RELEASE.md).

## English

Contributions are welcome. Search existing issues first. Include reproduction steps, app and Windows versions, installation type and expected versus actual behavior. Use non-sensitive sample images. For pull requests, describe the change and validation, preserve both languages and local processing, and run the checks above. Forma has one free edition; new features belong to that edition.
