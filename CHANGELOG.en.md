# Changelog

## [1.2.0] - 2026-10-28

- Add instant Spanish/English switching with local SVG flags, ES/EN codes and keyboard support.
- Save and restore language preferences locally; translate Forma's dialogs and notifications.
- Provide both default-language installers with separate update channels and download URLs.
- Declare both supported languages in APPX manifests.
- Prevent concurrent conversions from overwriting outputs with the same basename.
- Deduplicate folder imports and prevent batch changes during conversion.
- Report deleted input files and display batch errors.
- Size virtual file lists to the actual window height.
- Delegate APPX updates to Microsoft Store and validate conversion options.
- Add regression tests for real conversions, language switching, preferences, versions and release configuration.

For earlier releases, see the [Spanish changelog](CHANGELOG.md).
