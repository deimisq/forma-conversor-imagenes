# Forma privacy policy

**Last updated: November 12, 2026 · Forma 2.0.0** · [Español](PRIVACY.md)

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

## Preferences, presets and tools

Forma stores language and basic conversion options in `preferences.json` in local user data. Advanced options and named presets use `tools-settings.json`. These may contain format, quality, output folder, resize rules, naming rules, watermark text and the local path to a watermark image. They contain no image contents or usage statistics and are not sent to servers.

Previews are generated in memory without saving output. Folder watching reads selected folders while Forma is open; its paths and state remain in the current session and watching does not resume automatically after restarting. Stop it from Advanced tools. Results are saved to the selected output folder and originals are preserved.

Change settings in the app or remove their files while Forma is closed to reset them. Without a saved language, Forma follows Windows languages and falls back to English. Uninstallation may retain local settings for reinstalls.

## Tray, notifications and release notes

The closing choice and notification preference are saved in `preferences.json`. Hiding keeps Forma and watching running; it installs no service and configures no Windows startup. Windows notifications show the source folder name when starting and counts/errors in the result summary, without image contents. Disable notices in Advanced tools → System tray and notifications, stop watching from the app or tray, and quit completely from the tray icon.

The local `release-notice.json` marker stores the last opened version to avoid repeating release notes. It is not sent to servers. Watching does not resume automatically after quitting and reopening Forma.

## Network connections and updates

NSIS installations check GitHub Releases on startup, every six hours while open,
and when you request a check. Standard and English installers use separate update
channels (`latest` and `en`); your UI language preference is not sent or used to
change the channel. APPX packages use Microsoft Store updates instead of GitHub.

An HTTPS connection exposes ordinary technical information, such as your IP address,
request time and client metadata, to GitHub under its
[privacy statement](https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement).
Forma does not receive your IP address or use these requests to identify you.
EXE/NSIS updates are downloaded only when requested and cached locally. Installation begins
when you choose to install and restart.

Optional copies of direct-download installers may be hosted on Cloudflare R2. Microsoft Store distributes the APPX. Cloudflare receives ordinary
connection information under its [privacy policy](https://www.cloudflare.com/privacypolicy/).
This does not change local image processing. Forma includes no advertising, accounts,
analytics, cross-app tracking or proprietary telemetry and sends no conversion statistics.

## Microsoft Store

The voluntary support button opens GitHub Sponsors in your browser. It sends no images or local paths; GitHub manages browsing, accounts and any payments under its terms. Forma receives no banking details and does not verify donations to unlock tools. Exported JSON presets contain options and watermark text, excluding the watermark image path/file. Review the contents before sharing.

APPX Store queries can be initiated from the interface and never download GitHub installers. Microsoft Store manages its downloads and installations according to Windows update settings.

Microsoft may process account, download, licensing and update information under its
[privacy statement](https://privacy.microsoft.com/privacystatement). Forma receives
neither Microsoft credentials nor payment details.

## Retention and control

Images and results remain in folders you control. The updater manages cached
installers in your Windows profile. You can delete images and results in File Explorer;
uninstalling Forma does not delete converted images. Language preferences can be
removed as described above. This policy will be updated alongside any future feature
that changes the processing or connections described here.
