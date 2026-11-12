<script setup lang="ts">
import { t as translate, systemLanguage, isLanguage, type Language } from '../shared/locale'
import LanguageSelector from './components/LanguageSelector.vue'
import AdvancedTools from './components/AdvancedTools.vue'
import { defaultSettings, type ConversionSettings } from '../shared/advanced-settings.ts'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import formaLogo from './assets/forma-logo.svg'
import { ArrowDownToLine, ArrowRight, Check, ChevronDown, CircleAlert, Download, FileImage, FolderOpen, Heart, LoaderCircle, Plus, RefreshCw, RotateCw, Settings2, ShieldCheck, X } from '@lucide/vue'

type ImageFile = { sourceRoot?: string; path: string; name: string; size: number; status: 'queued' | 'converting' | 'done' | 'error' | 'cancelled'; output?: string; message?: string }
type OutputFormat = 'jpeg' | 'png' | 'webp' | 'avif' | 'tiff' | 'gif'
type UpdateState = { status: 'idle' | 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error'; source?: 'store'; version?: string; percent?: number; message?: string }

const files = ref<ImageFile[]>([])
const desktopApiAvailable = typeof window.imageDesk !== 'undefined'
const selectedLanguage = ref<Language>(systemLanguage(navigator.languages))
const savingLanguage = ref(false)
function t(text: string) { return translate(text, selectedLanguage.value) }
watch(selectedLanguage, (value) => {
  document.documentElement.lang = value
  document.title = t('Forma | Conversor de Imágenes')
}, { immediate: true })

async function changeLanguage(value: Language) {
  if (!isLanguage(value) || savingLanguage.value) return
  savingLanguage.value = true
  try {
    if (desktopApiAvailable) selectedLanguage.value = await window.imageDesk.setLanguage(value)
    else {
      localStorage.setItem('forma.language', value)
      selectedLanguage.value = value
    }
  } catch {
    runtimeWarning.value = 'No se pudo guardar el idioma.'
  } finally {
    savingLanguage.value = false
  }
}
const runtimeWarning = ref('')
async function openSponsors() {
  try { if (desktopApiAvailable) await window.imageDesk.openSponsors(); else window.open('https://github.com/sponsors/deimisq', '_blank', 'noopener,noreferrer') }
  catch { runtimeWarning.value = selectedLanguage.value === 'en' ? 'Could not open GitHub Sponsors.' : 'No se pudo abrir GitHub Sponsors.' }
}
const appVersion = ref('')
const updateState = ref<UpdateState>({ status: 'idle' })
const format = ref<OutputFormat>('webp')
const quality = ref(84)
const tools = ref(defaultSettings())
function applyTools(value: ConversionSettings) { tools.value = value; format.value = value.format; quality.value = value.quality }
const outputDirectory = ref('')
const busy = ref(false)
const watching = ref(false)
const finished = ref(false)
const dragActive = ref(false)
const progressCount = ref(0)
const failureCount = ref(0)
const cancelRequested = ref(false)
const batchError = ref('')
const formatMenuOpen = ref(false)
const loadingFiles = ref(false)
const inspectionErrors = ref<{ path: string; message: string }[]>([])
const lastOutputDirectory = ref('')
const batchTotal = ref(0)
const summary = ref<{ inputBytes: number; outputBytes: number } | null>(null)
const fileIndex = computed(() => new Map(files.value.map((file) => [file.path, file])))
const failedPaths = ref(new Set<string>())
const failedFiles = computed(() => [...failedPaths.value].map((path) => fileIndex.value.get(path)).filter((file): file is ImageFile => Boolean(file)))
const preferencesReady = ref(false)
watch([format, quality, outputDirectory], async () => {
  if (!desktopApiAvailable || !preferencesReady.value) return
  try { await window.imageDesk.setPreferences({ format: format.value, quality: quality.value, outputDir: outputDirectory.value }) }
  catch { runtimeWarning.value = 'No se pudo guardar la configuración.' }
})
function showError(error: unknown) {
  runtimeWarning.value = error instanceof Error ? error.message : t('No se pudo completar la operación.')
}
async function cancelInspection() {
  try { await window.imageDesk.cancelInspection() } catch (error) { showError(error) }
}
async function formatKeydown(event: KeyboardEvent) {
  const keys = ['ArrowDown', 'ArrowUp', 'Home', 'End', 'Escape']
  if (!keys.includes(event.key)) return
  event.preventDefault()
  const wrap = (event.currentTarget as HTMLElement)
  if (event.key === 'Escape') {
    formatMenuOpen.value = false
    wrap.querySelector<HTMLButtonElement>('.format-select')?.focus()
    return
  }
  formatMenuOpen.value = true
  await nextTick()
  const options = Array.from(wrap.querySelectorAll<HTMLButtonElement>('.format-option'))
  const current = options.indexOf(document.activeElement as HTMLButtonElement)
  const index = event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1 : current < 0 ? formats.value.findIndex((item) => item.value === format.value) : (current + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length
  options[index]?.focus()
}
function selectFormat(value: OutputFormat, event: MouseEvent) {
  format.value = value
  const wrap = (event.currentTarget as HTMLElement).closest('.format-select-wrap')
  formatMenuOpen.value = false
  wrap?.querySelector<HTMLButtonElement>('.format-select')?.focus()
}
const fileList = ref<HTMLDivElement | null>(null)
const listHeight = ref(350)
const listObserver = new ResizeObserver(([entry]) => { listHeight.value = entry.contentRect.height })
watch(fileList, (element, previous) => {
  if (previous) listObserver.unobserve(previous)
  if (element) listObserver.observe(element)
})
const listScrollTop = ref(0)
const rowHeight = 59
const formats = computed<{ value: OutputFormat; label: string; detail: string }[]>(() => [
  { value: 'webp', label: 'WebP', detail: t('Ligero y moderno') },
  { value: 'jpeg', label: 'JPEG', detail: t('Ideal para fotografía') },
  { value: 'png', label: 'PNG', detail: t('Con transparencia') },
  { value: 'avif', label: 'AVIF', detail: t('Máxima compresión') },
  { value: 'tiff', label: 'TIFF', detail: t('Alta calidad') },
  { value: 'gif', label: 'GIF', detail: t('Animaciones compatibles') },
])

const totalBytes = computed(() => files.value.reduce((total, file) => total + file.size, 0))
const completedCount = ref(0)
const progressPercent = computed(() => files.value.length ? Math.round((progressCount.value / (batchTotal.value || 1)) * 100) : 0)
const canConvert = computed(() => !watching.value && desktopApiAvailable && preferencesReady.value && files.value.length > 0 && !busy.value && !loadingFiles.value)
const currentFormat = computed(() => formats.value.find((item) => item.value === format.value) ?? formats.value[0])
const firstVisibleIndex = computed(() => Math.min(Math.max(0, files.value.length - 1), Math.max(0, Math.floor(listScrollTop.value / rowHeight) - 4)))
const visibleFiles = computed(() => files.value.slice(firstVisibleIndex.value, firstVisibleIndex.value + Math.ceil(listHeight.value / rowHeight) + 8))
const updateActionLabel = computed(() => {
  if (updateState.value.status === 'checking') return t('Buscando actualizaciones')
  if (updateState.value.source === 'store' && ['available', 'error'].includes(updateState.value.status)) return t('Abrir Microsoft Store')
  if (updateState.value.status === 'available') return `${t('Descargar')} v${updateState.value.version}`
  if (updateState.value.status === 'downloading') return `${t('Descargando')} ${updateState.value.percent ?? 0}%`
  if (updateState.value.status === 'downloaded') return t('Instalar y reiniciar')
  return t('Buscar actualizaciones')
})

function formatSize(bytes: number) {
  if (!bytes) return '—'
  const units = ['B', 'KB', 'MB', 'GB']
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  return `${(bytes / 1024 ** index).toFixed(index ? 1 : 0)} ${units[index]}`
}

function shortPath(value: string) {
  const parts = value.split(/[\\/]/)
  return parts.length > 2 ? `${parts[parts.length - 2]} / ${parts[parts.length - 1]}` : value
}

async function addPaths(paths: string[]) {
  if (!desktopApiAvailable || busy.value || loadingFiles.value || !paths.length) return
  runtimeWarning.value = ''
  loadingFiles.value = true
  inspectionErrors.value = []
  try {
    const result = await window.imageDesk.inspectFiles(paths)
    inspectionErrors.value = result.errors
    const current = new Set(files.value.map((file) => file.path.toLowerCase()))
    for (let offset = 0; offset < result.files.length; offset += 500) {
      for (const file of result.files.slice(offset, offset + 500)) {
        const key = file.path.toLowerCase()
        if (!current.has(key)) {
          current.add(key)
          files.value.push({ ...file, status: 'queued' })
        }
      }
      await new Promise((resolve) => setTimeout(resolve, 0))
    }
    if (result.cancelled) runtimeWarning.value = 'Búsqueda detenida.'
    finished.value = false
  } catch (error) { showError(error) }
  finally { loadingFiles.value = false }
}

async function chooseFiles() {
  if (!desktopApiAvailable || busy.value || loadingFiles.value) return
  try { await addPaths(await window.imageDesk.selectFiles()) } catch (error) { showError(error) }
}
async function chooseFolder() {
  if (!desktopApiAvailable || busy.value || loadingFiles.value) return
  try { await addPaths(await window.imageDesk.selectFolder()) } catch (error) { showError(error) }
}
async function chooseOutput() {
  if (!desktopApiAvailable || busy.value) return
  try {
    const selected = await window.imageDesk.selectOutput()
    if (selected && !busy.value) outputDirectory.value = selected
  } catch (error) { showError(error) }
}

function removeFile(filePath: string) {
  if (busy.value || loadingFiles.value) return
  failedPaths.value.delete(filePath)
  if (fileIndex.value.get(filePath)?.status === 'done') completedCount.value--
  files.value = files.value.filter((file) => file.path !== filePath)
}

function clearFiles() {
  if (busy.value || loadingFiles.value) return
  files.value = []
  completedCount.value = 0
  failedPaths.value.clear()
  finished.value = false
  progressCount.value = 0
  failureCount.value = 0
  listScrollTop.value = 0
}

function updateListWindow(event: Event) {
  listScrollTop.value = (event.currentTarget as HTMLDivElement).scrollTop
}

async function startConversion(onlyFailed = false) {
  if (!canConvert.value) return
  const selected = onlyFailed ? failedFiles.value : files.value
  if (!selected.length) return
  const queuePositions = new Map(files.value.map((file, index) => [file.path, index]))
  const selectedPaths = new Set(selected.map((file) => file.path))
  batchTotal.value = selected.length
  summary.value = null
  lastOutputDirectory.value = outputDirectory.value
  busy.value = true
  finished.value = false
  cancelRequested.value = false
  formatMenuOpen.value = false
  batchError.value = ''
  progressCount.value = 0
  failureCount.value = 0
  for (const path of selectedPaths) failedPaths.value.delete(path)
  completedCount.value -= selected.filter((file) => file.status === 'done').length
  files.value = files.value.map((file) => selectedPaths.has(file.path) ? { ...file, status: 'queued', output: undefined, message: undefined } : file)
  try {
    const result = await window.imageDesk.convert({
      ...JSON.parse(JSON.stringify(tools.value)),
      sequence: selected.map(file => queuePositions.get(file.path)!),
      sourceRoots: Object.fromEntries(selected.filter(file => file.sourceRoot).map(file => [file.path, file.sourceRoot!])),
      files: selected.map((file) => file.path),
      outputDir: outputDirectory.value,
      format: format.value,
      quality: quality.value,
    })
    lastOutputDirectory.value = result.outputDir
    summary.value = { inputBytes: result.inputBytes, outputBytes: result.outputBytes }
    cancelRequested.value = result.cancelled
    progressCount.value = result.completed + result.failed
    failureCount.value = result.failed
    if (result.cancelled) files.value = files.value.map((file) => selectedPaths.has(file.path) && file.status === 'queued' ? { ...file, status: 'cancelled' } : file)
  } catch (error) {
    batchError.value = error instanceof Error ? error.message : t('No se pudo iniciar la conversión.')
    failureCount.value = 1
  } finally {
    busy.value = false
    finished.value = true
  }
}

async function cancelConversion() {
  cancelRequested.value = true
  try { await window.imageDesk.cancel() }
  catch (error) { cancelRequested.value = false; showError(error) }
}

async function openOutputFolder() {
  try { await window.imageDesk.openFolder(lastOutputDirectory.value) } catch (error) { showError(error) }
}

async function runUpdateAction() {
  if (!desktopApiAvailable) return
  try {
    if (updateState.value.source === 'store' && ['available', 'error'].includes(updateState.value.status)) await window.imageDesk.openStoreUpdates()
    else if (updateState.value.status === 'available') await window.imageDesk.downloadUpdate()
    else if (updateState.value.status === 'downloaded') await window.imageDesk.installUpdate()
    else await window.imageDesk.checkForUpdates()
  } catch (error) {
    updateState.value = { status: 'error', source: updateState.value.source, message: error instanceof Error ? error.message : t('No se pudo completar la operación.') }
  }
}

function handleUpdateState(state: Parameters<Parameters<typeof window.imageDesk.onUpdateState>[0]>[0]) {
  updateState.value = { ...updateState.value, ...state }
}

function handleProgress(event: Parameters<Parameters<typeof window.imageDesk.onProgress>[0]>[0]) {
  if (event.type === 'file' && event.input) {
    const file = fileIndex.value.get(event.input)
    if (file && event.status) {
      if (event.status === 'error') failedPaths.value.add(file.path)
      if (event.status === 'done' && file.status !== 'done') completedCount.value++
      file.status = event.status as ImageFile['status']
      file.output = event.output
      file.message = event.message
    }
    if (event.status === 'done' || event.status === 'error') {
      progressCount.value++
      if (event.status === 'error') failureCount.value++
    }
  }
}

let removeProgressListener = () => {}
let removeDropListener = () => {}
let removeUpdateListener = () => {}
onMounted(async () => {
  if (!desktopApiAvailable) {
    try {
      const saved = localStorage.getItem('forma.language')
      if (isLanguage(saved)) selectedLanguage.value = saved
    } catch { /* Preview also works when browser storage is unavailable. */ }
    runtimeWarning.value = 'Abre Forma en Windows para acceder a tus archivos.'
    return
  }
  try {
    selectedLanguage.value = await window.imageDesk.getLanguage()
    appVersion.value = await window.imageDesk.getVersion()
    outputDirectory.value = await window.imageDesk.defaultOutput()
    const saved = await window.imageDesk.getPreferences()
    if (saved) {
      format.value = saved.format
      quality.value = saved.quality
      if (saved.outputDir) outputDirectory.value = saved.outputDir
    }
    await nextTick()
    preferencesReady.value = true
    removeProgressListener = window.imageDesk.onProgress(handleProgress)
    removeDropListener = window.imageDesk.onDroppedFiles((paths) => void addPaths(paths))
    removeUpdateListener = window.imageDesk.onUpdateState(handleUpdateState)
    void window.imageDesk.checkForUpdates().catch(showError)
  } catch (error) {
    runtimeWarning.value = error instanceof Error ? error.message : 'No se pudo conectar con la aplicación de escritorio.'
  }
})
onBeforeUnmount(() => {
  listObserver.disconnect()
  removeProgressListener()
  removeDropListener()
  removeUpdateListener()
})
</script>

<template>
  <main class="app-shell" @dragenter.prevent="dragActive = true" @dragover.prevent="dragActive = true" @dragleave.self="dragActive = false" @drop.prevent="dragActive = false">
    <header class="topbar">
      <div class="brand"><img :src="formaLogo" class="brand-mark" alt="" /><span>FORMA<span class="brand-dot">.</span></span></div>
      <div class="topbar-right">
        <button class="sponsor-button" :title="selectedLanguage === 'en' ? 'Support Forma on GitHub Sponsors (opens browser)' : 'Apoyar Forma en GitHub Sponsors (abre el navegador)'" :aria-label="selectedLanguage === 'en' ? 'Support Forma on GitHub Sponsors' : 'Apoyar Forma en GitHub Sponsors'" @click="openSponsors"><Heart :size="15" aria-hidden="true" /><span>{{ selectedLanguage === 'en' ? 'Support Forma' : 'Apoyar Forma' }}</span></button>
        <LanguageSelector :value="selectedLanguage" :disabled="savingLanguage" :label="t('Idioma')" @change="changeLanguage" />
        <span class="local-badge"><ShieldCheck :size="14" /> {{ t('Procesamiento local') }}</span>
        <button class="update-action" :class="`update-${updateState.status}`" :disabled="!desktopApiAvailable || updateState.status === 'checking' || updateState.status === 'downloading' || (busy && updateState.status === 'downloaded')" :aria-label="updateActionLabel" :title="updateState.message ? t(updateState.message) : updateActionLabel" @click="runUpdateAction">
          <LoaderCircle v-if="updateState.status === 'checking' || updateState.status === 'downloading'" :size="15" class="spin" />
          <Download v-else-if="updateState.status === 'available'" :size="15" />
          <RotateCw v-else-if="updateState.status === 'downloaded'" :size="15" />
          <RefreshCw v-else :size="15" />
          <span>{{ updateActionLabel }}</span>
        </button>
        <span class="version-label">WINDOWS · v{{ appVersion }}</span>
      </div>
    </header>
    <div v-if="runtimeWarning" class="runtime-warning" role="status"><CircleAlert :size="16" /> {{ t(runtimeWarning) }}</div>
    <div v-if="updateState.source === 'store' && updateState.message && updateState.status !== 'checking'" class="runtime-warning" role="status">{{ t(updateState.message) }}</div>

    <section class="workspace">
      <div class="intro-row">
        <div>
          <p class="eyebrow">{{ t('CONVERSIÓN POR LOTES') }}</p>
          <h1>{{ t('Tus imágenes,') }}<br /><span>{{ t('en otro formato.') }}</span></h1>
        </div>
        <p class="intro-note">{{ t('Convierte cientos de archivos') }}<br />{{ t('sin subirlos a ningún servidor.') }}</p>
      </div>

      <div class="work-grid">
        <section class="files-panel" :aria-label="t('Archivos para convertir')">
          <div class="panel-heading">
            <div class="heading-title"><h2>{{ t('Archivos') }}</h2><span class="count-badge">{{ files.length }}</span></div>
            <button v-if="files.length && !busy && !loadingFiles" class="text-button" @click="clearFiles">{{ t('Vaciar lista') }}</button>
            <span v-else-if="busy" class="running-label"><LoaderCircle :size="14" class="spin" /> {{ t('Procesando') }}</span>
            <span v-else class="supported-label">{{ formatSize(totalBytes) }}</span>
          </div>

          <div v-if="loadingFiles" class="runtime-warning" role="status"><LoaderCircle :size="16" class="spin" />{{ t('Buscando imágenes…') }}<button class="text-button" @click="cancelInspection">{{ t('Cancelar') }}</button></div>
          <details v-if="inspectionErrors.length" class="inspection-errors"><summary>{{ t('Rutas omitidas') }}: {{ inspectionErrors.length }}</summary><p v-for="error in inspectionErrors" :key="error.path">{{ error.path }}: {{ error.message }}</p></details>
          <div v-if="!files.length" class="drop-zone" :class="{ 'is-dragging': dragActive }" @click="chooseFiles">
            <span class="drop-icon"><ArrowDownToLine :size="21" /></span>
            <strong>{{ t('Suelta tus imágenes aquí') }}</strong>
            <span>{{ t('o haz clic para explorar tus archivos') }}</span>
            <div class="drop-actions">
              <button class="secondary-button" :disabled="!desktopApiAvailable" @click.stop="chooseFiles"><Plus :size="15" /> {{ t('Elegir archivos') }}</button>
              <button class="quiet-button" :disabled="!desktopApiAvailable" @click.stop="chooseFolder"><FolderOpen :size="15" /> {{ t('Añadir carpeta') }}</button>
            </div>
            <small>JPG · PNG · WEBP · AVIF · GIF · TIFF · BMP · SVG · HEIC</small>
          </div>

          <div v-else ref="fileList" class="file-list" @scroll="updateListWindow">
            <div class="virtual-spacer" :style="{ height: `${firstVisibleIndex * rowHeight}px` }"></div>
            <div v-for="(file, index) in visibleFiles" :key="file.path" class="file-row" :style="{ '--row-index': firstVisibleIndex + index }">
              <span class="file-icon" :class="`file-${file.status}`"><Check v-if="file.status === 'done'" :size="16" /><CircleAlert v-else-if="file.status === 'error'" :size="16" /><LoaderCircle v-else-if="file.status === 'converting'" :size="16" class="spin" /><FileImage v-else :size="17" /></span>
              <span class="file-info"><strong :title="file.name">{{ file.name }}</strong><small :title="file.message || file.path">{{ file.message || shortPath(file.path) }}</small></span>
              <span class="file-size">{{ formatSize(file.size) }}</span>
              <button v-if="!busy" class="remove-button" :aria-label="`${t('Quitar')} ${file.name}`" @click="removeFile(file.path)"><X :size="15" /></button>
              <span v-else class="status-text" :class="`status-${file.status}`">{{ file.status === 'converting' ? t('Convirtiendo') : file.status === 'done' ? t('Listo') : file.status === 'error' ? t('Error') : file.status === 'cancelled' ? t('Cancelada') : t('En cola') }}</span>
            </div>
            <div class="virtual-spacer" :style="{ height: `${Math.max(0, files.length - firstVisibleIndex - visibleFiles.length) * rowHeight}px` }"></div>
            <button v-if="!busy" class="add-more" :disabled="!desktopApiAvailable" @click="chooseFiles"><Plus :size="15" /> {{ t('Añadir más imágenes') }}</button>
          </div>

          <div v-if="files.length" class="list-footer"><span>{{ completedCount }} {{ t('de') }} {{ files.length }} {{ t('convertidas') }}</span><span>{{ formatSize(totalBytes) }} {{ t('en total') }}</span></div>
        </section>

        <aside class="settings-panel" :aria-label="t('Opciones de conversión')">
          <div class="settings-heading"><span class="settings-icon"><Settings2 :size="17" /></span><h2>{{ t('Configuración') }}</h2></div>
          <div class="setting-block">
            <label class="setting-label">{{ t('Formato de salida') }}</label>
            <div class="format-select-wrap" @keydown="formatKeydown" @focusout="(event) => { if (!(event.currentTarget as HTMLElement).contains(event.relatedTarget as Node)) formatMenuOpen = false }">
              <button class="format-select" :disabled="busy || watching" :aria-expanded="formatMenuOpen" aria-haspopup="menu" aria-controls="format-menu" @click="formatMenuOpen = !formatMenuOpen">
                <span class="format-symbol">{{ currentFormat.value === 'jpeg' ? 'JPG' : currentFormat.value.toUpperCase() }}</span>
                <span class="format-name"><strong>{{ currentFormat.label }}</strong><small>{{ currentFormat.detail }}</small></span>
                <ChevronDown :size="17" class="chevron" />
              </button>
              <div v-if="formatMenuOpen" id="format-menu" class="format-menu" role="menu" :aria-label="t('Formato de salida')">
                <button v-for="item in formats" :key="item.value" class="format-option" role="menuitemradio" :aria-checked="format === item.value" :class="{ selected: format === item.value }" @click="selectFormat(item.value, $event)">
                  <span class="format-symbol">{{ item.value === 'jpeg' ? 'JPG' : item.value.toUpperCase() }}</span><span class="format-name"><strong>{{ item.label }}</strong><small>{{ item.detail }}</small></span><Check v-if="format === item.value" :size="16" />
                </button>
              </div>
            </div>
          </div>

          <div class="setting-block quality-block" :class="{ disabled: format === 'png' || format === 'tiff' }">
            <div class="quality-heading"><label class="setting-label" for="quality">{{ t('Calidad') }}</label><span>{{ quality }}<small>/100</small></span></div>
            <input id="quality" v-model.number="quality" type="range" min="1" max="100" :disabled="busy || watching || format === 'png' || format === 'tiff'" />
            <div class="range-labels"><span>{{ t('Menor tamaño') }}</span><span>{{ t('Mayor calidad') }}</span></div>
          </div>

          <div class="setting-block output-block">
            <label class="setting-label">{{ t('Guardar en') }}</label>
            <button class="output-select" :disabled="!desktopApiAvailable || busy || watching" @click="chooseOutput"><FolderOpen :size="16" /><span :title="outputDirectory">{{ shortPath(outputDirectory) }}</span><ArrowRight :size="15" /></button>
          </div>

          <AdvancedTools v-model="tools" :format="format" :quality="quality" :output-directory="outputDirectory" :language="selectedLanguage" :busy="busy" :first-file="files[0]?.path" :preview-files="files" @apply="applyTools" @watching="watching = $event" />
          <div class="settings-spacer"></div>
          <p v-if="batchError" class="runtime-warning" role="alert">{{ batchError }}</p>
          <div v-if="busy || finished" class="progress-area">
            <div class="progress-heading" role="status" aria-live="polite"><span :title="batchError">{{ busy ? (cancelRequested ? t('Deteniendo…') : t('Convirtiendo imágenes')) : cancelRequested ? t('Conversión detenida') : failureCount ? t('Conversión finalizada') : t('Todo listo') }}</span><span>{{ progressCount }} / {{ batchTotal }}</span></div>
            <div class="progress-track" role="progressbar" :aria-label="t('Convirtiendo imágenes')" :aria-valuenow="progressCount" :aria-valuemin="0" :aria-valuemax="batchTotal"><span :style="{ width: `${progressPercent}%` }"></span></div>
          </div>
          <button v-if="busy" class="convert-button cancel-button" @click="cancelConversion"><X :size="17" /> {{ t('Cancelar conversión') }}</button>
          <button v-else class="convert-button" :disabled="!desktopApiAvailable || !canConvert" @click="startConversion()"><ArrowDownToLine :size="17" /> {{ t('Convertir') }} {{ files.length ? `${files.length} ${files.length === 1 ? t('imagen') : t('imágenes')}` : t('imágenes') }} <ArrowRight :size="16" class="button-arrow" /></button>
          <p v-if="finished && summary && summary.inputBytes" class="conversion-summary" role="status">{{ t('Tamaño final') }}: {{ formatSize(summary.outputBytes) }} · {{ summary.outputBytes <= summary.inputBytes ? t('Ahorro') : t('Aumento') }}: {{ Math.abs(Math.round((1 - summary.outputBytes / summary.inputBytes) * 100)) }}%</p>
          <button v-if="!busy && failedFiles.length" class="open-folder-button" :disabled="loadingFiles" @click="startConversion(true)">{{ t('Reintentar fallidos') }} ({{ failedFiles.length }})</button>
          <button v-if="finished && completedCount" class="open-folder-button" @click="openOutputFolder"><FolderOpen :size="15" /> {{ t('Abrir carpeta de destino') }}</button>
        </aside>
      </div>

      <footer class="bottom-note"><span><ShieldCheck :size="15" /> {{ t('Tus archivos nunca salen de este equipo') }}</span><span v-if="outputDirectory">{{ t('Salida automática:') }} <strong>{{ shortPath(outputDirectory) }}</strong></span></footer>
    </section>
    <div v-if="dragActive" class="drag-overlay"><span><ArrowDownToLine :size="24" /> {{ t('Suelta para añadir imágenes') }}</span></div>
  </main>
</template>
