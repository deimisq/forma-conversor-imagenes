<div align="center">

<img src="assets/forma-logo-1080x1080.png" alt="Forma" width="112" />

# Forma · Image Converter

Free, open-source batch image conversion for Windows. Your images stay on your computer.

[![License: GPL v3](https://img.shields.io/badge/license-GPL_v3-blue.svg)](LICENSE)
[![GitHub release](https://img.shields.io/github/v/release/deimisq/forma-conversor-imagenes)](https://github.com/deimisq/forma-conversor-imagenes/releases/latest)
[![Windows release](https://github.com/deimisq/forma-conversor-imagenes/actions/workflows/release.yml/badge.svg)](https://github.com/deimisq/forma-conversor-imagenes/actions/workflows/release.yml)

![Windows x64](https://img.shields.io/badge/Windows-x64-0078D4)
![Electron · Vue · TypeScript](https://img.shields.io/badge/Electron-Vue_3_%C2%B7_TypeScript-42b883)
![Idiomas ES / EN](https://img.shields.io/badge/idiomas-ES_%2F_EN-64748b)
![Gratis](https://img.shields.io/badge/gratis-100%25-16a34a)

[Download](https://github.com/deimisq/forma-conversor-imagenes/releases/latest) · [Usage](#usage-and-formats) · [Contribute](CONTRIBUTING.md) · [Roadmap](ROADMAP.md) · [Support](SUPPORT.md) · [Español](README.md)

</div>

## One free app

**What's new in 2.1.0:** document and format tools (combined or per-image PDF, PDF pages to PNG/JPEG with password, ICO, HEIC to PNG beta, TIFF pages, animated WebP and JPEG XL beta), original/result comparison, crop/pad, rotation/mirrors, grayscale, sRGB profile without EXIF, progressive JPEG, lossless WebP and portable JSON presets. See the [changelog](CHANGELOG.en.md) and [implementation status](docs/NEXT_VERSION.md).

Technical research: [PDF, JPEG XL and other formats](docs/FORMAT_RESEARCH_2026-11.md), with original engine probes and proposed dependencies. See the [current implementation and limits](docs/FORMAT_IMPLEMENTATION.md).

Voluntarily support development through **Support Forma** in the top bar or [GitHub Sponsors](https://github.com/sponsors/deimisq). It opens your browser; donations unlock no features and Forma remains free.

Watched folders show Windows notifications when converting images and a summary of the results. Closing Forma lets you quit or hide it in the system tray and remember your choice. Watching continues while hidden. Restore or quit from the tray icon; change the choice or disable notifications in **Advanced tools → System tray and notifications**.

Forma has a single free edition. Future features will join this same application, without a separate Pro edition or paid feature tiers. The Spanish and English packages are variants of the same app.

**Forma 2.0** brought eight tools into the single free app: resizing, presets, subfolders, batch naming, watermarks, preview, target file size and watched folders. **2.1.0** adds the items above. See the [release criteria](V2_RELEASE.md) and [roadmap](ROADMAP.md).

> **Status:** `main` is version **2.1.0** (in preparation). The latest published version is the one listed in [Releases](https://github.com/deimisq/forma-conversor-imagenes/releases); check the notes of the release you download.

**2.0.0** is tagged `v2.0.0` and was submitted to Microsoft Store. **2.1.0** is integrated into `main`; its `v2.1.0` tag creates a draft release without R2 that must be reviewed before publishing. Packages remain subject to the [release criteria](V2_RELEASE.md). No draft is a stable publication or Store certification.

## Local test APPX

```powershell
npm run build:preview:appx
```

Output goes to `release/preview/`. **Forma Preview** has a separate identity and local data, includes ES/EN and does not receive automatic updates. This command does not publish or install the app; local installation requires signing and trusting a test certificate. Do not use this configuration for Store submissions.

## Download

Get the Windows x64 EXE from [GitHub Releases](https://github.com/deimisq/forma-conversor-imagenes/releases/latest). Both variants include Spanish and English. Forma uses the Windows language on first launch and remembers your selection afterward.

The EXE checks GitHub for updates. Microsoft Store distribution uses APPX and checks the Store. See the [release guide](STORE_RELEASE.md) for publication status and remaining validation.

## Features

- Convert to JPEG, PNG, WebP, AVIF, TIFF and GIF locally.
- Add files, drag and drop, or scan folders and subfolders.
- Process up to three images concurrently while preserving originals.
- Cancel pending work, retry failures and review output size and savings.
- Keep format, quality, destination and language preferences between sessions.
- Resize, save presets, preserve subfolders and rename with numbering.
- Add text/image watermarks with previews and target JPEG/WebP/AVIF file sizes.
- Watch folders, receive notifications and continue processing from the system tray.
- Combine images into PDF, export PDF pages to PNG/JPEG, create ICO and convert HEIC, TIFF and animations (some in beta; see [limits](docs/FORMAT_IMPLEMENTATION.md)).
- Compare original and result, crop or pad the canvas, rotate, flip and convert to grayscale.

[Release notes](CHANGELOG.en.md) · [Privacy](PRIVACY.en.md) · [Support](SUPPORT.md) · [GPL v3 license](LICENSE)

## Languages

Both installers include Spanish and English. Use the flag and **ES / EN** selector
in the header to switch immediately. Your choice is saved locally in
`preferences.json` in the app's user data directory and restored at startup.
Forma's dialog labels and notifications also follow your choice; system buttons
follow Windows. Switching languages preserves the current files, settings and output directory.
Without a saved preference, the app uses the preferred Windows languages (Spanish or English), falling back to English when neither is supported.

## Development and verification

Windows 10 or later, x64. Development requires Node.js 24 (used in CI) and npm.

```powershell
npm ci
npm run dev
npm run dev:en
npm run typecheck
npm test
```

Run one development command at a time. Tests cover concurrent output reservations
with real image conversion, existing files, language switching, saved preferences,
invalid preferences, synchronized versions and release configuration.

After `npm run build:app`, run `npm run test:desktop` for real Electron verification
with a hidden window and isolated temporary data. It checks preload/IPC, live language
switching, saved preferences after reload, the native title and concurrent conversions.
Use `npm run test:desktop:en` after `npm run build:app:en`. Both release commands run
the corresponding desktop test before publishing.

## Build

To test a version before release, open [the validation workflow](https://github.com/deimisq/forma-conversor-imagenes/actions/workflows/test-build.yml), select the latest run and download `forma-2.1.0-windows-x64-en` (or `-es`). Extract the ZIP and run the EXE. See [installation instructions](docs/INSTALL-TEST.md). These builds do not publish a stable release; the workflow also runs on every PR and push to `main`.

```powershell
npm run build:app
npm run build:app:en
npm run build:all
```

The first two commands compile without packaging. `build:all` sequentially builds
both NSIS and APPX variants. Standard packages go to `release/2.1.0/`, English packages
to `release/2.1.0/en/`. The variants share intermediate build directories; never build
them concurrently. Individual packaging commands are `npm run build` and `npm run build:en`.

Packages retain the same application and Store identity and replace the existing
installation. They are alternatives, not independent applications. A separate Store
product requires its own reserved identity. APPX manifests declare both languages,
with each variant's initial language listed first.

## Usage and formats

Choose files, drag them onto the app, or add a folder and its subfolders. Select
an output format, quality and destination, then convert. Up to three files run
concurrently. Cancellation stops pending work while active files finish. Original
files are preserved. Results use `-converted`, followed by a number when needed;
concurrent conversions cannot reuse the same output filename.

Image queue inputs: JPEG/JFIF/JPE, JXL (beta), PNG, WebP, AVIF, TIFF, GIF, SVG/SVGZ and
uncompressed 24/32-bit RGB BMP. Unsupported variants and damaged files show
individual errors. HEIC/HEIF-to-PNG is a separate beta tool. PDF, ICO and JPEG XL
also have separate controls; see [tool limits](docs/FORMAT_IMPLEMENTATION.md).
Image queue outputs: JPEG, PNG, WebP, AVIF, TIFF and GIF.
PNG and TIFF use default encoder settings. Static outputs retain the first frame
of an animation. Processing stays on your computer.

## Distribution and updates

**Draft releases:** every tag creates a draft release and skips R2 unless the repository variable `PUBLISH_RELEASES` is `true`. Do not recreate or move the existing `v2.0.0` tag. The draft requires collaborator access and does not replace stable downloads. [STORE_RELEASE.md](STORE_RELEASE.md) contains English and Spanish listing fields and remaining Partner Center checks.

Tags matching the package version, such as `v2.1.0`, run tests and publish both
variants through `npm run release:all` in GitHub Actions. Downloads are available in
[GitHub Releases](https://github.com/deimisq/forma-conversor-imagenes/releases).
NSIS uses separate update feeds: `latest.yml` for the standard installer, `en.yml`
for English. Changing the UI language does not change the feed. Downloads and
installation require user action. APPX checks Microsoft Store for package updates. The supported distribution channels are the direct-download EXE and the Microsoft Store APPX. See [STORE_RELEASE.md](STORE_RELEASE.md) for publication and validation instructions.

When R2 is configured, the workflow uploads all four packages and maintains
`forma-setup-latest.exe` and `forma-setup-en-latest.exe`, plus equivalent `.appx`
links and immutable versioned copies. See the [Spanish setup instructions](README.md)
for GitHub variables and secrets. Manual workflow runs rebuild both variants and
upload to R2 without modifying GitHub Releases.

NSIS supports `/S` for silent installation and a final `/D=<path>` argument.
Exit code `0` means success; code `2` means the previous version could not be
uninstalled correctly. The local installers are unsigned. Keep package and lockfile
versions synchronized, update both changelogs, validate packages, then publish the tag.

## Improvements retained from 1.3

Since 2.0, closing offers quitting safely or hiding in the tray while work continues.

Format, quality and destination persist between sessions. Folder scanning can be cancelled and reports inaccessible paths. Results show output size and savings (or growth) for the last batch; failed files can be retried separately. Open output uses the last batch destination. Closing during conversion stops queued work and waits for active files before exiting.

After an update, Forma shows a one-time dialog with the installed version, release date and notes in the saved language. It works offline and does not appear on fresh installs. Microsoft Store receives only the APPX; EXE installers from GitHub or R2 are for direct installation.

The PDF, ICO, JPEG XL, HEIC, TIFF and animation tools, included in 2.1.0, and their limits are documented in [Format tools](docs/FORMAT_IMPLEMENTATION.md).
