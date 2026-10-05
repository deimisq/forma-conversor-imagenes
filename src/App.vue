<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import formaLogo from './assets/forma-logo.svg'
import { ArrowDownToLine, ArrowRight, Check, ChevronDown, CircleAlert, FileImage, FolderOpen, LoaderCircle, Plus, Settings2, ShieldCheck, X } from '@lucide/vue'

type ImageFile = { path: string; name: string; size: number; status: 'queued' | 'converting' | 'done' | 'error' | 'cancelled'; output?: string; message?: string }
type OutputFormat = 'jpeg' | 'png' | 'webp' | 'avif' | 'tiff' | 'gif'

const files = ref<ImageFile[]>([])
const desktopApiAvailable = typeof window.imageDesk !== 'undefined'
const runtimeWarning = ref('')
const appVersion = ref('')
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
const listScrollTop = ref(0)
const rowHeight = 59
const formats: { value: OutputFormat; label: string; detail: string }[] = [
  { value: 'webp', label: 'WebP', detail: 'Ligero y moderno' },
  { value: 'jpeg', label: 'JPEG', detail: 'Ideal para fotografía' },
  { value: 'png', label: 'PNG', detail: 'Con transparencia' },
  { value: 'avif', label: 'AVIF', detail: 'Máxima compresión' },
  { value: 'tiff', label: 'TIFF', detail: 'Alta calidad' },
  { value: 'gif', label: 'GIF', detail: 'Animaciones compatibles' },
]

const totalBytes = computed(() => files.value.reduce((total, file) => total + file.size, 0))
const completedCount = computed(() => files.value.filter((file) => file.status === 'done').length)
const progressPercent = computed(() => files.value.length ? Math.round((progressCount.value / files.value.length) * 100) : 0)
const canConvert = computed(() => files.value.length > 0 && !busy.value)
const currentFormat = computed(() => formats.find((item) => item.value === format.value) ?? formats[0])
const firstVisibleIndex = computed(() => Math.max(0, Math.floor(listScrollTop.value / rowHeight) - 4))
const visibleFiles = computed(() => files.value.slice(firstVisibleIndex.value, firstVisibleIndex.value + 14))

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
  if (!desktopApiAvailable) return
  const existing = new Set(files.value.map((file) => file.path.toLowerCase()))
  const newPaths = paths.filter((file) => !existing.has(file.toLowerCase()))
  if (!newPaths.length) return
  const inspected = await window.imageDesk.inspectFiles(newPaths)
  files.value.push(...inspected.map((file) => ({ ...file, status: 'queued' as const })))
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
  if (!desktopApiAvailable) return
  const selected = await window.imageDesk.selectOutput()
  if (selected) outputDirectory.value = selected
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
    batchError.value = error instanceof Error ? error.message : 'No se pudo iniciar la conversión.'
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
onMounted(async () => {
  if (!desktopApiAvailable) {
    runtimeWarning.value = 'Abre Forma en Windows para acceder a tus archivos.'
    return
  }
  try {
    appVersion.value = await window.imageDesk.getVersion()
    outputDirectory.value = await window.imageDesk.defaultOutput()
    removeProgressListener = window.imageDesk.onProgress(handleProgress)
    removeDropListener = window.imageDesk.onDroppedFiles((paths) => void addPaths(paths))
  } catch (error) {
    runtimeWarning.value = error instanceof Error ? error.message : 'No se pudo conectar con la aplicación de escritorio.'
  }
})
onBeforeUnmount(() => {
  removeProgressListener()
  removeDropListener()
})
</script>

