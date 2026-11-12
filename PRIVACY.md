# Política de privacidad de Forma

**Última actualización: 28 de octubre de 2026 · Forma 1.2.0**

[English privacy policy](PRIVACY.en.md)

Forma es una aplicación de escritorio para Windows que convierte imágenes por lotes. Esta política describe la información que la aplicación procesa y las conexiones de red que realiza.

## Responsable y contacto

Forma es un proyecto independiente mantenido por la cuenta pública [deimisq en GitHub](https://github.com/deimisq). Para consultas sobre privacidad, abre una incidencia en el [repositorio de Forma](https://github.com/deimisq/forma-conversor-imagenes/issues). No publiques allí imágenes, rutas locales ni otros datos personales; indica que es una consulta de privacidad y solicita continuar por un canal privado.

## Imágenes y archivos

- La conversión se realiza localmente en tu equipo mediante Sharp.
- Forma lee los archivos o carpetas que seleccionas, incluidos sus nombres, rutas y metadatos necesarios para convertirlos y mostrar la cola.
- Las imágenes originales no se cargan ni se envían a Forma, GitHub, Microsoft ni a otros servidores.
- Los resultados se guardan en la carpeta que elijas o, de forma predeterminada, en `Imágenes/Imagenes convertidas` o `Imágenes/Converted images`, según el idioma al iniciar.
- Forma no conserva una copia propia de tus imágenes. Los originales y resultados permanecen en las ubicaciones de Windows que hayas elegido hasta que tú los muevas o elimines.

## Preferencias, ajustes y herramientas

Forma conserva idioma y opciones básicas de conversión en `preferences.json`, dentro de los datos locales del usuario. Las herramientas avanzadas y los ajustes con nombre se guardan en `tools-settings.json`. Pueden incluir formato, calidad, destino, tamaño, reglas de nombres, texto de marca de agua y ruta local de la imagen de marca. No incluyen el contenido de imágenes ni estadísticas de uso y no se envían a servidores.

Las vistas previas se generan en memoria y no guardan resultados. La vigilancia lee las carpetas elegidas mientras la aplicación está abierta; su ruta y estado se mantienen en la sesión y no se reanudan automáticamente al reiniciar. Puedes detenerla desde Herramientas avanzadas. Los resultados se guardan en el destino indicado y los originales se conservan.

Puedes cambiar los ajustes en la app o eliminar sus archivos con Forma cerrada para restablecerlos. Sin preferencia de idioma se usan los idiomas de Windows, con inglés como alternativa. El desinstalador puede conservar los datos locales para futuras reinstalaciones.

## Conexiones de red y actualizaciones

La versión distribuida mediante el instalador independiente consulta GitHub Releases para comprobar si hay una versión nueva. La comprobación se realiza al abrir la aplicación y, mientras permanece abierta, cada seis horas; también puede iniciarse manualmente desde la interfaz.

Los instaladores español e inglés consultan canales separados (`latest` y `en`).
La preferencia seleccionada en la interfaz no se envía ni modifica ese canal.
Los paquetes APPX se actualizan mediante Microsoft Store y no utilizan el actualizador de GitHub.

Al consultar GitHub, la conexión puede incluir los datos técnicos habituales de una solicitud HTTPS, como la dirección IP, la hora, la versión consultada y metadatos del cliente. GitHub procesa esa conexión conforme a su [Declaración de privacidad](https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement). Forma no recibe la dirección IP ni utiliza estas solicitudes para identificarte.

La aplicación no descarga una actualización hasta que eliges hacerlo. Si la descargas, el instalador se guarda temporalmente en el perfil local de Windows para que puedas iniciar la actualización desde Forma. La instalación solo comienza cuando confirmas la acción de instalar y reiniciar.

La app no incluye analítica, publicidad, seguimiento entre aplicaciones, cuentas de usuario ni telemetría propia. No envía datos de conversión ni estadísticas de uso.

Las copias opcionales de los instaladores de descarga directa pueden alojarse en Cloudflare R2. Microsoft Store distribuye el APPX. Al solicitar una descarga, Cloudflare recibe los datos técnicos habituales de la conexión al servidor de archivos y los procesa conforme a su [política de privacidad](https://www.cloudflare.com/privacypolicy/). Esto no afecta al procesamiento local de imágenes dentro de Forma.

## Microsoft Store

Microsoft puede procesar información relacionada con tu cuenta, la descarga, la licencia y las actualizaciones de la aplicación de acuerdo con sus propias condiciones y su [Declaración de privacidad](https://privacy.microsoft.com/privacystatement). Forma no recibe tus credenciales ni los datos de pago de Microsoft Store.

## Conservación y control

Las imágenes y resultados se conservan en las carpetas locales que administra Windows y que tú controlas. El instalador descargado para una actualización se conserva temporalmente en la caché local del actualizador y es administrado por este. Puedes eliminar las imágenes y resultados desde el Explorador de archivos. Desinstalar Forma no elimina las imágenes convertidas.

## Cambios en esta política

Si Forma incorpora una función que cambie el tratamiento de datos o las conexiones descritas aquí, esta política se actualizará junto con la versión correspondiente de la aplicación.
