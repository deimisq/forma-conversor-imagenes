# Forma 2.0.0 · Compilación de prueba / Test build

## Español

1. Descarga el artefacto de GitHub Actions y extrae el ZIP.
2. Ejecuta `forma-setup-2.0.0.exe` (o `forma-setup-en-2.0.0.exe`). Es el instalador para probar en tu equipo.
3. Abre Forma y entra en **Herramientas avanzadas**. La app detecta ES/EN de Windows al primer inicio y conserva después el idioma que selecciones.

Este instalador de prueba no tiene firma de publicación; Windows puede mostrar SmartScreen. Los APPX del mismo artefacto están sin firmar y se destinan a la validación de empaquetado/Store; no se instalan directamente sin firma y confianza en el certificado correspondiente. Para probar ahora, usa el EXE.

Prueba redimensionado, ajustes, subcarpetas, renombrado, marcas, vista previa, peso objetivo y vigilancia con imágenes de ejemplo. La vigilancia solo funciona mientras Forma está abierta. Las marcas sobre GIF animados se rechazan explícitamente.

Esta compilación no es un release estable. El workflow de pruebas no crea tags, no envía a Store ni sustituye los archivos de actualización de GitHub/R2. El tag v2.0.0 se compila por separado como borrador. Los instaladores EXE conservan el canal de GitHub de su variante; los APPX consultan Store. Conserva tus preferencias y resultados al probar una actualización.

## English

Download the Actions artifact, extract the ZIP and run the EXE installer. Open **Advanced tools** to test the new features. This unsigned test installer may trigger SmartScreen. APPX files in the artifact are unsigned packaging/Store candidates and require signing and certificate trust before local installation; use the EXE for this test. No stable release, Store submission or GitHub/R2 update feed is published by this workflow.
