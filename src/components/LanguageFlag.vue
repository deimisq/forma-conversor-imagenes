<script setup lang="ts">
import type { Language } from '../../shared/locale'
defineProps<{ language: Language }>()
</script>

<template>
  <svg class="language-flag" viewBox="0 0 60 40" width="21" height="14" aria-hidden="true" focusable="false">
    <template v-if="language === 'es'">
      <path fill="#AA151B" d="M0 0h60v40H0z" />
      <path fill="#F1BF00" d="M0 10h60v20H0z" />
      <path fill="#AA151B" d="M15 15h7v9l-3.5 3-3.5-3z" />
      <path fill="#F1BF00" d="M17 17h3v6h-3z" />
    </template>
    <template v-else>
      <path fill="#012169" d="M0 0h60v40H0z" />
      <path stroke="#FFF" stroke-width="9" d="m0 0 60 40M60 0 0 40" />
      <path stroke="#C8102E" stroke-width="3" d="m0 0 60 40M60 0 0 40" />
      <path stroke="#FFF" stroke-width="13" d="M30 0v40M0 20h60" />
      <path stroke="#C8102E" stroke-width="8" d="M30 0v40M0 20h60" />
    </template>
  </svg>
</template>
