# Changelog

## [2.0.0] - In preparation, unpublished

- Show flags inside the language dropdown options with keyboard navigation.
- Fit complete watermark text without clipping its end, preserving proportions and matching the preview.

- Ask whether to quit or hide in the system tray, remember and change the choice, and keep watching while hidden.
- Notify watched conversion starts and grouped results; allow disabling notifications and opening Forma from a notification.

- Include all tools in one free application.
- Resize by width, height, percentage and bounds while preserving proportions.
- Create, apply, update and delete persistent custom presets.
- Preserve subfolders and rename using prefixes, suffixes and numbering without overwriting results.
- Add text or image watermarks and preview without modifying originals.
- Target JPEG, WebP and AVIF file sizes; reduce dimensions only with permission and report unreachable limits.
- Watch folders during the session, wait for stable files and finish active conversions before closing.
- Detect the system language on first launch and remember the user's subsequent choice.
- Query Store for APPX updates and retain GitHub updates for EXE installations.
- Migrate preferences and extend tools, error, keyboard and safe closing tests.

Publication gates and remaining validation: [release criteria](V2_RELEASE.md).

## [1.3.0] - 2026-11-06

- Show offline release notes once on first launch after an update, in the saved language.

- Safely close active conversions; cancel folder scans and report skipped paths.
- Validate IPC and restrict navigation, windows, permissions and renderer resources.
- Optimize large queues, retry failed files and persist conversion options.
- Show output size and savings; retain the actual batch destination.
- Improve keyboard navigation, accessible progress and reduced motion.
- Test formats, animation, corrupt inputs, cancellation and safe close.

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
