<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { Check, ChevronDown } from '@lucide/vue'
import LanguageFlag from './LanguageFlag.vue'
import type { Language } from '../../shared/locale'
const props = defineProps<{ value: Language; disabled: boolean; label: string }>()
const emit = defineEmits<{ change: [Language] }>()
const open = ref(false)
const root = ref<HTMLElement>()
const trigger = ref<HTMLButtonElement>()
const languages: Language[] = ['es', 'en']
async function show(index = languages.indexOf(props.value)) {
  if (props.disabled) return
  open.value = true
  await nextTick()
  root.value?.querySelectorAll<HTMLButtonElement>('[role=option]')[index]?.focus()
}
function close(restore = false) { open.value = false; if (restore) trigger.value?.focus() }
function choose(value: Language) { close(true); emit('change', value) }
function keyboard(event: KeyboardEvent) {
  if (event.key === 'Escape' && open.value) { event.preventDefault(); event.stopPropagation(); close(true) }
  else if (event.key === 'Tab') close()
  else if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
    event.preventDefault()
    const options = Array.from(root.value?.querySelectorAll<HTMLButtonElement>('[role=option]') ?? [])
    const index = options.indexOf(document.activeElement as HTMLButtonElement)
    const target = event.key === 'Home' ? 0 : event.key === 'End' ? 1 : !open.value ? languages.indexOf(props.value) : (index + (event.key === 'ArrowDown' ? 1 : -1) + 2) % 2
    void show(target)
  }
}
function outside(event: PointerEvent) { if (!root.value?.contains(event.target as Node)) close() }
onMounted(() => document.addEventListener('pointerdown', outside))
onBeforeUnmount(() => document.removeEventListener('pointerdown', outside))
</script>

<template>
  <div ref="root" class="language-select" @keydown="keyboard" @focusout="event => { if (!root?.contains(event.relatedTarget as Node)) close() }">
    <button ref="trigger" type="button" class="language-trigger" :disabled="disabled" :aria-label="label" aria-haspopup="listbox" :aria-expanded="open" aria-controls="forma-languages" @click="open ? close() : show()">
      <LanguageFlag :language="value" /><span>{{ value.toUpperCase() }}</span><ChevronDown :size="12" aria-hidden="true" />
    </button>
    <div v-if="open" id="forma-languages" class="language-options" role="listbox" :aria-label="label">
      <button v-for="language in languages" :key="language" type="button" role="option" :data-language="language" :aria-selected="value === language" :lang="language" @click="choose(language)">
        <LanguageFlag :language="language" /><span>{{ language === 'es' ? 'Español' : 'English' }}</span><Check v-if="value === language" :size="14" aria-hidden="true" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.language-select { padding: 0; display: block; }
.language-trigger { display: flex; align-items: center; gap: 7px; height: 30px; padding: 0 8px; border: 0; background: transparent; color: inherit; font-size: 11px; font-weight: 700; cursor: pointer; }
.language-options { position: absolute; top: calc(100% + 6px); right: 0; z-index: 50; min-width: 158px; padding: 4px; border: 1px solid #dce8df; border-radius: 6px; background: white; box-shadow: 0 8px 24px #183d2526; }
.language-options button { display: flex; align-items: center; gap: 9px; width: 100%; padding: 9px; border: 0; border-radius: 4px; color: #426c54; background: white; font-size: 12px; cursor: pointer; text-align: left; }
.language-options button span { flex: 1; }
.language-options button:hover, .language-options button:focus-visible { background: #edf5f0; outline: 2px solid #9ccab5; outline-offset: -2px; }
</style>
