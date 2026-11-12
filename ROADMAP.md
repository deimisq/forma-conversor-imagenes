# Hoja de ruta · Forma gratuita

Forma 2.0.0 está integrada en `main`, con tag `v2.0.0` y compilación a un release borrador. Hay una única edición gratuita GPL v3; los instaladores ES/EN son variantes del mismo producto. [Estado y criterios de entrega](V2_RELEASE.md).

## Herramientas 2.0

| Herramienta | Implementación y comprobaciones |
| --- | --- |
| Redimensionado | Ancho, alto, porcentaje y límites; proporciones, EXIF y ampliación opcional probados |
| Ajustes | Crear, aplicar, actualizar, eliminar y persistir; migración de preferencias básicas probada |
| Subcarpetas | Raíces de origen y control del destino; probado con selecciones mixtas |
| Renombrado | Prefijos, sufijos y numeración estable en reintentos; evita sobrescrituras |
| Marcas de agua | Texto completo sin recortes o imagen, posiciones y opacidad; GIF animados se rechazan |
| Vista previa | Motor compartido con conversión, sin guardar resultados; probada con marcas |
| Peso objetivo | JPEG/WebP/AVIF; reducción opcional de dimensiones y error si no alcanza el límite |
| Carpeta vigilada | Archivos estables, subcarpetas, recuperación de errores y cierre seguro probados |

También implementados y probados en escritorio: bandeja del sistema, elección recordada de cerrar/ocultar, ajustes para cambiarla, notificaciones agrupadas de vigilancia, desactivación de avisos y selector ES/EN con banderas en la lista.

Las marcas y vistas previas mantienen un límite de 40 megapíxeles en original y resultado. Las marcas de imagen admiten PNG/JPEG/WebP sin animación, hasta 20 MB. La vigilancia debe iniciarse manualmente y continúa al ocultar la ventana; no crea servicios ni arranque con Windows.

## Estado de Store y mejoras propuestas

El propietario confirma el envío de 2.0 a Microsoft Store; pendiente de aprobación. La investigación [Mejoras posteriores a 2.0](docs/PRODUCT_RESEARCH_2026-11.md) compara herramientas y propone prioridades sin comprometer versiones.

## Comprobaciones pendientes

- Completar instalación limpia y actualización real desde 1.3.0 conservando idioma y preferencias.
- Validar el APPX instalado desde Store con/sin actualizaciones y sin conexión; ejecutar Windows App Certification Kit.
- Cerrar avisos, licencias y fuentes de componentes de terceros.
- Esperar la aprobación de Store; atender observaciones de certificación y confirmar qué versión queda disponible.
- Confirmar autorización antes de publicar el borrador o reemplazar descargas estables.

El tag existente no debe recrearse ni moverse. Las pruebas automatizadas no sustituyen estas validaciones reales. La guía [STORE_RELEASE.md](STORE_RELEASE.md) contiene textos para copiar y datos que debe confirmar el propietario.

## Modelo y distribución

No hay compras, suscripciones, complementos de pago, desbloqueo Pro ni permisos basados en licencias comerciales. Las mejoras futuras pertenecen a esta misma app gratuita. La unificación no elimina las obligaciones de componentes de terceros.

- EXE/NSIS desde GitHub, actualizado desde GitHub.
- APPX desde Microsoft Store, actualizado por Store.
- R2 opcional como copia de descargas directas; el tag 2.0.0 lo omite mientras está en borrador.

## English

Forma 2.0.0 is integrated into main and tagged v2.0.0, building a draft release. All eight tools, tray behavior, watched conversion notifications and language flags are implemented. Automated tests and bilingual desktop/package checks passed, while real installation/upgrade, Store updates, certification, final screenshots and dependency licensing remain publication gates. There are no paid tiers or Pro unlocking. See the release criteria and the bilingual Store listing fields linked above.
