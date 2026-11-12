// Run with Electron after build:app; the test window stays hidden and uses isolated data.
import { app, BrowserWindow, dialog, shell, ipcMain, Notification, Tray } from 'electron'
import fs from 'node:fs/promises'
import path from 'node:path'
import assert from 'node:assert/strict'
import sharp from 'sharp'

async function main() {
app.disableHardwareAcceleration()
const initialLanguage = process.argv[2] ?? 'es'
// Simulate the system language independently of the installer language.
app.getPreferredSystemLanguages = () => [initialLanguage === 'en' ? 'en-US' : 'es-UY']
const directory = process.env.FORMA_TEST_DIRECTORY
assert.ok(directory, 'Run through npm run test:desktop or test:desktop:en')
app.setPath('userData', path.join(directory, 'settings'))
await fs.mkdir(app.getPath('userData'), { recursive: true })
await fs.writeFile(path.join(app.getPath('userData'), 'preferences.json'), JSON.stringify({ conversion: { format: 'webp', quality: 87, outputDir: '' } }))
await fs.writeFile(path.join(app.getPath('userData'), 'release-notice.json'), JSON.stringify({ version: '1.3.0' }))
const releaseNotices = []
const originalMessageBox = dialog.showMessageBox
const originalNotificationShow = Notification.prototype.show
const notices = []
Notification.prototype.show = function () { notices.push({ title: this.title, body: this.body }) }
const originalTrayMenu = Tray.prototype.setContextMenu
let trayMenu
Tray.prototype.setContextMenu = function (menu) { trayMenu = menu; return originalTrayMenu.call(this, menu) }
let closeAnswer = { response: 0, checkboxChecked: false }
let closeQuestions = 0
// Capture the native notice without showing an interactive dialog in CI.
dialog.showMessageBox = async (_window, options) => {
  if (options.type === 'question') { closeQuestions++; return closeAnswer }
  releaseNotices.push(options); return { response: 0, checkboxChecked: false }
}
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
    window.webContents.setBackgroundThrottling(false)
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
  const migratedSettings = await evaluate('window.imageDesk.loadTools()')
  assert.equal(migratedSettings.preferences.quality, 87, 'Legacy conversion quality must migrate without loss')
  assert.equal(releaseNotices.length, 1, 'An upgrade must show exactly one native release notice')
  assert.ok(releaseNotices[0].message.includes(app.getVersion()))
  assert.ok(releaseNotices[0].detail.includes(initialLanguage === 'en' ? 'Resize by width' : 'Redimensiona por ancho'))
  assert.equal(JSON.parse(await fs.readFile(path.join(app.getPath('userData'), 'release-notice.json'), 'utf8')).version, app.getVersion())
  assert.equal(await evaluate('window.imageDesk.getLanguage()'), initialLanguage)
  await evaluate('document.querySelector(".language-trigger").dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, cancelable: true }))')
  assert.equal(await evaluate('document.querySelectorAll(".language-options .language-flag").length'), 2)
  assert.equal(await evaluate('document.activeElement.getAttribute("role")'), 'option')
  await evaluate('document.activeElement.dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true, cancelable: true }))')
  assert.equal(await evaluate('document.activeElement.dataset.language'), 'en')
  await evaluate('document.activeElement.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }))')
  assert.equal(await evaluate('document.querySelector(".language-options")'), null)
  assert.equal(await evaluate('document.activeElement.classList.contains("language-trigger")'), true)
  for (const language of ['en', 'es']) {
    stage = `switching to ${language}`
    await evaluate(`(async () => {
      const select = document.querySelector('.language-trigger');
      select.click();
      await new Promise(resolve => setTimeout(resolve, 0));
      if (document.querySelectorAll('.language-options [role=option] .language-flag').length !== 2) throw new Error('Both language options must show flags');
      document.querySelector('.language-options [data-language="' + ${JSON.stringify(language)} + '"]').click();
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
  stage = 'routing APPX update actions'
  ipcMain.removeHandler('updates:download')
  ipcMain.handle('updates:download', () => { throw new Error('APPX must never download a GitHub EXE') })
  ipcMain.removeHandler('updates:open-store')
  for (const status of ['available', 'error']) {
    const opened = new Promise((resolve) => ipcMain.handle('updates:open-store', () => resolve(true)))
    for (let attempt = 0; attempt < 100; attempt++) {
      testWindow.webContents.send('updates:state', { source: 'store', status, message: 'Hay actualizaciones en Microsoft Store.' })
      await evaluate(`new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))`)
      if (await evaluate("document.querySelector('.update-action span').textContent === 'Abrir Microsoft Store'")) break
    }
    assert.equal(await evaluate("document.querySelector('.update-action span').textContent"), 'Abrir Microsoft Store')
    await evaluate("document.querySelector('.update-action').click()")
    assert.equal(await opened, true, 'APPX action must open Store instead of the GitHub downloader')
    ipcMain.removeHandler('updates:open-store')
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

  stage = 'validating Forma 2.0 tools through IPC and UI'
  const toolData = await evaluate('window.imageDesk.loadTools()')
  const defaults = toolData.preferences
  const custom = { ...defaults, format: 'png', quality: 84, resize: { ...defaults.resize, mode: 'width', width: 2 }, preserveFolders: true, naming: { ...defaults.naming, enabled: true, numbered: true, keepOriginalName: false, prefix: 'v2-', start: 7 }, watermark: { ...defaults.watermark, mode: 'none' }, target: { ...defaults.target, enabled: false } }
  const presetData = await evaluate('window.imageDesk.savePreset(' + JSON.stringify({ name: 'Desktop V2', settings: custom }) + ')')
  assert.ok(presetData.presets.some(item => item.name === 'Desktop V2'))
  const preview = await evaluate('window.imageDesk.preview(' + JSON.stringify({ ...custom, files: [inputs[0]], outputDir }) + ')')
  assert.equal(preview.width, 2)
  assert.equal(preview.filename, 'v2-007.png')
  const toolRoot = path.dirname(inputs[0])
  const toolsOutput = path.join(directory, 'v2-tools')
  const toolsResult = await evaluate('window.imageDesk.convert(' + JSON.stringify({ ...custom, files: [inputs[0]], sourceRoots: { [inputs[0]]: toolRoot }, sequence: [4], outputDir: toolsOutput }) + ')')
  assert.equal(toolsResult.completed, 1)
  const named = path.join(toolsOutput, path.basename(toolRoot), 'v2-011.png')
  assert.equal((await sharp(named).metadata()).width, 2)
  await evaluate('document.querySelector(".tools-open").click()')
  await pollUi('document.querySelector(".tools-dialog")?.open === true')
  assert.ok((await evaluate('document.querySelector(".tools-dialog").textContent')).includes('Carpeta vigilada'))
  await evaluate('(() => { const input = document.querySelector(".tools-section input"); input.value = "UI preset"; input.dispatchEvent(new Event("input", { bubbles: true })); })()')
  await evaluate('document.querySelector(".tools-actions button").click()')
  await pollUi('Array.from(document.querySelectorAll(".tools-section select option")).some(option => option.textContent === "UI preset")')
  await evaluate('(() => { const select = document.querySelectorAll(".tools-section")[1].querySelector("select"); select.value = "width"; select.dispatchEvent(new Event("change", { bubbles: true })); })()')
  await pollUi('document.querySelectorAll(".tools-section")[1].querySelector("input[type=number]") !== null')
  await evaluate('(() => { const input = document.querySelectorAll(".tools-section")[1].querySelector("input[type=number]"); input.value = "2"; input.dispatchEvent(new Event("input", { bubbles: true })); })()')
  await evaluate('document.querySelector(".tools-preview > button").click()')
  await pollUi('document.querySelector(".tools-preview figcaption")?.textContent.includes("2 × 2")')
  await evaluate('(async () => { document.querySelector(".language-trigger").click(); await new Promise(resolve => setTimeout(resolve, 0)); document.querySelector("[data-language=en]").click(); })()')
  await pollUi('document.querySelector(".tools-heading h2")?.textContent === "Advanced tools"')
  assert.ok((await evaluate('document.querySelector(".tools-dialog").textContent')).includes('Watched folder'))
  await evaluate('(async () => { document.querySelector(".language-trigger").click(); await new Promise(resolve => setTimeout(resolve, 0)); document.querySelector("[data-language=es]").click(); })()')
  await pollUi('document.querySelector(".tools-heading h2")?.textContent === "Herramientas avanzadas"')

  await evaluate('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))')
  stage = 'validating expanded tools at minimum window size and keyboard navigation'
  await evaluate('(() => { const sections = document.querySelectorAll(".tools-section"); for (const index of [2, 3]) { const input = sections[index].querySelector("input[type=checkbox]"); input.checked = true; input.dispatchEvent(new Event("change", { bubbles: true })); } const select = sections[4].querySelector("select"); select.value = "text"; select.dispatchEvent(new Event("change", { bubbles: true })); })()')
  testWindow.setSize(760, 600)
  await evaluate('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))')
  assert.equal(await evaluate('(() => { const dialog = document.querySelector(".tools-dialog"); const rect = dialog.getBoundingClientRect(); return rect.left >= 0 && rect.right <= innerWidth + 1 && rect.top >= 0 && rect.bottom <= innerHeight + 1 && dialog.scrollWidth <= dialog.clientWidth + 1; })()'), true, 'Expanded tools must fit the minimum window without horizontal scrolling')
  if (process.env.FORMA_SCREENSHOT) await fs.writeFile(process.env.FORMA_SCREENSHOT.replace('.png', '-small-top.png'), (await testWindow.webContents.capturePage()).toPNG())
  await evaluate('document.querySelector(".tools-dialog").scrollTop = document.querySelector(".tools-dialog").scrollHeight')
  await evaluate('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))')
  if (process.env.FORMA_SCREENSHOT) await fs.writeFile(process.env.FORMA_SCREENSHOT.replace('.png', '-small-bottom.png'), (await testWindow.webContents.capturePage()).toPNG())
  testWindow.webContents.focus()
  await evaluate('document.querySelector(".tools-heading button").focus()')
  const focused = new Set()
  for (let index = 0; index < 40; index++) {
    testWindow.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'Tab' })
    testWindow.webContents.sendInputEvent({ type: 'keyUp', keyCode: 'Tab' })
    const focus = await evaluate('(() => { const dialog = document.querySelector(".tools-dialog"); return { inside: dialog.contains(document.activeElement), index: Array.from(dialog.querySelectorAll("input,select,button")).indexOf(document.activeElement) }; })()')
    assert.equal(focus.inside, true, 'Keyboard focus must stay inside the modal at step ' + index + ': ' + JSON.stringify(focus))
    focused.add(focus.index)
  }
  assert.ok(focused.size > 10, 'Tab must reach the advanced form controls')
  testWindow.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'Escape' })
  testWindow.webContents.sendInputEvent({ type: 'keyUp', keyCode: 'Escape' })
  await pollUi('!document.querySelector(".tools-dialog").open')
  testWindow.setSize(1100, 760)
  await evaluate('document.querySelector(".tools-open").click()')
  await pollUi('document.querySelector(".tools-dialog").open')
  // Restore a valid known preset after testing expanded controls.
  await evaluate('(() => { const select = document.querySelector(".tools-section select"); select.value = Array.from(select.options).find(option => option.textContent === "UI preset").value; select.dispatchEvent(new Event("change", { bubbles: true })); })()')
  await evaluate('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))')
  if (process.env.FORMA_SCREENSHOT) await fs.writeFile(process.env.FORMA_SCREENSHOT, (await testWindow.webContents.capturePage()).toPNG())
  await evaluate('document.querySelector(".tools-dialog").close()')
  const watchedSource = path.join(directory, 'watched-input')
  const watchedOutput = path.join(directory, 'watched-output')
  await fs.mkdir(watchedSource)
  await evaluate('window.imageDesk.startWatching(' + JSON.stringify({ source: watchedSource, outputDir: watchedOutput, settings: custom, includeExisting: false }) + ')')
  assert.equal((await evaluate('window.imageDesk.watchStatus()')).active, true)
  stage = 'hiding in system tray without stopping watching'
  assert.deepEqual(await evaluate('window.imageDesk.getBackgroundPreferences()'), { closeAction: 'ask', watchNotifications: true })
  closeAnswer = { response: 2, checkboxChecked: true }
  testWindow.close()
  await new Promise(resolve => setTimeout(resolve, 100))
  assert.equal(testWindow.isDestroyed(), false)
  assert.equal((await evaluate('window.imageDesk.getBackgroundPreferences()')).closeAction, 'ask', 'Cancel never remembers a choice')
  closeAnswer = { response: 1, checkboxChecked: true }
  testWindow.close()
  for (let attempt = 0; attempt < 100 && (await evaluate('window.imageDesk.getBackgroundPreferences()')).closeAction !== 'hide'; attempt++) await new Promise(resolve => setTimeout(resolve, 20))
  assert.equal((await evaluate('window.imageDesk.getBackgroundPreferences()')).closeAction, 'hide')
  assert.equal(testWindow.isDestroyed(), false)
  assert.equal((await evaluate('window.imageDesk.watchStatus()')).active, true, 'Hiding must keep watching active')
  assert.equal(JSON.parse(await fs.readFile(path.join(app.getPath('userData'), 'preferences.json'), 'utf8')).background.closeAction, 'hide')
  const questionCount = closeQuestions
  testWindow.close()
  await new Promise(resolve => setTimeout(resolve, 100))
  assert.equal(closeQuestions, questionCount, 'Remembered hiding must not ask again')
  assert.equal(trayMenu.items[0].label, 'Abrir Forma')
  assert.equal(trayMenu.items[1].enabled, true)
  trayMenu.items[0].click()
  await assert.rejects(evaluate('window.imageDesk.setBackgroundPreferences({ closeAction: "invalid", watchNotifications: true })'))
  await evaluate('window.imageDesk.setBackgroundPreferences({ closeAction: "quit", watchNotifications: true })')
  await assert.rejects(evaluate('window.imageDesk.convert(' + JSON.stringify({ files: [inputs[0]], outputDir, format: 'png', quality: 84 }) + ')'))
  await fs.copyFile(inputs[0], path.join(watchedSource, 'arrival.png'))
  await pollUi('document.querySelector(".tools-watch")?.textContent.includes("1 correctas")')
  await new Promise(resolve => setTimeout(resolve, 3200))
  assert.ok(notices.some(notice => notice.title === 'Convirtiendo imágenes de la carpeta vigilada'))
  assert.ok(notices.some(notice => notice.body === '1 imágenes convertidas; 0 errores.'))
  await evaluate('window.imageDesk.setBackgroundPreferences({ closeAction: "quit", watchNotifications: false })')
  const noticeCount = notices.length
  await fs.copyFile(inputs[0], path.join(watchedSource, 'silent-arrival.png'))
  await pollUi('document.querySelector(".tools-watch")?.textContent.includes("2 correctas")')
  await new Promise(resolve => setTimeout(resolve, 3200))
  assert.equal(notices.length, noticeCount, 'Disabling notifications suppresses both start and result notices')
  await evaluate('window.imageDesk.stopWatching()')
  const watchedNamed = path.join(watchedOutput, path.basename(watchedSource), 'v2-007.png')
  assert.equal((await sharp(watchedNamed).metadata()).width, 2)

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
  if (process.env.FORMA_TEST_CLOSE_WATCHER) {
    stage = 'closing during watched conversion'
    const closeSource = path.join(directory, 'close-watched-input')
    await fs.mkdir(closeSource)
    await sharp({ create: { width: 2400, height: 2400, channels: 3, background: '#4278b9' } }).png().toFile(path.join(closeSource, 'closing.png'))
    await evaluate('new Promise((resolve) => { const remove = window.imageDesk.onWatchState((event) => { if (event.processing) { remove(); resolve(true) } }); void window.imageDesk.startWatching(' + JSON.stringify({ source: closeSource, outputDir: closeDir, settings: { format: 'avif', quality: 84 }, includeExisting: true }) + ') })')
    assert.equal((await evaluate('window.imageDesk.watchStatus()')).active, true)
  } else {
    await evaluate('new Promise((resolve) => { const remove = window.imageDesk.onProgress((event) => { if (event.status === "converting") { remove(); resolve(true) } }); void window.imageDesk.convert(' + JSON.stringify({ ...cancelOptions, outputDir: closeDir }) + ') })')
  }
  const closed = new Promise((resolve) => testWindow.once('closed', resolve))
  testWindow.close()
  if (process.env.FORMA_TEST_CLOSE_WATCHER) assert.equal(testWindow.isDestroyed(), false, 'Closing must wait for the active watched encoder')
  await closed
  assert.ok((await fs.readdir(closeDir)).length > 0, 'Active encoders must finish before closing')
  for (const file of await fs.readdir(closeDir)) assert.equal((await sharp(path.join(closeDir, file)).metadata()).width, process.env.FORMA_TEST_CLOSE_WATCHER ? 2400 : 4)
  console.log('Desktop passed: preload/IPC, languages, preferences, all six formats, corrupt/missing inputs, invalid destinations, GIF animation, cancellation and safe close (' + (process.env.FORMA_TEST_CLOSE_WATCHER ? 'folder watcher' : 'manual conversion') + ').')
} catch (error) {
  console.error('Desktop stage:', stage, error)
  process.exitCode = 1
} finally {
  dialog.showMessageBox = originalMessageBox
  Notification.prototype.show = originalNotificationShow
  Tray.prototype.setContextMenu = originalTrayMenu
  clearTimeout(timer)
  if (testWindow && !testWindow.isDestroyed()) testWindow.destroy()
  app.exit(process.exitCode ?? 0)
}
}

// Electron emits ready after ESM entry evaluation: do not await app readiness at top level.
void main().catch((error) => { console.error(error); app.exit(1) })