<template>
  <main class="app-shell" @dragenter.prevent="dragActive = true" @dragover.prevent="dragActive = true" @dragleave.self="dragActive = false" @drop.prevent="dragActive = false">
    <header class="topbar">
      <div class="brand"><img :src="formaLogo" class="brand-mark" alt="" /><span>FORMA<span class="brand-dot">.</span></span></div>
      <div class="topbar-right"><span class="local-badge"><ShieldCheck :size="14" /> Procesamiento local</span><span class="version-label">WINDOWS · v{{ appVersion }}</span></div>
    </header>
    <div v-if="runtimeWarning" class="runtime-warning" role="status"><CircleAlert :size="16" /> {{ runtimeWarning }}</div>

    <section class="workspace">
      <div class="intro-row">
        <div>
          <p class="eyebrow">CONVERSIÓN POR LOTES</p>
          <h1>Tus imágenes,<br /><span>en otro formato.</span></h1>
        </div>
        <p class="intro-note">Convierte cientos de archivos<br />sin subirlos a ningún servidor.</p>
      </div>

      <div class="work-grid">
        <section class="files-panel" aria-label="Archivos para convertir">
          <div class="panel-heading">
            <div class="heading-title"><h2>Archivos</h2><span class="count-badge">{{ files.length }}</span></div>
            <button v-if="files.length && !busy" class="text-button" @click="clearFiles">Vaciar lista</button>
            <span v-else-if="busy" class="running-label"><LoaderCircle :size="14" class="spin" /> Procesando</span>
            <span v-else class="supported-label">{{ formatSize(totalBytes) }}</span>
          </div>

          <div v-if="!files.length" class="drop-zone" :class="{ 'is-dragging': dragActive }" @click="chooseFiles">
            <span class="drop-icon"><ArrowDownToLine :size="21" /></span>
            <strong>Suelta tus imágenes aquí</strong>
            <span>o haz clic para explorar tus archivos</span>
            <div class="drop-actions">
              <button class="secondary-button" :disabled="!desktopApiAvailable" @click.stop="chooseFiles"><Plus :size="15" /> Elegir archivos</button>
              <button class="quiet-button" :disabled="!desktopApiAvailable" @click.stop="chooseFolder"><FolderOpen :size="15" /> Añadir carpeta</button>
            </div>
            <small>JPG · PNG · WEBP · AVIF · GIF · TIFF · BMP · SVG · HEIC</small>
          </div>

          <div v-else class="file-list" @scroll="updateListWindow">
            <div class="virtual-spacer" :style="{ height: `${firstVisibleIndex * rowHeight}px` }"></div>
            <div v-for="(file, index) in visibleFiles" :key="file.path" class="file-row" :style="{ '--row-index': firstVisibleIndex + index }">
              <span class="file-icon" :class="`file-${file.status}`"><Check v-if="file.status === 'done'" :size="16" /><CircleAlert v-else-if="file.status === 'error'" :size="16" /><LoaderCircle v-else-if="file.status === 'converting'" :size="16" class="spin" /><FileImage v-else :size="17" /></span>
              <span class="file-info"><strong :title="file.name">{{ file.name }}</strong><small :title="file.path">{{ file.message || shortPath(file.path) }}</small></span>
              <span class="file-size">{{ formatSize(file.size) }}</span>
              <button v-if="!busy" class="remove-button" :aria-label="`Quitar ${file.name}`" @click="removeFile(file.path)"><X :size="15" /></button>
              <span v-else class="status-text" :class="`status-${file.status}`">{{ file.status === 'converting' ? 'Convirtiendo' : file.status === 'done' ? 'Listo' : file.status === 'error' ? 'Error' : file.status === 'cancelled' ? 'Cancelada' : 'En cola' }}</span>
            </div>
            <div class="virtual-spacer" :style="{ height: `${Math.max(0, files.length - firstVisibleIndex - visibleFiles.length) * rowHeight}px` }"></div>
            <button v-if="!busy" class="add-more" :disabled="!desktopApiAvailable" @click="chooseFiles"><Plus :size="15" /> Añadir más imágenes</button>
          </div>

          <div v-if="files.length" class="list-footer"><span>{{ completedCount }} de {{ files.length }} convertidas</span><span>{{ formatSize(totalBytes) }} en total</span></div>
        </section>

        <aside class="settings-panel" aria-label="Opciones de conversión">
          <div class="settings-heading"><span class="settings-icon"><Settings2 :size="17" /></span><h2>Configuración</h2></div>
          <div class="setting-block">
            <label class="setting-label">Formato de salida</label>
            <div class="format-select-wrap">
              <button class="format-select" :aria-expanded="formatMenuOpen" @click="formatMenuOpen = !formatMenuOpen">
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
            <div class="quality-heading"><label class="setting-label" for="quality">Calidad</label><span>{{ quality }}<small>/100</small></span></div>
            <input id="quality" v-model.number="quality" type="range" min="40" max="100" :disabled="format === 'png' || format === 'tiff'" />
            <div class="range-labels"><span>Menor tamaño</span><span>Mayor calidad</span></div>
          </div>

          <div class="setting-block output-block">
            <label class="setting-label">Guardar en</label>
            <button class="output-select" :disabled="!desktopApiAvailable" @click="chooseOutput"><FolderOpen :size="16" /><span :title="outputDirectory">{{ shortPath(outputDirectory) }}</span><ArrowRight :size="15" /></button>
          </div>

          <div class="settings-spacer"></div>
          <div v-if="busy || finished" class="progress-area">
            <div class="progress-heading"><span :title="batchError">{{ busy ? (cancelRequested ? 'Deteniendo…' : 'Convirtiendo imágenes') : cancelRequested ? 'Conversión detenida' : failureCount ? 'Conversión finalizada' : 'Todo listo' }}</span><span>{{ progressCount }} / {{ files.length }}</span></div>
            <div class="progress-track"><span :style="{ width: `${progressPercent}%` }"></span></div>
          </div>
          <button v-if="busy" class="convert-button cancel-button" @click="cancelConversion"><X :size="17" /> Cancelar conversión</button>
          <button v-else class="convert-button" :disabled="!desktopApiAvailable || !canConvert" @click="startConversion"><ArrowDownToLine :size="17" /> Convertir {{ files.length ? `${files.length} ${files.length === 1 ? 'imagen' : 'imágenes'}` : 'imágenes' }} <ArrowRight :size="16" class="button-arrow" /></button>
          <button v-if="finished && completedCount" class="open-folder-button" @click="openOutputFolder"><FolderOpen :size="15" /> Abrir carpeta de destino</button>
        </aside>
      </div>

      <footer class="bottom-note"><span><ShieldCheck :size="15" /> Tus archivos nunca salen de este equipo</span><span v-if="outputDirectory">Salida automática: <strong>{{ shortPath(outputDirectory) }}</strong></span></footer>
    </section>
    <div v-if="dragActive" class="drag-overlay"><span><ArrowDownToLine :size="24" /> Suelta para añadir imágenes</span></div>
  </main>
</template>
