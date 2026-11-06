// Run with Electron after build:app; the test window stays hidden and uses isolated data.
import { app, BrowserWindow, dialog, shell } from 'electron'
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
await fs.mkdir(app.getPath('userData'), { recursive: true })
await fs.writeFile(path.join(app.getPath('userData'), 'release-notice.json'), JSON.stringify({ version: '1.2.0' }))
const releaseNotices = []
const originalMessageBox = dialog.showMessageBox
// Capture the native notice without showing an interactive dialog in CI.
dialog.showMessageBox = async (_window, options) => { releaseNotices.push(options); return { response: 0, checkboxChecked: false } }
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
  await evaluate('new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))')
  assert.equal(releaseNotices.length, 1, 'An upgrade must show exactly one native release notice')
  assert.ok(releaseNotices[0].message.includes(app.getVersion()))
  assert.ok(releaseNotices[0].detail.includes(initialLanguage === 'en' ? 'Retry only failed files' : 'Reintenta únicamente'))
  assert.equal(JSON.parse(await fs.readFile(path.join(app.getPath('userData'), 'release-notice.json'), 'utf8')).version, app.getVersion())
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
  assert.equal(releaseNotices.length, 1, 'Language changes and reloads must not repeat release notes')
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

  stage = 'validating formats and errors'
  for (const format of ['jpeg', 'png', 'webp', 'avif', 'tiff', 'gif']) {
    const destination = path.join(directory, format)
    const converted = await evaluate('window.imageDesk.convert(' + JSON.stringify({ files: [inputs[0]], outputDir: destination, format, quality: 84 }) + ')')
    assert.equal(converted.completed, 1, format)
    assert.equal(converted.failed, 0, format)
    const output = path.join(destination, (await fs.readdir(destination))[0])
    const metadata = await sharp(output).metadata()
    assert.equal(metadata.width, 4)
    assert.equal(metadata.format, format === 'avif' ? 'heif' : format)
    if (format === 'avif') assert.equal(metadata.compression, 'av1')
    assert.ok(converted.outputBytes > 0)
    assert.equal(converted.outputDir, destination)
  }
  const corrupt = path.join(directory, 'corrupt.png')
  await fs.writeFile(corrupt, 'not an image')
  const failedDir = path.join(directory, 'failed')
  const failed = await evaluate('window.imageDesk.convert(' + JSON.stringify({ files: [corrupt, path.join(directory, 'missing.png')], outputDir: failedDir, format: 'webp', quality: 84 }) + ')')
  assert.equal(failed.failed, 2)
  assert.deepEqual(await fs.readdir(failedDir), [])
  await assert.rejects(evaluate('window.imageDesk.convert(' + JSON.stringify({ files: inputs, outputDir: corrupt, format: 'webp', quality: 84 }) + ')'))
  await assert.rejects(evaluate('window.imageDesk.inspectFiles([123])'))
  await assert.rejects(evaluate('window.imageDesk.openFolder("relative")'))
  const inspected = await evaluate('window.imageDesk.inspectFiles(' + JSON.stringify([inputs[0], path.join(directory, 'absent')]) + ')')
  assert.equal(inspected.files.length, 1)
  assert.equal(inspected.errors.length, 1)
  await evaluate('window.imageDesk.setPreferences(' + JSON.stringify({ format: 'png', quality: 92, outputDir }) + ')')
  await evaluate('window.imageDesk.setLanguage("en")')
  assert.deepEqual(await evaluate('window.imageDesk.getPreferences()'), { format: 'png', quality: 92, outputDir })
  await assert.rejects(evaluate('window.imageDesk.setPreferences({format:"bad",quality:0,outputDir:""})'))

  stage = 'preserving GIF animation'
  const animation = path.join(directory, 'animated.gif')
  const pixels = Buffer.alloc(2 * 4 * 4)
  for (let i = 0; i < pixels.length; i += 4) { pixels[i] = i < 16 ? 255 : 0; pixels[i + 1] = i < 16 ? 0 : 255; pixels[i + 3] = 255 }
  await sharp(pixels, { raw: { width: 2, height: 4, channels: 4, pageHeight: 2 } }).gif({ delay: [100, 200], loop: 0 }).toFile(animation)
  assert.equal((await sharp(animation, { animated: true }).metadata()).pages, 2)
  const animatedDir = path.join(directory, 'animated-results')
  const animatedResult = await evaluate('window.imageDesk.convert(' + JSON.stringify({ files: [animation], outputDir: animatedDir, format: 'gif', quality: 84 }) + ')')
  assert.equal(animatedResult.completed, 1)
  assert.equal((await sharp(path.join(animatedDir, (await fs.readdir(animatedDir))[0]), { animated: true }).metadata()).pages, 2)

  stage = 'testing UI import, retry and destination'
  const pollUi = (condition) => evaluate('new Promise((resolve, reject) => { const start = Date.now(); const poll = () => (' + condition + ') ? resolve(true) : Date.now() - start > 5000 ? reject(new Error("UI condition timed out")) : setTimeout(poll, 20); poll() })')
  const originalDialog = dialog.showOpenDialog
  const originalOpenPath = shell.openPath
  let selectedPaths = [inputs[0], corrupt]
  let resolveOpened
  const folderOpened = new Promise((resolve) => { resolveOpened = resolve })
  let openedFolder
  dialog.showOpenDialog = async () => ({ canceled: false, filePaths: selectedPaths })
  shell.openPath = async (folder) => { openedFolder = folder; resolveOpened(); return '' }
  try {
    await evaluate('document.querySelector(".secondary-button").click()')
    await pollUi('document.querySelector(".count-badge")?.textContent === "2" && !document.querySelector(".convert-button").disabled')
    const uiOutput = path.join(directory, 'ui-output')
    selectedPaths = [uiOutput]
    await evaluate('document.querySelector(".output-select").click()')
    await pollUi('document.querySelector(".output-select span")?.title === ' + JSON.stringify(uiOutput))
    await evaluate('document.querySelector(".format-select").dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }))')
    await pollUi('document.activeElement?.classList.contains("format-option")')
    await evaluate('document.activeElement.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }))')
    assert.equal(await evaluate('document.activeElement.classList.contains("format-select")'), true)
    await evaluate('document.querySelector(".convert-button").click()')
    await pollUi('document.querySelectorAll(".open-folder-button").length === 2')
    assert.equal((await fs.readdir(uiOutput)).length, 1)
    await fs.copyFile(inputs[0], corrupt)
    await evaluate('document.querySelector(".open-folder-button").click()')
    await pollUi('document.querySelectorAll(".open-folder-button").length === 1 && document.querySelector(".list-footer span")?.textContent.startsWith("2 ")')
    assert.equal((await fs.readdir(uiOutput)).length, 2, 'Retry must not repeat successful inputs')
    const differentOutput = path.join(directory, 'different-output')
    selectedPaths = [differentOutput]
    await evaluate('document.querySelector(".output-select").click()')
    await pollUi('document.querySelector(".output-select span")?.title === ' + JSON.stringify(differentOutput))
    await evaluate('document.querySelector(".open-folder-button").click()')
    await folderOpened
    assert.equal(openedFolder, uiOutput, 'Open output must use the completed batch destination')
  } finally {
    dialog.showOpenDialog = originalDialog
    shell.openPath = originalOpenPath
  }

  stage = 'cancelling queued conversions'
  const manyInputs = []
  for (let i = 0; i < 30; i++) {
    const file = path.join(directory, 'batch-' + i + '.png')
    await fs.copyFile(inputs[0], file)
    manyInputs.push(file)
  }
  const cancelledInspection = await evaluate('(async () => { const pending = window.imageDesk.inspectFiles(' + JSON.stringify(manyInputs) + '); await window.imageDesk.cancelInspection(); return pending })()')
  assert.equal(cancelledInspection.cancelled, true)
  const cancelDir = path.join(directory, 'cancelled')
  const cancelOptions = { files: manyInputs, outputDir: cancelDir, format: 'webp', quality: 84 }
  const cancelled = await evaluate('(async () => { let remove = window.imageDesk.onProgress((event) => { if (event.status === "converting") { remove(); void window.imageDesk.cancel() } }); return window.imageDesk.convert(' + JSON.stringify(cancelOptions) + ') })()')
  assert.equal(cancelled.cancelled, true)
  assert.ok(cancelled.completed < manyInputs.length)
  for (const file of await fs.readdir(cancelDir)) assert.equal((await sharp(path.join(cancelDir, file)).metadata()).width, 4)

  stage = 'closing during conversion'
  const closeDir = path.join(directory, 'close-results')
  await evaluate('new Promise((resolve) => { const remove = window.imageDesk.onProgress((event) => { if (event.status === "converting") { remove(); resolve(true) } }); void window.imageDesk.convert(' + JSON.stringify({ ...cancelOptions, outputDir: closeDir }) + ') })')
  const closed = new Promise((resolve) => testWindow.once('closed', resolve))
  testWindow.close()
  await closed
  assert.ok((await fs.readdir(closeDir)).length > 0, 'Active encoders must finish before closing')
  for (const file of await fs.readdir(closeDir)) assert.equal((await sharp(path.join(closeDir, file)).metadata()).width, 4)
  console.log('Desktop passed: preload/IPC, languages, preferences, all six formats, corrupt/missing inputs, invalid destinations, GIF animation, cancellation and safe close.')
} catch (error) {
  console.error(error)
  process.exitCode = 1
} finally {
  dialog.showMessageBox = originalMessageBox
  clearTimeout(timer)
  if (testWindow && !testWindow.isDestroyed()) testWindow.destroy()
  app.exit(process.exitCode ?? 0)
}
}

// Electron emits ready after ESM entry evaluation: do not await app readiness at top level.
void main().catch((error) => { console.error(error); app.exit(1) })
