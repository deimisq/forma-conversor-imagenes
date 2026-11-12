<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { defaultSettings, validateSettings, type ConversionSettings, type SavedPreset } from '../../shared/advanced-settings.ts'
import type { WatchStatus } from '../../electron/folder-watcher.ts'
import { toolMessage } from '../../shared/tool-errors.ts'
import { plannedFilename } from '../../shared/naming.ts'
const props = defineProps<{ modelValue: ConversionSettings; format: ConversionSettings['format']; quality: number; outputDirectory: string; language: 'es' | 'en'; busy: boolean; firstFile?: string; previewFiles?: { path: string; name: string }[] }>()
const emit = defineEmits<{ 'update:modelValue': [ConversionSettings]; apply: [ConversionSettings]; watching: [boolean] }>()
const l = (es: string, en: string) => props.language === 'en' ? en : es
const settings = ref<ConversionSettings>(defaultSettings())
const presets = ref<SavedPreset[]>([])
const watchState = ref<WatchStatus>({ active: false, processing: false, completed: 0, failed: 0, source: '', output: '' })
const watchSource = ref('')
const includeExisting = ref(false)
const background = ref({ closeAction: 'ask' as 'ask' | 'hide' | 'quit', watchNotifications: true })
const savingBackground = ref(false)
async function saveBackground() {
  savingBackground.value = true
  try { background.value = await window.imageDesk.setBackgroundPreferences({ ...background.value }) }
  catch (cause) { report(cause) }
  finally { savingBackground.value = false }
}
const startingWatch = ref(false)
let removeWatchListener = () => {}
function updateWatch(state: WatchStatus) { watchState.value = state; emit('watching', state.active || state.processing) }
async function chooseWatchSource() { try { watchSource.value = (await window.imageDesk.selectFolder())[0] || watchSource.value } catch (cause) { report(cause) } }
async function startWatch() {
  startingWatch.value = true
  try { updateWatch(await window.imageDesk.startWatching({ source: watchSource.value, outputDir: props.outputDirectory, settings: JSON.parse(JSON.stringify(current.value)), includeExisting: includeExisting.value })); error.value = '' }
  catch (cause) { report(cause) }
  finally { startingWatch.value = false }
}
async function stopWatch() { try { updateWatch(await window.imageDesk.stopWatching()) } catch (cause) { report(cause) } }
const selectedPreset = ref('')
const presetName = ref('')
const importInput = ref<HTMLInputElement | null>(null)
const previewSelection = ref('')
const previewInput = computed(() => props.previewFiles?.some(file => file.path === previewSelection.value) ? previewSelection.value : props.firstFile)
const previewIndex = computed(() => Math.max(0, props.previewFiles?.findIndex(file => file.path === previewInput.value) ?? 0))
function builtInPreset(kind: 'web' | 'catalog') {
  const next = defaultSettings()
  next.resize = { ...next.resize, mode: kind === 'web' ? 'bounds' : 'contain', width: kind === 'web' ? 1920 : 1200, height: kind === 'web' ? 1080 : 1200 }
  settings.value = next; selectedPreset.value = ''; presetName.value = kind === 'web' ? 'Web 1920' : l('Catálogo 1200', 'Catalog 1200')
  emit('apply', JSON.parse(JSON.stringify(next)))
}
async function importPreset(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  saving.value = true
  try {
    if (file.size > 1024 * 1024) throw new Error(l('El ajuste admite hasta 1 MB.', 'Preset files support up to 1 MB.'))
    const data = JSON.parse(await file.text())
    if (data?.version !== 1 || typeof data.name !== 'string') throw new Error(l('El archivo de ajuste no es válido.', 'Invalid preset file.'))
    const saved = await window.imageDesk.savePreset({ name: data.name, settings: validateSettings(data.settings) })
    presets.value = saved.presets; selectedPreset.value = saved.presets.find(item => item.name === data.name.trim())?.id || ''; applyPreset(); error.value = ''
  } catch (cause) { report(cause) }
  finally { input.value = ''; saving.value = false }
}
function exportPreset() {
  const preset = presets.value.find(item => item.id === selectedPreset.value)
  if (!preset) return
  const portable = JSON.parse(JSON.stringify(preset.settings)) as ConversionSettings
  portable.watermark.imagePath = ''
  if (portable.watermark.mode === 'image') portable.watermark.mode = 'none'
  const url = URL.createObjectURL(new Blob([JSON.stringify({ version: 1, name: preset.name, settings: portable }, null, 2)], { type: 'application/json' }))
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'forma-preset.json'; anchor.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
const dialog = ref<HTMLDialogElement | null>(null)
const ready = ref(false)
const saving = ref(false)
const previewing = ref(false)
const error = ref('')
const preview = ref<Awaited<ReturnType<Window['imageDesk']['preview']>> | null>(null)
const current = computed(() => ({ ...settings.value, format: props.format, quality: props.quality }))
const plannedName = computed(() => { try { return props.firstFile ? plannedFilename(props.firstFile, current.value, 0) : '' } catch { return l('Revisa las opciones de nombre.', 'Review the naming options.') } })
let timer: ReturnType<typeof setTimeout> | undefined
let revision = 0
watch(previewInput, () => { revision++; preview.value = null })
function report(cause: unknown) {
  error.value = toolMessage(cause, props.language)
}
async function persist() {
  if (!ready.value || !window.imageDesk) return
  try { await window.imageDesk.saveTools({ ...JSON.parse(JSON.stringify(current.value)), outputDirectory: props.outputDirectory }); error.value = '' }
  catch (cause) { report(cause) }
}
watch([current, () => props.outputDirectory], () => {
  revision++
  preview.value = null
  emit('update:modelValue', JSON.parse(JSON.stringify(current.value)))
  if (ready.value) { clearTimeout(timer); timer = setTimeout(() => void persist(), 150) }
}, { deep: true })
onMounted(async () => {
  if (!window.imageDesk) return
  try {
    const saved = await window.imageDesk.loadTools()
    background.value = await window.imageDesk.getBackgroundPreferences()
    settings.value = saved.preferences
    presets.value = saved.presets
    await nextTick()
    emit('update:modelValue', JSON.parse(JSON.stringify(current.value)))
    ready.value = true
    removeWatchListener = window.imageDesk.onWatchState(updateWatch)
    updateWatch(await window.imageDesk.watchStatus())
  } catch (cause) { report(cause) }
})
onBeforeUnmount(() => { removeWatchListener(); clearTimeout(timer); if (ready.value) void persist() })
async function open() {
  try { background.value = await window.imageDesk.getBackgroundPreferences() } catch (cause) { report(cause) }
  dialog.value?.showModal()
}
function trapFocus(event: KeyboardEvent) {
  if (event.key !== 'Tab' || !dialog.value) return
  const controls = Array.from(dialog.value.querySelectorAll<HTMLElement>('button, input, select, [tabindex]')).filter(element => !element.matches(':disabled') && element.tabIndex >= 0 && element.getClientRects().length > 0)
  const first = controls[0], last = controls[controls.length - 1]
  if (!first) { event.preventDefault(); return }
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
}
function applyPreset() {
  const preset = presets.value.find(item => item.id === selectedPreset.value)
  if (!preset) return
  settings.value = JSON.parse(JSON.stringify(preset.settings))
  presetName.value = preset.name
  emit('apply', JSON.parse(JSON.stringify(preset.settings)))
}
async function savePreset(update: boolean) {
  saving.value = true
  try {
    const result = await window.imageDesk.savePreset({ ...(update ? { id: selectedPreset.value } : {}), name: presetName.value, settings: JSON.parse(JSON.stringify(current.value)) })
    presets.value = result.presets
    selectedPreset.value = result.presets.find(item => item.name === presetName.value.trim())?.id || ''
    error.value = ''
  } catch (cause) { report(cause) }
  finally { saving.value = false }
}
async function deletePreset() {
  saving.value = true
  try { const result = await window.imageDesk.deletePreset(selectedPreset.value); presets.value = result.presets; selectedPreset.value = ''; presetName.value = ''; error.value = '' }
  catch (cause) { report(cause) }
  finally { saving.value = false }
}
async function selectWatermark() {
  try { const file = await window.imageDesk.selectWatermark(); if (file) settings.value.watermark.imagePath = file }
  catch (cause) { report(cause) }
}
async function showPreview() {
  if (!props.firstFile) return
  previewing.value = true
  const version = revision
  try {
    const result = await window.imageDesk.preview({ ...JSON.parse(JSON.stringify(current.value)), files: [previewInput.value], sequence: [previewIndex.value], outputDir: props.outputDirectory })
    if (version === revision) preview.value = result
    error.value = ''
  } catch (cause) { report(cause) }
  finally { previewing.value = false }
}
</script>

<template>
  <button class="tools-open" :disabled="busy || !ready" @click="open">{{ watchState.active ? l('Vigilando carpeta · herramientas', 'Watching folder · tools') : l('Herramientas avanzadas', 'Advanced tools') }}</button>
  <p v-if="error && !ready" class="tools-error" role="alert">{{ error }}</p>
  <dialog ref="dialog" class="tools-dialog" @keydown="trapFocus" @close="persist" :aria-label="l('Herramientas avanzadas', 'Advanced tools')">
    <header class="tools-heading"><div><h2>{{ l('Herramientas avanzadas', 'Advanced tools') }}</h2><p>{{ l('Todas incluidas en Forma gratuita.', 'All included in free Forma.') }}</p></div><button type="button" @click="dialog?.close()">{{ l('Cerrar', 'Close') }}</button></header>
    <p v-if="error" class="tools-error" role="alert">{{ error }}</p>
    <fieldset :disabled="busy || saving || previewing || watchState.active || watchState.processing || startingWatch" class="tools-content">
      <section class="tools-section"><h3>{{ l('Mis ajustes', 'My presets') }}</h3>
        <div class="tools-actions"><button @click="builtInPreset('web')">Web · 1920 × 1080</button><button @click="builtInPreset('catalog')">{{ l('Catálogo', 'Catalog') }} · 1200 × 1200</button><button @click="importInput?.click()">{{ l('Importar JSON', 'Import JSON') }}</button><button :disabled="!selectedPreset" @click="exportPreset">{{ l('Exportar JSON', 'Export JSON') }}</button></div>
        <input ref="importInput" type="file" accept=".json,application/json" hidden @change="importPreset" />
        <p class="tools-hint">{{ l('La exportación conserva el texto de marca, pero excluye su imagen y ruta. Vuelve a seleccionar la imagen en el otro equipo.', 'Export keeps watermark text but excludes its image and path. Select the image again on the other computer.') }}</p>
        <label>{{ l('Ajuste guardado', 'Saved preset') }}<select v-model="selectedPreset" @change="applyPreset"><option value="">{{ l('Seleccionar…', 'Select…') }}</option><option v-for="item in presets" :key="item.id" :value="item.id">{{ item.name }}</option></select></label>
        <label>{{ l('Nombre del ajuste', 'Preset name') }}<input v-model="presetName" maxlength="60" /></label>
        <div class="tools-actions"><button :disabled="!presetName.trim()" @click="savePreset(false)">{{ l('Guardar nuevo', 'Save new') }}</button><button :disabled="!selectedPreset || !presetName.trim()" @click="savePreset(true)">{{ l('Actualizar', 'Update') }}</button><button :disabled="!selectedPreset" @click="deletePreset">{{ l('Eliminar', 'Delete') }}</button></div>
      </section>
      <section class="tools-section"><h3>{{ l('Tamaño y carpetas', 'Size and folders') }}</h3>
        <label>{{ l('Redimensionado', 'Resize') }}<select v-model="settings.resize.mode"><option value="none">{{ l('Tamaño original', 'Original size') }}</option><option value="width">{{ l('Por ancho', 'By width') }}</option><option value="height">{{ l('Por alto', 'By height') }}</option><option value="percentage">{{ l('Por porcentaje', 'By percentage') }}</option><option value="cover">{{ l('Recortar para llenar', 'Crop to fill') }}</option><option value="contain">{{ l('Rellenar lienzo', 'Pad to size') }}</option><option value="bounds">{{ l('Dimensiones máximas', 'Maximum dimensions') }}</option></select></label>
        <div class="tools-grid"><label v-if="['width','bounds','cover','contain'].includes(settings.resize.mode)">{{ l('Ancho (px)', 'Width (px)') }}<input v-model.number="settings.resize.width" type="number" min="1" max="30000" /></label><label v-if="['height','bounds','cover','contain'].includes(settings.resize.mode)">{{ l('Alto (px)', 'Height (px)') }}<input v-model.number="settings.resize.height" type="number" min="1" max="30000" /></label><label v-if="settings.resize.mode === 'percentage'">{{ l('Porcentaje', 'Percentage') }}<input v-model.number="settings.resize.percentage" type="number" min="1" max="400" /></label></div>
        <label class="tools-check"><input v-model="settings.resize.allowEnlargement" type="checkbox" />{{ l('Permitir ampliar imágenes pequeñas', 'Allow enlarging small images') }}</label>
        <label class="tools-check"><input v-model="settings.preserveFolders" type="checkbox" />{{ l('Conservar subcarpetas de origen', 'Preserve source subfolders') }}</label>
        <p v-if="settings.resize.mode === 'cover'" class="tools-hint">{{ l('Recorta desde el centro. Sin ampliación, un original pequeño puede producir dimensiones menores.', 'Crops from the center. Without enlargement, small inputs may produce smaller dimensions.') }}</p>
        <label>{{ l('Fondo de lienzo y JPEG', 'Canvas and JPEG background') }}<input v-model="settings.adjustments.background" type="color" /></label>
        <label>{{ l('Giro adicional', 'Additional rotation') }}<select v-model.number="settings.adjustments.rotation"><option :value="0">0°</option><option :value="90">90°</option><option :value="180">180°</option><option :value="270">270°</option></select></label>
        <label class="tools-check"><input v-model="settings.adjustments.flop" type="checkbox" />{{ l('Espejo horizontal', 'Horizontal mirror') }}</label>
        <label class="tools-check"><input v-model="settings.adjustments.flip" type="checkbox" />{{ l('Voltear verticalmente', 'Vertical flip') }}</label>
        <label class="tools-check"><input v-model="settings.adjustments.grayscale" type="checkbox" />{{ l('Escala de grises', 'Grayscale') }}</label>
        <label>{{ l('Metadatos de salida', 'Output metadata') }}<select v-model="settings.adjustments.metadata"><option value="strip">{{ l('Eliminar metadatos', 'Remove metadata') }}</option><option value="color">{{ l('Incluir perfil sRGB, sin EXIF', 'Embed sRGB profile, no EXIF') }}</option></select></label>
        <p class="tools-hint">{{ l('No conserva GPS, EXIF ni copyright del original. El perfil sRGB no restaura esos datos.', 'Does not retain source GPS, EXIF or copyright. The sRGB profile does not restore that data.') }}</p>
        <label v-if="format === 'jpeg'" class="tools-check"><input v-model="settings.adjustments.jpegProgressive" type="checkbox" />{{ l('JPEG progresivo', 'Progressive JPEG') }}</label>
        <label v-if="format === 'webp'" class="tools-check"><input v-model="settings.adjustments.webpLossless" type="checkbox" />{{ l('WebP sin pérdida (incompatible con peso objetivo)', 'Lossless WebP (incompatible with target size)') }}</label>
      </section>
      <section class="tools-section"><h3>{{ l('Renombrado', 'Batch naming') }}</h3>
        <label class="tools-check"><input v-model="settings.naming.enabled" type="checkbox" />{{ l('Renombrar resultados', 'Rename results') }}</label>
        <template v-if="settings.naming.enabled"><div class="tools-grid"><label>{{ l('Prefijo', 'Prefix') }}<input v-model="settings.naming.prefix" maxlength="60" /></label><label>{{ l('Sufijo', 'Suffix') }}<input v-model="settings.naming.suffix" maxlength="60" /></label></div>
        <label class="tools-check"><input v-model="settings.naming.keepOriginalName" type="checkbox" />{{ l('Conservar nombre original', 'Keep original name') }}</label><label class="tools-check"><input v-model="settings.naming.numbered" type="checkbox" />{{ l('Añadir numeración', 'Add numbering') }}</label>
        <div v-if="settings.naming.numbered" class="tools-grid"><label>{{ l('Inicio', 'Start') }}<input v-model.number="settings.naming.start" type="number" min="1" max="999999999" /></label><label>{{ l('Dígitos mínimos', 'Minimum digits') }}<input v-model.number="settings.naming.padding" type="number" min="1" max="9" /></label></div></template>
        <p v-if="plannedName" class="tools-hint">{{ l('Nombre previsto:', 'Planned name:') }} {{ plannedName }}</p>
      </section>
      <section class="tools-section"><h3>{{ l('Peso objetivo', 'Target file size') }}</h3>
        <label class="tools-check"><input v-model="settings.target.enabled" type="checkbox" />{{ l('Limitar el tamaño de cada resultado', 'Limit each output file size') }}</label>
        <template v-if="settings.target.enabled"><p class="tools-hint">{{ l('Disponible en JPEG, WebP y AVIF. Si no se alcanza el límite, se informa del error sin guardar un archivo mayor.', 'Available for JPEG, WebP and AVIF. If the limit cannot be reached, no oversized file is saved.') }}</p><div class="tools-grid"><label>{{ l('Máximo (KB)', 'Maximum (KB)') }}<input v-model.number="settings.target.maxKB" type="number" min="1" max="100000" /></label><label>{{ l('Calidad mínima', 'Minimum quality') }}<input v-model.number="settings.target.minQuality" type="number" min="1" :max="quality" /></label></div><label class="tools-check"><input v-model="settings.target.allowResize" type="checkbox" />{{ l('Permitir reducir dimensiones para alcanzar el peso', 'Allow reducing dimensions to reach the target') }}</label></template>
      </section>
      <section class="tools-section"><h3>{{ l('Marca de agua', 'Watermark') }}</h3>
        <label>{{ l('Tipo', 'Type') }}<select v-model="settings.watermark.mode"><option value="none">{{ l('Sin marca', 'No watermark') }}</option><option value="text">{{ l('Texto', 'Text') }}</option><option value="image">{{ l('Imagen', 'Image') }}</option></select></label>
        <template v-if="settings.watermark.mode !== 'none'">
          <label v-if="settings.watermark.mode === 'text'">{{ l('Texto', 'Text') }}<input v-model="settings.watermark.text" maxlength="120" /></label>
          <label v-if="settings.watermark.mode === 'text'">{{ l('Color', 'Color') }}<input v-model="settings.watermark.color" type="color" /></label>
          <button v-if="settings.watermark.mode === 'image'" @click="selectWatermark">{{ l('Seleccionar imagen', 'Select image') }}</button><p v-if="settings.watermark.mode === 'image'" class="tools-hint">{{ settings.watermark.imagePath }}</p>
          <label>{{ l('Posición', 'Position') }}<select v-model="settings.watermark.position"><option value="top-left">{{ l('Arriba izquierda', 'Top left') }}</option><option value="top-right">{{ l('Arriba derecha', 'Top right') }}</option><option value="bottom-left">{{ l('Abajo izquierda', 'Bottom left') }}</option><option value="bottom-right">{{ l('Abajo derecha', 'Bottom right') }}</option><option value="center">{{ l('Centro', 'Center') }}</option></select></label>
          <div class="tools-grid"><label>{{ l('Ancho (%)', 'Width (%)') }}<input v-model.number="settings.watermark.size" type="number" min="5" max="80" /></label><label>{{ l('Opacidad (%)', 'Opacity (%)') }}<input v-model.number="settings.watermark.opacity" type="number" min="0" max="100" /></label><label>{{ l('Margen (px)', 'Margin (px)') }}<input v-model.number="settings.watermark.margin" type="number" min="0" max="500" /></label></div>
        </template>
      </section>
    </fieldset>
    <section class="tools-background">
      <h3>{{ l('Bandeja y notificaciones', 'System tray and notifications') }}</h3>
      <label>{{ l('Al cerrar Forma', 'When closing Forma') }}
        <select v-model="background.closeAction" :disabled="savingBackground" @change="saveBackground">
          <option value="ask">{{ l('Preguntar siempre', 'Always ask') }}</option>
          <option value="hide">{{ l('Ocultar en la bandeja del sistema', 'Hide in the system tray') }}</option>
          <option value="quit">{{ l('Cerrar la aplicación', 'Quit the application') }}</option>
        </select>
      </label>
      <label class="tools-check"><input v-model="background.watchNotifications" type="checkbox" :disabled="savingBackground" @change="saveBackground" />{{ l('Notificar conversiones de la carpeta vigilada', 'Notify watched folder conversions') }}</label>
      <p class="tools-hint">{{ l('Ocultar mantiene la vigilancia activa. Para salir, usa el menú del icono junto al reloj. Puedes cambiar aquí una elección recordada.', 'Hiding keeps watching active. To quit, use the tray icon menu beside the clock. Change a remembered choice here.') }}</p>
    </section>
    <section class="tools-watch">
      <h3>{{ l('Carpeta vigilada', 'Watched folder') }}</h3>
      <p class="tools-hint">{{ l('Convierte imágenes nuevas o modificadas cuando dejan de cambiar. La vigilancia funciona mientras Forma está abierta y usa las opciones actuales al iniciarla. El destino debe estar fuera del origen.', 'Converts new or modified images after they stop changing. Watching runs while Forma is open and uses the settings captured when started. Output must be outside the source folder.') }}</p>
      <button :disabled="watchState.active || watchState.processing || startingWatch" @click="chooseWatchSource">{{ l('Seleccionar carpeta de origen', 'Select source folder') }}</button>
      <p class="tools-hint">{{ watchState.active ? watchState.source : watchSource }}</p>
      <label class="tools-check"><input v-model="includeExisting" type="checkbox" :disabled="watchState.active || startingWatch" />{{ l('Procesar también archivos existentes', 'Also process existing files') }}</label>
      <button v-if="!watchState.active" :disabled="!watchSource || !outputDirectory || busy || previewing || startingWatch || watchState.processing" @click="startWatch">{{ startingWatch ? l('Iniciando…', 'Starting…') : l('Iniciar vigilancia', 'Start watching') }}</button>
      <button v-else @click="stopWatch">{{ l('Detener vigilancia', 'Stop watching') }}</button>
      <p v-if="watchState.active || watchState.completed || watchState.failed" role="status" class="tools-hint">{{ watchState.processing ? l('Convirtiendo…', 'Converting…') : watchState.active ? l('Esperando imágenes', 'Waiting for images') : l('Vigilancia detenida', 'Watching stopped') }} · {{ watchState.completed }} {{ l('correctas', 'completed') }} · {{ watchState.failed }} {{ l('fallidas', 'failed') }}</p>
      <p v-if="watchState.message" role="alert" class="tools-error">{{ toolMessage(new Error(watchState.message), language) }}</p>
    </section>
    <footer class="tools-preview"><label v-if="previewFiles?.length">{{ l('Imagen para vista previa', 'Preview image') }}<select v-model="previewSelection" :disabled="previewing"><option value="">{{ l('Primera imagen', 'First image') }}</option><option v-for="file in previewFiles" :key="file.path" :value="file.path">{{ file.name }}</option></select></label><button :disabled="!firstFile || busy || previewing || watchState.active || watchState.processing" @click="showPreview">{{ previewing ? l('Generando vista previa…', 'Generating preview…') : l('Comparar original y resultado', 'Compare original and result') }}</button><p class="tools-hint">{{ l('No modifica el original ni guarda resultados. Las marcas no admiten GIF animados.', 'Does not modify the original or save output. Watermarks do not support animated GIFs.') }}</p>
      <figure v-if="preview"><div class="preview-comparison"><div><span>{{ l('Original', 'Original') }}</span><img :src="preview.originalDataUrl" :alt="l('Original', 'Original')" /></div><div><span>{{ l('Resultado', 'Result') }}</span><img :src="preview.dataUrl" :alt="l('Vista previa de conversión', 'Conversion preview')" /></div></div><figcaption>{{ preview.filename }} · {{ preview.width }} × {{ preview.height }} px · {{ (preview.outputBytes / 1024).toFixed(1) }} KB</figcaption></figure>
    </footer>
  </dialog>
</template>

<style scoped>
.tools-open { min-height: 34px; }
.tools-dialog { width: min(740px, calc(100vw - 32px)); max-height: calc(100vh - 48px); border: 1px solid #dce8df; border-radius: 14px; padding: 0; color: var(--ink); background: #fafcf9; box-shadow: 0 24px 80px #102d2738; }
.tools-dialog::backdrop { background: #10231c88; }
.tools-heading { position: sticky; top: 0; z-index: 1; background: #fafcf9; display: flex; justify-content: space-between; align-items: center; gap: 20px; padding: 22px 26px; border-bottom: 1px solid var(--line); }
h2 { font-size: 20px; margin: 0; } h3 { margin: 0 0 14px; font-size: 14px; } .tools-heading p { color: var(--muted); font-size: 12px; margin: 7px 0 0; }
.tools-content { margin: 0; border: 0; padding: 0 26px; min-width: 0; }
.tools-section { border-bottom: 1px solid var(--line); padding: 22px 0; }
label { display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px; font-size: 12px; }
input, select { border: 1px solid #d5dfd7; border-radius: 6px; padding: 9px 10px; background: white; color: var(--ink); min-width: 0; }
.tools-check { flex-direction: row; align-items: center; gap: 9px; }.tools-check input { margin: 0; accent-color: var(--green); }
.tools-grid { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 0 14px; }
button { border: 1px solid #c8d8cc; background: #edf5f0; border-radius: 6px; padding: 9px 13px; cursor: pointer; font-size: 12px; } button:disabled { opacity: .5; cursor: default; }
.tools-actions { display: flex; flex-wrap: wrap; gap: 8px; }.tools-hint { font-size: 11px; color: #67796e; overflow-wrap: anywhere; line-height: 1.6; }
.tools-error { color: #983d20; background: #fff0e8; padding: 12px 26px; font-size: 12px; }
.tools-watch, .tools-background { padding: 22px 26px; border-bottom: 1px solid var(--line); }
.preview-comparison { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.preview-comparison > div { min-width: 0; display: flex; flex-direction: column; gap: 8px; align-items: center; padding: 8px; border: 1px solid var(--line); background: repeating-conic-gradient(#edf0ed 0% 25%, #fff 0% 50%) 0 / 16px 16px; }
.preview-comparison span { background: white; padding: 3px 8px; font-size: 12px; }
.tools-preview { padding: 22px 26px; } figure { margin: 18px 0 0; text-align: center; } figure img { max-width: 100%; max-height: 360px; object-fit: contain; } figcaption { font-size: 12px; margin-top: 8px; overflow-wrap: anywhere; }
</style>
