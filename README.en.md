# Forma | Image Converter

**Version 1.2.0** · [Español](README.md) · [Privacy policy](PRIVACY.en.md) · [Microsoft Store release guide](STORE_RELEASE.md)

Forma is a Windows desktop app for local batch image conversion, built with Vue 3,
TypeScript, Electron and Sharp. Licensed under [GNU GPL v3.0](LICENSE).

## Languages

Both installers include Spanish and English. Use the flag and **ES / EN** selector
in the header to switch immediately. Your choice is saved locally in
`preferences.json` in the app's user data directory and restored at startup.
Forma's dialog labels and notifications also follow your choice; system buttons
follow Windows. Switching languages preserves the current files, settings and output directory.
The standard installer starts in Spanish; the English installer starts in English
when no preference has been saved.

## Development and verification

Windows 10 or later, x64. Development requires Node.js 22.12 or later and npm.

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

```powershell
npm run build:app
npm run build:app:en
npm run build:all
```

The first two commands compile without packaging. `build:all` sequentially builds
both NSIS and APPX variants. Standard packages go to `release/1.2.0/`, English packages
to `release/1.2.0/en/`. The variants share intermediate build directories; never build
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

Inputs: JPEG, PNG, WebP, AVIF, TIFF, GIF, BMP, SVG and HEIC/HEIF, subject to the
codecs supported by the bundled Sharp/libvips build. Unsupported codecs or damaged
files show an individual error. Outputs: JPEG, PNG, WebP, AVIF, TIFF and GIF.
PNG and TIFF use default encoder settings. Static outputs retain the first frame
of an animation. Processing stays on your computer.

## Distribution and updates

Tags matching the package version, such as `v1.2.0`, run tests and publish both
variants through `npm run release:all` in GitHub Actions. Downloads are available in
[GitHub Releases](https://github.com/deimisq/forma-conversor-imagenes/releases).
NSIS uses separate update feeds: `latest.yml` for the standard installer, `en.yml`
for English. Changing the UI language does not change the feed. Downloads and
installation require user action. APPX updates are managed by Microsoft Store.

When R2 is configured, the workflow uploads all four packages and maintains
`forma-setup-latest.exe` and `forma-setup-en-latest.exe`, plus equivalent `.appx`
links and immutable versioned copies. See the [Spanish setup instructions](README.md)
for GitHub variables and secrets. Manual workflow runs rebuild both variants and
upload to R2 without modifying GitHub Releases.

NSIS supports `/S` for silent installation and a final `/D=<path>` argument.
Exit code `0` means success; code `2` means the previous version could not be
uninstalled correctly. The local installers are unsigned. Keep package and lockfile
versions synchronized, update both changelogs, validate packages, then publish the tag.
