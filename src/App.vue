<script setup lang="ts">
import { t as translate, defaultLanguage, isLanguage, type Language } from '../shared/locale'
import LanguageFlag from './components/LanguageFlag.vue'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import formaLogo from './assets/forma-logo.svg'
import { ArrowDownToLine, ArrowRight, Check, ChevronDown, CircleAlert, Download, FileImage, FolderOpen, LoaderCircle, Plus, RefreshCw, RotateCw, Settings2, ShieldCheck, X } from '@lucide/vue'

type ImageFile = { path: string; name: string; size: number; status: 'queued' | 'converting' | 'done' | 'error' | 'cancelled'; output?: string; message?: string }
type OutputFormat = 'jpeg' | 'png' | 'webp' | 'avif' | 'tiff' | 'gif'
type UpdateState = { status: 'idle' | 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error'; version?: string; percent?: number; message?: string }

const files = ref<ImageFile[]>([])
const desktopApiAvailable = typeof window.imageDesk !== 'undefined'
const selectedLanguage = ref<Language>(defaultLanguage)
const savingLanguage = ref(false)
function t(text: string) { return translate(text, selectedLanguage.value) }
watch(selectedLanguage, (value) => {
  document.documentElement.lang = value
  document.title = t('Forma | Conversor de Imágenes')
}, { immediate: true })

async function changeLanguage(event: Event) {
  const select = event.target as HTMLSelectElement
  const value = select.value
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
    select.value = selectedLanguage.value
    savingLanguage.value = false
  }
}
const runtimeWarning = ref('')
const appVersion = ref('')
const updateState = ref<UpdateState>({ status: 'idle' })
const format = ref<OutputFormat>('webp')
const quality = ref(84)
const outputDirectory = ref('')
const busy = ref(false)
const finished = ref(false)
const dragActive = ref(false)
const progressCount = ref(0)
const failureCount = ref(0)
const cancelRequested = ref(false)
const batchError = ref('')
const formatMenuOpen = ref(false)
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
const completedCount = computed(() => files.value.filter((file) => file.status === 'done').length)
const progressPercent = computed(() => files.value.length ? Math.round((progressCount.value / files.value.length) * 100) : 0)
const canConvert = computed(() => files.value.length > 0 && !busy.value)
const currentFormat = computed(() => formats.value.find((item) => item.value === format.value) ?? formats.value[0])
const firstVisibleIndex = computed(() => Math.min(Math.max(0, files.value.length - 1), Math.max(0, Math.floor(listScrollTop.value / rowHeight) - 4)))
const visibleFiles = computed(() => files.value.slice(firstVisibleIndex.value, firstVisibleIndex.value + Math.ceil(listHeight.value / rowHeight) + 8))
const updateActionLabel = computed(() => {
  if (updateState.value.status === 'checking') return t('Buscando actualizaciones')
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
  if (!desktopApiAvailable || busy.value) return
  const existing = new Set(files.value.map((file) => file.path.toLowerCase()))
  const newPaths = paths.filter((file) => !existing.has(file.toLowerCase()))
  if (!newPaths.length) return
  const inspected = await window.imageDesk.inspectFiles(newPaths)
  if (busy.value) return
  const current = new Set(files.value.map((file) => file.path.toLowerCase()))
  files.value.push(...inspected.filter((file) => {
    const key = file.path.toLowerCase()
    if (current.has(key)) return false
    current.add(key)
    return true
  }).map((file) => ({ ...file, status: 'queued' as const })))
  finished.value = false
}

async function chooseFiles() {
  if (!desktopApiAvailable) return
  await addPaths(await window.imageDesk.selectFiles())
}

async function chooseFolder() {
  if (!desktopApiAvailable) return
  await addPaths(await window.imageDesk.selectFolder())
}

async function chooseOutput() {
  if (!desktopApiAvailable || busy.value) return
  const selected = await window.imageDesk.selectOutput()
  if (selected && !busy.value) {
    outputDirectory.value = selected
    finished.value = false
  }
}

function removeFile(filePath: string) {
  if (busy.value) return
  files.value = files.value.filter((file) => file.path !== filePath)
}

function clearFiles() {
  if (busy.value) return
  files.value = []
  finished.value = false
  progressCount.value = 0
  failureCount.value = 0
  listScrollTop.value = 0
}

function updateListWindow(event: Event) {
  listScrollTop.value = (event.currentTarget as HTMLDivElement).scrollTop
}

async function startConversion() {
  if (!canConvert.value) return
  busy.value = true
  finished.value = false
  cancelRequested.value = false
  formatMenuOpen.value = false
  batchError.value = ''
  progressCount.value = 0
  failureCount.value = 0
  files.value = files.value.map((file) => ({ ...file, status: 'queued', output: undefined, message: undefined }))
  try {
    const result = await window.imageDesk.convert({
      files: files.value.map((file) => file.path),
      outputDir: outputDirectory.value,
      format: format.value,
      quality: quality.value,
    })
    progressCount.value = result.completed + result.failed
    failureCount.value = result.failed
    if (result.cancelled) files.value = files.value.map((file) => file.status === 'queued' ? { ...file, status: 'cancelled' } : file)
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
  await window.imageDesk.cancel()
}

async function openOutputFolder() {
  await window.imageDesk.openFolder(outputDirectory.value)
}

async function runUpdateAction() {
  if (!desktopApiAvailable) return
  try {
    if (updateState.value.status === 'available') await window.imageDesk.downloadUpdate()
    else if (updateState.value.status === 'downloaded') await window.imageDesk.installUpdate()
    else await window.imageDesk.checkForUpdates()
  } catch (error) {
    updateState.value = { status: 'error', message: error instanceof Error ? error.message : t('No se pudo consultar GitHub Releases.') }
  }
}

function handleUpdateState(state: Parameters<Parameters<typeof window.imageDesk.onUpdateState>[0]>[0]) {
  updateState.value = { ...updateState.value, ...state }
}

function handleProgress(event: Parameters<Parameters<typeof window.imageDesk.onProgress>[0]>[0]) {
  if (event.type === 'file' && event.input) {
    const file = files.value.find((item) => item.path === event.input)
    if (file && event.status) {
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
    removeProgressListener = window.imageDesk.onProgress(handleProgress)
    removeDropListener = window.imageDesk.onDroppedFiles((paths) => void addPaths(paths))
    removeUpdateListener = window.imageDesk.onUpdateState(handleUpdateState)
    void window.imageDesk.checkForUpdates()
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
        <label class="language-select" :title="t('Idioma')">
          <LanguageFlag :language="selectedLanguage" />
          <select :value="selectedLanguage" :disabled="savingLanguage" :aria-label="t('Idioma')" @change="changeLanguage">
            <option value="es" lang="es" aria-label="Español">ES</option>
            <option value="en" lang="en" aria-label="English">EN</option>
          </select>
          <ChevronDown :size="12" aria-hidden="true" />
        </label>
        <span class="local-badge"><ShieldCheck :size="14" /> {{ t('Procesamiento local') }}</span>
        <button class="update-action" :class="`update-${updateState.status}`" :disabled="!desktopApiAvailable || updateState.status === 'checking' || updateState.status === 'downloading'" :aria-label="updateActionLabel" :title="updateState.message || updateActionLabel" @click="runUpdateAction">
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
            <button v-if="files.length && !busy" class="text-button" @click="clearFiles">{{ t('Vaciar lista') }}</button>
            <span v-else-if="busy" class="running-label"><LoaderCircle :size="14" class="spin" /> {{ t('Procesando') }}</span>
            <span v-else class="supported-label">{{ formatSize(totalBytes) }}</span>
          </div>

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
              <span class="file-info"><strong :title="file.name">{{ file.name }}</strong><small :title="file.path">{{ file.message || shortPath(file.path) }}</small></span>
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
            <div class="format-select-wrap">
              <button class="format-select" :disabled="busy" :aria-expanded="formatMenuOpen" @click="formatMenuOpen = !formatMenuOpen">
                <span class="format-symbol">{{ currentFormat.value === 'jpeg' ? 'JPG' : currentFormat.value.toUpperCase() }}</span>
                <span class="format-name"><strong>{{ currentFormat.label }}</strong><small>{{ currentFormat.detail }}</small></span>
                <ChevronDown :size="17" class="chevron" />
              </button>
              <div v-if="formatMenuOpen" class="format-menu">
                <button v-for="item in formats" :key="item.value" class="format-option" :class="{ selected: format === item.value }" @click="format = item.value; formatMenuOpen = false">
                  <span class="format-symbol">{{ item.value === 'jpeg' ? 'JPG' : item.value.toUpperCase() }}</span><span class="format-name"><strong>{{ item.label }}</strong><small>{{ item.detail }}</small></span><Check v-if="format === item.value" :size="16" />
                </button>
              </div>
            </div>
          </div>

          <div class="setting-block quality-block" :class="{ disabled: format === 'png' || format === 'tiff' }">
            <div class="quality-heading"><label class="setting-label" for="quality">{{ t('Calidad') }}</label><span>{{ quality }}<small>/100</small></span></div>
            <input id="quality" v-model.number="quality" type="range" min="40" max="100" :disabled="busy || format === 'png' || format === 'tiff'" />
            <div class="range-labels"><span>{{ t('Menor tamaño') }}</span><span>{{ t('Mayor calidad') }}</span></div>
          </div>

          <div class="setting-block output-block">
            <label class="setting-label">{{ t('Guardar en') }}</label>
            <button class="output-select" :disabled="!desktopApiAvailable || busy" @click="chooseOutput"><FolderOpen :size="16" /><span :title="outputDirectory">{{ shortPath(outputDirectory) }}</span><ArrowRight :size="15" /></button>
          </div>

          <div class="settings-spacer"></div>
          <p v-if="batchError" class="runtime-warning" role="alert">{{ batchError }}</p>
          <div v-if="busy || finished" class="progress-area">
            <div class="progress-heading"><span :title="batchError">{{ busy ? (cancelRequested ? t('Deteniendo…') : t('Convirtiendo imágenes')) : cancelRequested ? t('Conversión detenida') : failureCount ? t('Conversión finalizada') : t('Todo listo') }}</span><span>{{ progressCount }} / {{ files.length }}</span></div>
            <div class="progress-track"><span :style="{ width: `${progressPercent}%` }"></span></div>
          </div>
          <button v-if="busy" class="convert-button cancel-button" @click="cancelConversion"><X :size="17" /> {{ t('Cancelar conversión') }}</button>
          <button v-else class="convert-button" :disabled="!desktopApiAvailable || !canConvert" @click="startConversion"><ArrowDownToLine :size="17" /> {{ t('Convertir') }} {{ files.length ? `${files.length} ${files.length === 1 ? t('imagen') : t('imágenes')}` : t('imágenes') }} <ArrowRight :size="16" class="button-arrow" /></button>
          <button v-if="finished && completedCount" class="open-folder-button" @click="openOutputFolder"><FolderOpen :size="15" /> {{ t('Abrir carpeta de destino') }}</button>
        </aside>
      </div>

      <footer class="bottom-note"><span><ShieldCheck :size="15" /> {{ t('Tus archivos nunca salen de este equipo') }}</span><span v-if="outputDirectory">{{ t('Salida automática:') }} <strong>{{ shortPath(outputDirectory) }}</strong></span></footer>
    </section>
    <div v-if="dragActive" class="drag-overlay"><span><ArrowDownToLine :size="24" /> {{ t('Suelta para añadir imágenes') }}</span></div>
  </main>
</template>
