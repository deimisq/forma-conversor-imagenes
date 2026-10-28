# Forma privacy policy

**Last updated: October 28, 2026 · Forma 1.2.0** · [Español](PRIVACY.md)

Forma is a Windows desktop app for local batch image conversion.

## Maintainer and contact

Forma is maintained by [deimisq on GitHub](https://github.com/deimisq).
For privacy questions, open an issue in the
[Forma repository](https://github.com/deimisq/forma-conversor-imagenes/issues).
Do not post images, local paths or personal information publicly; ask to continue
through a private channel.

## Images and local files

Sharp processes images on your computer. Forma reads the files and folders you
select, including names, paths and metadata needed to display and convert them.
Original images are not uploaded to Forma, GitHub, Microsoft or other servers.
Results are saved to your chosen directory, or to `Pictures/Imagenes convertidas`
or `Pictures/Converted images` depending on the language at startup. Windows may
display a localized name for Pictures. Forma keeps no separate copy of your images.
Originals and results remain in the locations you control until you move or delete them.

## Language preference

Forma saves your language choice (`es` or `en`) in `preferences.json` in the app's
local user data directory. This contains no images, file paths or usage statistics
and is not sent to a server. Change it using the ES / EN selector or remove the
file while Forma is closed to restore the installer's initial language. Uninstallation
may retain local application data for future reinstalls.

## Network connections and updates

NSIS installations check GitHub Releases on startup, every six hours while open,
and when you request a check. Standard and English installers use separate update
channels (`latest` and `en`); your UI language preference is not sent or used to
change the channel. APPX packages use Microsoft Store updates instead of GitHub.

An HTTPS connection exposes ordinary technical information, such as your IP address,
request time and client metadata, to GitHub under its
[privacy statement](https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement).
Forma does not receive your IP address or use these requests to identify you.
Updates are downloaded only when requested and cached locally. Installation begins
when you choose to install and restart.

Direct Store downloads may be hosted on Cloudflare R2. Cloudflare receives ordinary
connection information under its [privacy policy](https://www.cloudflare.com/privacypolicy/).
This does not change local image processing. Forma includes no advertising, accounts,
analytics, cross-app tracking or proprietary telemetry and sends no conversion statistics.

## Microsoft Store

Microsoft may process account, download, licensing and update information under its
[privacy statement](https://privacy.microsoft.com/privacystatement). Forma receives
neither Microsoft credentials nor payment details.

## Retention and control

Images and results remain in folders you control. The updater manages cached
installers in your Windows profile. You can delete images and results in File Explorer;
uninstalling Forma does not delete converted images. Language preferences can be
removed as described above. This policy will be updated alongside any future feature
that changes the processing or connections described here.
