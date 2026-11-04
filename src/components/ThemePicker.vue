<script setup lang="ts">
import { ref } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import { getStoredTheme, storeTheme, THEMES, type ThemeId } from '@/lib/theme'

const current = ref<ThemeId>(getStoredTheme())

function choose(id: ThemeId) {
  current.value = id
  storeTheme(id)
}
</script>

<template>
  <div class="themes" role="radiogroup" aria-label="ערכת נושא">
    <label v-for="theme in THEMES" :key="theme.id" class="theme" :class="{ active: current === theme.id }">
      <input
        type="radio"
        name="theme"
        :value="theme.id"
        :checked="current === theme.id"
        @change="choose(theme.id)"
      />
      <span class="swatch" :style="{ background: theme.swatch }"></span>
      <span class="name">{{ theme.name }}</span>
      <AppIcon v-if="current === theme.id" class="check" name="check" :size="16" />
    </label>
  </div>
</template>

<style scoped>
.themes { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
.theme {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  min-height: 44px;
  padding-inline: 10px;
  box-sizing: border-box;
  border: 1px solid rgba(var(--ink-rgb), 0.14);
  border-radius: var(--radius);
  cursor: pointer;
  transition: border-color 0.15s ease;
}
.theme:hover { border-color: rgba(var(--ink-rgb), 0.4); }
.theme.active { border-color: var(--blue); background: var(--blue-tint); }
.theme:focus-within { outline: 2px solid var(--blue); outline-offset: 2px; }
input { position: absolute; inset: 0; margin: 0; opacity: 0; cursor: pointer; }
.swatch { flex: none; width: 22px; height: 22px; border-radius: 50%; }
.name { min-width: 0; color: var(--navy); font-size: 14px; font-weight: 500; }
.check { flex: none; margin-inline-start: auto; color: var(--blue-text); }

@media (max-width: 480px) {
  .themes { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
</style>
