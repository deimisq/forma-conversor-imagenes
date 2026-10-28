// Run with Electron after build:app; the test window stays hidden and uses isolated data.
import { app, BrowserWindow } from 'electron'
import fs from 'node:fs/promises'
import path from 'node:path'
import assert from 'node:assert/strict'
import sharp from 'sharp'

async function main() {
app.disableHardwareAcceleration()
const initialLanguage = process.argv[2] ?? 'es'
const directory = process.env.FORMA_TEST_DIRECTORY
assert.ok(directory, 'Run through npm run test:desktop or test:desktop:en')
app.setPath('userData', path.join(directory, 'settings'))
// The app's window-all-closed hook must not exit before assertions/cleanup set the exit code.
app.on('before-quit', (event) => event.preventDefault())
BrowserWindow.prototype.show = function () {}
BrowserWindow.prototype.maximize = function () {}
let stage = 'loading main process'
const timer = setTimeout(() => { console.error(`Desktop test timed out: ${stage}`); app.exit(1) }, 60_000)
let testWindow
const loaded = new Promise((resolve, reject) => {
  app.once('browser-window-created', (_event, window) => {
    testWindow = window
    window.webContents.once('did-finish-load', resolve)
    window.webContents.once('did-fail-load', (_event, code, description) => reject(new Error(`${code}: ${description}`)))
    window.webContents.on('preload-error', (_event, preload, error) => console.error('Preload error:', preload, error))
  })
})

try {
  await import('../dist-electron/main.js')
  stage = 'loading renderer'
  await loaded
  stage = 'initializing desktop API'
  const evaluate = (code) => testWindow.webContents.executeJavaScript(code)
  assert.equal(await evaluate('typeof window.imageDesk'), 'object', 'Desktop preload must expose its API')
  // Wait for the asynchronous mounted hook to finish loading preferences.
  await evaluate(`new Promise((resolve, reject) => {
    const start = Date.now();
    const poll = () => document.querySelector('.version-label')?.textContent.includes('v' + ${JSON.stringify(app.getVersion())})
      ? resolve(true) : Date.now() - start > 5000 ? reject(new Error('App did not initialize')) : setTimeout(poll, 20);
    poll();
  })`)
  assert.equal(await evaluate('window.imageDesk.getLanguage()'), initialLanguage)
  for (const language of ['en', 'es']) {
    stage = `switching to ${language}`
    await evaluate(`(async () => {
      const select = document.querySelector('.language-select select');
      select.value = ${JSON.stringify(language)};
      select.dispatchEvent(new Event('change', { bubbles: true }));
      await Promise.resolve();
      await new Promise((resolve, reject) => {
        const start = Date.now();
        const poll = () => document.documentElement.lang === ${JSON.stringify(language)} && !select.disabled
          ? resolve(true) : Date.now() - start > 5000 ? reject(new Error('Language did not change')) : setTimeout(poll, 20);
        poll();
      });
    })()`)
    assert.equal(await evaluate('window.imageDesk.getLanguage()'), language)
    assert.equal(testWindow.getTitle(), language === 'en' ? 'Forma | Image Converter' : 'Forma | Conversor de Imágenes')
    assert.equal(JSON.parse(await fs.readFile(path.join(directory, 'settings', 'preferences.json'), 'utf8')).language, language)
    assert.equal(await evaluate("document.querySelector('.format-name small').textContent"), language === 'en' ? 'Lightweight and modern' : 'Ligero y moderno')
    stage = `restoring ${language} after reload`
    const reloaded = new Promise((resolve) => testWindow.webContents.once('did-finish-load', resolve))
    testWindow.webContents.reload()
    await reloaded
    await evaluate(`new Promise((resolve, reject) => {
      const start = Date.now();
      const poll = () => document.documentElement.lang === ${JSON.stringify(language)}
        ? resolve(true) : Date.now() - start > 5000 ? reject(new Error('Language was not restored')) : setTimeout(poll, 20);
      poll();
    })`)
  }
  const inputs = []
  stage = 'converting images through IPC'
  for (const folder of ['a', 'b']) {
    const parent = path.join(directory, folder)
    await fs.mkdir(parent)
    const input = path.join(parent, 'photo.png')
    await sharp({ create: { width: 4, height: 4, channels: 4, background: '#ff000080' } }).png().toFile(input)
    inputs.push(input)
  }
  const outputDir = path.join(directory, 'results')
  const result = await evaluate(`window.imageDesk.convert(${JSON.stringify({ files: inputs, outputDir, format: 'webp', quality: 84 })})`)
  assert.equal(result.completed, 2)
  assert.equal(result.failed, 0)
  assert.equal((await fs.readdir(outputDir)).length, 2)
  console.log('Desktop passed: real preload and IPC, live ES/EN switching, native title, persisted/reloaded preferences, concurrent real conversions.')
} catch (error) {
  console.error(error)
  process.exitCode = 1
} finally {
  clearTimeout(timer)
  testWindow?.destroy()
  app.exit(process.exitCode ?? 0)
}
}

// Electron emits ready after ESM entry evaluation: do not await app readiness at top level.
void main().catch((error) => { console.error(error); app.exit(1) })
