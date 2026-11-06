import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import ts from 'typescript'
import sharp from 'sharp'
import { createRequire } from 'node:module'
import { releaseArtifacts } from './release-artifacts.mjs'

async function moduleUrl(file, language) {
  let source = await fs.readFile(file, 'utf8')
  if (language) source = source.replace('declare const __APP_LANGUAGE__: string', '').replaceAll('__APP_LANGUAGE__', JSON.stringify(language))
  if (source.includes("from '../shared/locale'")) source = source.replace("'../shared/locale'", JSON.stringify(await moduleUrl('shared/locale.ts', language)))
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } })
  return `data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`
}
async function loadTypeScript(file, language) { return import(await moduleUrl(file, language)) }

const { reserveOutput } = await loadTypeScript('electron/output.ts')
const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'forma-regression-'))
try {
  const { consumeReleaseNotice } = await loadTypeScript('electron/release-notice.ts')
  const fresh = path.join(directory, 'fresh-install')
  assert.equal(await consumeReleaseNotice(fresh, '1.3.0'), false, 'Fresh installs must not show update notes')
  assert.equal(await consumeReleaseNotice(fresh, '1.3.0'), false, 'Restart must not repeat notes')
  assert.equal(await consumeReleaseNotice(fresh, '1.4.0'), true, 'A new version must show notes')
  assert.equal(await consumeReleaseNotice(fresh, '1.4.0'), false)
  assert.equal(await consumeReleaseNotice(fresh, '1.3.0'), false, 'Downgrades must not show update notes')
  assert.equal(await consumeReleaseNotice(fresh, '1.4.0'), false, 'Returning to a consumed version must not repeat notes')
  assert.equal(await consumeReleaseNotice(fresh, '2.0.0'), true)
  const legacy = path.join(directory, 'legacy-install')
  await fs.mkdir(legacy)
  await fs.writeFile(path.join(legacy, 'preferences.json'), JSON.stringify({ language: 'en', conversion: { format: 'webp', quality: 84, outputDir: '' } }))
  assert.equal(await consumeReleaseNotice(legacy, '1.3.0'), true, 'Existing 1.2 installs must see the first update notice')
  assert.equal(await consumeReleaseNotice(legacy, '1.3.0'), false)
  assert.equal(JSON.parse(await fs.readFile(path.join(legacy, 'preferences.json'), 'utf8')).language, 'en')
  await fs.writeFile(path.join(fresh, 'release-notice.json'), 'null')
  assert.equal(await consumeReleaseNotice(fresh, '2.0.0'), false, 'Malformed markers recover without blocking startup')
  await assert.rejects(consumeReleaseNotice(fresh, 'invalid'))
  const existing = path.join(directory, 'photo-converted.png')
  await fs.writeFile(existing, 'existing output')
  const outputs = await Promise.all(Array.from({ length: 20 }, () => reserveOutput(directory, 'photo', 'png')))
  assert.equal(new Set(outputs).size, 20, 'Concurrent workers must reserve different names')
  assert.equal(await fs.readFile(existing, 'utf8'), 'existing output')
  // Real image encodes into the reserved paths must preserve every worker result.
  await Promise.all(outputs.map((output, index) => sharp({ create: { width: index + 1, height: 2, channels: 4, background: '#ff000080' } }).png().toFile(output)))
  for (const [index, output] of outputs.entries()) assert.equal((await sharp(output).metadata()).width, index + 1)
  await assert.rejects(reserveOutput(path.join(directory, 'missing'), 'photo', 'png'), { code: 'ENOENT' })

  for (const language of ['es', 'en']) {
    const { t, setLanguage, defaultLanguage } = await loadTypeScript('shared/locale.ts', language)
    assert.equal(defaultLanguage, language)
    assert.equal(t('Convertir'), language === 'en' ? 'Convert' : 'Convertir')
    assert.equal(t('Imagenes convertidas'), language === 'en' ? 'Converted images' : 'Imagenes convertidas')
    setLanguage('en')
    assert.equal(t('Idioma'), 'Language')
    setLanguage('es')
    assert.equal(t('Idioma'), 'Idioma')
    assert.equal(defaultLanguage, language, 'UI changes must not change the build/update channel')
    assert.throws(() => setLanguage('fr'))

    const { readLanguage, writeLanguage, readConversionPreferences, writeConversionPreferences } = await loadTypeScript('electron/preferences.ts', language)
    const preferencesDirectory = path.join(directory, language)
    assert.equal(await readLanguage(preferencesDirectory), language)
    await writeLanguage(preferencesDirectory, 'en')
    assert.equal(await readLanguage(preferencesDirectory), 'en', 'Preference must survive a fresh read')
    await writeLanguage(preferencesDirectory, 'es')
    assert.equal(await readLanguage(preferencesDirectory), 'es')
    await assert.rejects(writeLanguage(preferencesDirectory, 'fr'))
    const conversion = { format: 'avif', quality: 91, outputDir: directory }
    await Promise.all([writeConversionPreferences(preferencesDirectory, conversion), writeLanguage(preferencesDirectory, 'en')])
    assert.deepEqual(await readConversionPreferences(preferencesDirectory), conversion)
    assert.equal(await readLanguage(preferencesDirectory), 'en')
    await assert.rejects(writeConversionPreferences(preferencesDirectory, { ...conversion, quality: 0 }))
    await assert.rejects(writeConversionPreferences(preferencesDirectory, { ...conversion, outputDir: 'relative' }))
    await fs.writeFile(path.join(preferencesDirectory, 'preferences.json'), '{invalid')
    assert.equal(await readLanguage(preferencesDirectory), language)
    await fs.writeFile(path.join(preferencesDirectory, 'preferences.json'), '{"language":"fr"}')
    assert.equal(await readLanguage(preferencesDirectory), language)
  }
  const metadata = JSON.parse(await fs.readFile('package.json', 'utf8'))
  const { currentRelease } = await loadTypeScript('shared/release.ts')
  assert.equal(currentRelease.version, metadata.version)
  assert.ok(currentRelease.notes.es.length && currentRelease.notes.en.length)
  assert.ok(!Number.isNaN(Date.parse(currentRelease.date)))
  const lock = JSON.parse(await fs.readFile('package-lock.json', 'utf8'))
  assert.equal(metadata.version, lock.version)
  assert.equal(metadata.version, lock.packages[''].version)
  const spanish = JSON.parse(await fs.readFile('electron-builder.json5', 'utf8'))
  const english = createRequire(import.meta.url)('../electron-builder.en.cjs')
  assert.deepEqual(spanish.appx.languages, ['es-ES', 'en-US'])
  assert.deepEqual(english.appx.languages, ['en-US', 'es-ES'])
  assert.equal(english.appx.identityName, spanish.appx.identityName)
  assert.equal(english.publish[0].channel, 'en')
  const artifacts = releaseArtifacts(metadata.version)
  assert.equal(new Set(artifacts.map((item) => item.latestKey)).size, 4)
  assert.equal(artifacts[2].latestKey, 'forma-setup-en-latest.exe')
  console.log('Passed: concurrent image conversions, existing files, filesystem errors, live language switching, preference persistence/recovery, version sync, bilingual manifests and distinct release URLs.')
} finally {
  await fs.rm(directory, { recursive: true, force: true })
}
