# Hoja de ruta · Forma gratuita

Forma tendrá una única edición gratuita bajo la licencia GPL v3 del proyecto. Todas las herramientas previstas para la antigua edición comercial se incorporarán a esta aplicación. Los paquetes español e inglés son variantes del mismo producto.

## Meta: Forma 2.0

La meta activa es lanzar **2.0.0** cuando las ocho herramientas estén completas y validadas. Consulta [V2_RELEASE.md](V2_RELEASE.md) para los criterios, avances y bloqueos de publicación.

Las seis herramientas de la base comercial se integraron en el código de desarrollo. También se implementaron peso objetivo (JPEG/WebP/AVIF) y vigilancia de carpetas. Todavía no están publicadas como 2.0: faltan validaciones finales, paquetes e instalaciones reales.

| Herramienta | Código de desarrollo | Validación pendiente |
| --- | --- | --- |
| Redimensionado | Integrado, sin recorte y con ampliación opcional | Revisión visual y paquetes |
| Ajustes guardados | Integrados con migración de opciones básicas | Escenarios adicionales de migración |
| Subcarpetas | Integradas con raíces y control de rutas | Instalación real |
| Renombrado | Integrado con numeración estable en reintentos | Escenarios adicionales de reintento |
| Marcas de agua | Integradas, texto o imagen | GIF animados se rechazan explícitamente |
| Vista previa | Integrada, misma conversión sin escribir archivos | Opciones expandidas y memoria |
| Peso objetivo | Implementado para JPEG, WebP y AVIF | Imágenes grandes y validación visual |
| Carpetas vigiladas | Implementadas, sesión manual y espera de estabilidad | Errores de permisos y cierre durante vigilancia |

Las marcas y vistas previas mantienen límites de memoria de 40 megapíxeles. Las marcas de imagen admiten hasta 20 MB y no admiten animación. El peso objetivo permite reducir dimensiones únicamente si se autoriza en sus opciones y falla sin guardar resultados mayores al límite.

## Modelo comercial descartado

No se incorporarán compras, complementos de pago, precios, recuperación de compras, desbloqueo Pro ni permisos de funciones basados en licencias. La consulta a Microsoft Store se utiliza para actualizaciones del APPX.

La decisión del propietario de unificar el producto reemplaza el plan anterior de mantener herramientas exclusivas en un repositorio comercial. No cambia las licencias ni obligaciones de componentes de terceros. No se han modificado, publicado ni archivado repositorios remotos durante esta revisión.

## Distribución

- EXE/NSIS desde GitHub Releases, con actualizaciones desde GitHub.
- APPX en Microsoft Store, con actualizaciones desde la tienda.
- R2 opcional como copia de descargas directas.

Consulta [STORE_RELEASE.md](STORE_RELEASE.md) para las comprobaciones y el proceso de publicación. No hay una fecha ni versión comprometida para las funciones pendientes.

## English

Forma has one free GPL v3 edition. The development source now integrates resizing, presets, folder preservation, batch naming, watermarks and previews, and implements target-size compression and watched folders. These are not yet published; Forma 2.0 remains gated by validation in V2_RELEASE.md. Purchases, paid add-ons and Pro unlocking are dropped. Integration must preserve both languages, preferences, safe conversion, and separate GitHub EXE / Store APPX update channels.
