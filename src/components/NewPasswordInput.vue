<script setup lang="ts">
import { ref, watch } from 'vue'
import AppIcon from '@/components/AppIcon.vue'

const model = defineModel<string>({ required: true })
const visible = ref(false)

// Hide again once the form clears after a successful change.
watch(model, (value) => {
  if (!value) visible.value = false
})
</script>

<template>
  <span class="wrap">
    <input
      v-model="model"
      :type="visible ? 'text' : 'password'"
      dir="ltr"
      autocomplete="new-password"
      autocapitalize="off"
      autocorrect="off"
      spellcheck="false"
      required
    />
    <button
      class="toggle"
      type="button"
      :aria-label="visible ? 'הסתרת הסיסמה' : 'הצגת הסיסמה'"
      :aria-pressed="visible"
      @click="visible = !visible"
    >
      <AppIcon :name="visible ? 'eye-off' : 'eye'" :size="16" />
    </button>
  </span>
</template>

<style scoped>
.wrap { position: relative; display: block; }
.wrap input { padding-right: 44px; }
.toggle {
  position: absolute;
  top: 50%;
  right: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  transform: translateY(-50%);
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
}
.toggle:hover { background: rgba(var(--ink-rgb), 0.06); color: var(--navy); }
.toggle:focus-visible { outline: 2px solid var(--blue); outline-offset: 1px; }
</style>
