<script setup lang="ts">
import { ref, watch, onBeforeUnmount } from 'vue'
import type { DocumentRequest } from '../../electron/documents.ts'
const props = defineProps<{ language: 'es' | 'en'; disabled: boolean }>()
const emit = defineEmits<{ busy: [value: boolean] }>()
const mode = ref<DocumentRequest['mode']>('pdf')
const files = ref<string[]>([])
const paper = ref<DocumentRequest['paper']>('A4')
const margin = ref(20), dpi = ref(150), first = ref(1), last = ref(1000)
const lossless = ref(true), quality = ref(85)
const password = ref(''), pageFormat = ref<'png' | 'jpeg'>('png')
watch([mode, files], () => { password.value = '' })
const separate = ref(false), orientation = ref<'portrait' | 'landscape' | 'auto'>('portrait')
const busy = ref(false), message = ref(''), output = ref('')
const l = (es: string, en: string) => props.language === 'en' ? en : es
const errorText = (error: unknown) => error instanceof Error ? error.message.replace(/^Error invoking remote method '[^']+': (?:Error: )?/, '') : String(error)
const cancel = () => window.imageDesk.cancel()
const openOutput = () => window.imageDesk.openFolder(output.value)
const unsubscribe = window.imageDesk?.onDocumentProgress(({ done, total }) => { message.value = `${done} / ${total}` })
onBeforeUnmount(() => unsubscribe?.())
async function select() { try { files.value = await window.imageDesk.selectDocuments(mode.value); message.value = '' } catch (e) { message.value = errorText(e) } }
function move(index: number, direction: number) { const next = index + direction; if (next < 0 || next >= files.value.length) return; [files.value[index], files.value[next]] = [files.value[next], files.value[index]] }
async function start() {
  try {
    const directory = await window.imageDesk.selectOutput()
    if (!directory) return
    busy.value = true; emit('busy', true); message.value = l('Procesando…', 'Processing…'); output.value = ''
    const result = await window.imageDesk.convertDocuments({ mode: mode.value, files: files.value, outputDir: directory, paper: paper.value, margin: margin.value, dpi: dpi.value, first: first.value, last: last.value, lossless: lossless.value, quality: quality.value, separate: separate.value, orientation: orientation.value, password: mode.value === 'pages' ? password.value : undefined, pageFormat: pageFormat.value })
    output.value = directory; message.value = l(`${result.length} archivos creados`, `${result.length} files created`)
  } catch (e) { message.value = errorText(e) }
  finally { password.value = ''; busy.value = false; emit('busy', false) }
}
</script>
<template>
  <details class="document-tools">
    <summary>{{ l('PDF y otros formatos', 'PDF and more formats') }}</summary>
    <fieldset :disabled="disabled || busy">
      <label>{{ l('Herramienta', 'Tool') }} <select v-model="mode" @change="files = []; message = ''; output = ''"><option value="pdf">{{ l('Imágenes → PDF combinado', 'Images → combined PDF') }}</option><option value="pages">PDF → PNG / JPEG</option><option value="ico">{{ l('Imágenes → ICO multirresolución', 'Images → multi-size ICO') }}</option><option value="jxl">JPEG XL (beta)</option><option value="heic">HEIC → PNG (beta)</option><option value="tiff">TIFF → PNG</option><option value="animation">GIF/WebP → WebP</option></select></label>
      <p>{{ l('Procesamiento local. Los originales se conservan. PDF usa la primera página de cada imagen; no conserva animaciones ni metadatos.', 'Local processing. Originals are preserved. PDF uses the first page of each image; animation and metadata are not preserved.') }}</p>
      <button @click="select">{{ l('Seleccionar archivos', 'Select files') }}</button>
      <ol><li v-for="(file, index) in files" :key="file"><span :title="file">{{ file.split(/[\\/]/).pop() }}</span><button :disabled="index === 0" :aria-label="l('Subir', 'Move up')" @click="move(index, -1)">↑</button><button :disabled="index === files.length - 1" :aria-label="l('Bajar', 'Move down')" @click="move(index, 1)">↓</button><button :aria-label="l('Quitar', 'Remove')" @click="files.splice(index, 1)">×</button></li></ol>
      <template v-if="mode === 'pdf'"><label>{{ l('Papel', 'Paper') }} <select v-model="paper"><option>A4</option><option value="LETTER">Letter</option><option value="image">{{ l('Tamaño de imagen', 'Image size') }}</option></select></label><label>{{ l('Margen (puntos)', 'Margin (points)') }} <input v-model.number="margin" type="number" min="0" max="100" /></label></template>
      <label v-if="mode === 'pages' || (mode === 'pdf' && paper === 'image')">DPI <input v-model.number="dpi" type="number" min="72" max="600" /></label>
      <template v-if="mode === 'pages'"><label>{{ l('Formato de las páginas', 'Page format') }}<select v-model="pageFormat"><option value="png">PNG</option><option value="jpeg">JPEG</option></select></label><label v-if="pageFormat === 'jpeg'">{{ l('Calidad JPEG', 'JPEG quality') }}<input v-model.number="quality" type="number" min="1" max="100" /></label><label>{{ l('Contraseña del PDF (opcional)', 'PDF password (optional)') }}<input v-model="password" type="password" maxlength="1024" autocomplete="off" /></label><p>{{ l('La contraseña no se guarda y se borra al terminar o cambiar de archivo.', 'The password is not saved and is cleared when the job finishes or the file changes.') }}</p></template>
      <template v-if="mode === 'pdf'"><label><input v-model="separate" type="checkbox" />{{ l('Un PDF por imagen', 'One PDF per image') }}</label><label v-if="paper !== 'image'">{{ l('Orientación', 'Orientation') }} <select v-model="orientation"><option value="portrait">{{ l('Vertical', 'Portrait') }}</option><option value="landscape">{{ l('Horizontal', 'Landscape') }}</option><option value="auto">{{ l('Automática', 'Automatic') }}</option></select></label></template>
      <p v-if="mode === 'heic'">{{ l('Beta: convierte solo la primera imagen a PNG SDR de 8 bits. Máximo 100 MB y 40 MP. No conserva HDR, fotos Live ni metadatos.', 'Beta: converts only the first image to 8-bit SDR PNG. Maximum 100 MB and 40 MP. HDR, Live Photos and metadata are not preserved.') }}</p>
      <p v-if="mode === 'animation'">{{ l('GIF o WebP animado → WebP sin pérdida. Máximo 500 fotogramas y 40 MP en total; conserva duración y repetición.', 'Animated GIF or WebP → lossless WebP. Maximum 500 frames and 40 MP total; preserves timing and loop.') }}</p>
      <template v-if="mode === 'pages' || mode === 'tiff'"><label>{{ l('Desde la página', 'From page') }} <input v-model.number="first" type="number" min="1" max="1000" /></label><label>{{ l('Hasta la página', 'To page') }} <input v-model.number="last" type="number" min="1" max="1000" /></label><p>{{ l('Máximo 100 MB por PDF y 40 megapíxeles por página.', 'Maximum 100 MB per PDF and 40 megapixels per page.') }}</p></template>
      <template v-if="mode === 'jxl'"><label><input v-model="lossless" type="checkbox" />{{ l('Sin pérdida de píxeles', 'Lossless pixels') }}</label><label v-if="!lossless">{{ l('Calidad', 'Quality') }} <input v-model.number="quality" type="number" min="1" max="100" /></label><p>{{ l('Beta: imagen estática SDR de 8 bits, máximo 16 MP. No conserva metadatos ni permite reconstruir el JPEG original.', 'Beta: static 8-bit SDR image, maximum 16 MP. Metadata and original JPEG reconstruction are not preserved.') }}</p></template>
      <button :disabled="!files.length" @click="start">{{ l('Elegir destino y convertir', 'Choose destination and convert') }}</button>
    </fieldset>
    <button v-if="busy" @click="cancel">{{ l('Cancelar', 'Cancel') }}</button>
    <p role="status">{{ message }}</p><button v-if="output" @click="openOutput">{{ l('Abrir carpeta', 'Open folder') }}</button>
  </details>
</template>
<style scoped>
.document-tools { margin: 16px 0; border: 1px solid var(--border, #cccccc40); border-radius: 12px; padding: 14px; } summary { cursor: pointer; font-weight: 600; } fieldset { border: 0; padding: 12px 0; min-width: 0; } label { display: flex; gap: 8px; align-items: center; margin: 10px 0; } input { width: 90px; } select { max-width: 100%; } p { font-size: 12px; line-height: 1.5; } ol { max-height: 180px; overflow: auto; padding-left: 20px; } li { margin: 5px 0; } li span { display: inline-block; max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; vertical-align: middle; } button { padding: 6px 9px; border-radius: 6px; margin: 2px; } button:disabled { opacity: .5; }
</style>
