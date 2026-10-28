# Entrega 1.2.0 a Microsoft Store

La app incluye ambos idiomas con selector de bandera y siglas ES / EN. La preferencia
se guarda al instante y se recupera al reiniciar. Los paquetes difieren en el nombre
comercial y el idioma inicial cuando aún no existe una preferencia.

## Paquetes

| Variante inicial | NSIS x64 | APPX x64 |
| --- | --- | --- |
| Español | `release/1.2.0/forma-setup-1.2.0.exe` | `release/1.2.0/forma-setup-1.2.0.appx` |
| English | `release/1.2.0/en/forma-setup-en-1.2.0.exe` | `release/1.2.0/en/forma-setup-en-1.2.0.appx` |

Versión de aplicación: **1.2.0**. Versión de manifiesto APPX: **1.2.0.0**.
Ambos declaran `es-ES` y `en-US`, con el idioma inicial primero. Conservan:

- Identity: `DeimisQuintanilla.FormaConversordeImgenes`.
- Publisher: `CN=5EE69F12-D1D5-44E6-810D-F3E75E2B3C3F`.
- Application ID: `FormaConversorDeImagenes`.

## Publicación

1. Ejecutar `npm ci`, `npm run typecheck`, `npm test` y `npm run build:all`.
2. Probar ES → EN → ES y reinicio, conversión, cancelación y archivos de igual nombre.
   Las pruebas automatizadas de Electron (`test:desktop` y `test:desktop:en`, después
   de compilar su variante) comprueban el puente IPC, el selector, la persistencia y
   conversiones reales; la instalación en una máquina limpia se revisa por separado.
3. Revisar manifiestos, versión y metadatos de actualización.
4. Subir el commit y el tag `v1.2.0` a GitHub. Actions publica las dos variantes y,
   si está configurado, copia los cuatro paquetes a R2. Confirmar que el workflow termine correctamente.
5. En Partner Center, crear una actualización del producto existente y seleccionar
   el tipo de paquete que ya utiliza: conservar NSIS si la ficha usa descarga EXE;
   utilizar APPX si corresponde a esa ficha. No cambiar el tipo por deducción.
6. Añadir o actualizar las localizaciones española e inglesa de la ficha y su política
   de privacidad. Comprobar que 1.2.0/1.2.0.0 supere la versión actualmente publicada.
7. Enviar a certificación manualmente. El workflow no publica en Partner Center.

**Una ficha bilingüe no requiere subir dos APPX equivalentes.** Ambos paquetes tienen
la misma identidad, arquitectura y versión: son alternativas. Para la ficha actual
elige uno y añade sus dos localizaciones. Para una aplicación inglesa independiente
hay que reservar otra ficha y configurar su nueva identidad, Application ID y appId;
los paquetes de esta entrega no son una segunda aplicación independiente.

Para NSIS, las URLs R2 estables son `R2_PUBLIC_BASE_URL/forma-setup-latest.exe` y
`R2_PUBLIC_BASE_URL/forma-setup-en-latest.exe`. GitHub Releases redirige descargas;
el workflow comprueba que R2 responda directamente sin redirecciones.

## Novedades para la ficha española

Forma 1.2.0 incorpora un selector de español e inglés con banderas y recuerda tu idioma.
Mejora las conversiones simultáneas para evitar sobrescrituras, elimina duplicados al
añadir carpetas y corrige la visualización de listas largas. Tus imágenes siguen
procesándose localmente en tu equipo.

## What's new for the English listing

Forma 1.2.0 adds instant Spanish and English switching with flag icons and remembers
your language. Concurrent conversions preserve files with matching names, folder
imports avoid duplicates, and long file lists display correctly. Your images continue
to be processed locally on your computer.

## Privacidad y límites de la entrega

Las políticas están en [español](PRIVACY.md) y [English](PRIVACY.en.md). Publicar sus
URLs accesibles en la ficha correspondiente. NSIS no está firmado con un certificado
de publicación; el APPX está preparado para que Microsoft Store lo firme. La certificación
de Store y las pruebas de instalación en una máquina limpia se realizan por separado.
