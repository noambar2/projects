<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import AppIcon from '@/components/AppIcon.vue'

defineProps<{
  title: string
  width?: number
}>()

const CLOSE_DURATION_MS = 280

const dialog = ref<HTMLDialogElement>()
const visible = ref(false)
let closeTimer: number | undefined

function open() {
  window.clearTimeout(closeTimer)
  dialog.value?.showModal()
  document.documentElement.style.overflow = 'hidden'
  // On the next frame, so the slide-in has a starting position to move from.
  requestAnimationFrame(() => (visible.value = true))
}

function close() {
  if (!dialog.value?.open || !visible.value) return
  visible.value = false
  closeTimer = window.setTimeout(() => {
    dialog.value?.close()
    document.documentElement.style.overflow = ''
  }, CLOSE_DURATION_MS)
}

function onBackdropClick(event: MouseEvent) {
  if (event.target === dialog.value) close()
}

onBeforeUnmount(() => {
  window.clearTimeout(closeTimer)
  document.documentElement.style.overflow = ''
})

defineExpose({ open, close })
</script>

<template>
  <dialog
    ref="dialog"
    class="app-dialog"
    :class="{ visible }"
    :style="{ '--dialog-width': `${width ?? 480}px` }"
    :aria-label="title"
    @click="onBackdropClick"
    @cancel.prevent="close"
  >
    <div class="panel">
      <div class="grabber" aria-hidden="true"></div>
      <header class="head">
        <h2>{{ title }}<span class="dot">.</span></h2>
        <button class="btn close" type="button" aria-label="סגירה" @click="close">
          <AppIcon name="x" />
        </button>
      </header>
      <div class="body">
        <slot />
      </div>
      <footer v-if="$slots.footer" class="foot">
        <slot name="footer" />
      </footer>
    </div>
  </dialog>
</template>

<style scoped>
/* A centered window on larger screens, a bottom sheet on phones. */
.app-dialog {
  width: min(var(--dialog-width), calc(100vw - 32px));
  max-width: none;
  max-height: 85dvh;
  padding: 0;
  overflow: hidden;
  border: none;
  border-radius: var(--radius);
  background: var(--card);
  color: var(--ink);
  box-shadow: var(--shadow-hover);
  opacity: 0;
  transform: translateY(12px) scale(0.98);
  transition: opacity 0.28s ease, transform 0.28s ease;
}
.app-dialog.visible { opacity: 1; transform: none; }
.app-dialog::backdrop { background: rgba(0, 0, 0, 0.2); opacity: 0; transition: opacity 0.28s ease; }
.app-dialog.visible::backdrop { opacity: 1; }

.panel { display: flex; flex-direction: column; max-height: 85dvh; }
.grabber { display: none; }
.head {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 20px;
  border-bottom: 1px solid rgba(var(--ink-rgb), 0.08);
}
h2 { margin: 0; color: var(--navy); font-size: 18px; font-weight: 700; line-height: 1.3; }
.close { flex: none; width: 32px; min-height: 32px; padding: 0; border: none; background: transparent; color: var(--muted); }
.close:hover { background: rgba(var(--ink-rgb), 0.06); color: var(--navy); }
.body { flex: 1; min-height: 0; padding: 20px; overflow-y: auto; overscroll-behavior: contain; }
.foot {
  flex: none;
  display: flex;
  gap: 8px;
  padding: 14px 20px;
  border-top: 1px solid rgba(var(--ink-rgb), 0.08);
}

@media (max-width: 720px) {
  .app-dialog {
    position: fixed;
    inset: auto 0 0;
    width: 100%;
    max-height: 92dvh;
    margin: 0;
    border-radius: 16px 16px 0 0;
    opacity: 1;
    transform: translateY(100%);
    transition: transform 0.28s ease-out;
  }
  .app-dialog.visible { transform: translateY(0); }
  .panel { max-height: 92dvh; }
  .grabber {
    flex: none;
    display: block;
    width: 40px;
    height: 4px;
    margin: 12px auto 4px;
    border-radius: 999px;
    background: rgba(var(--ink-rgb), 0.15);
  }
  .head { padding-top: 8px; }
  .foot { padding-bottom: max(14px, env(safe-area-inset-bottom, 0px)); }
}

@media (prefers-reduced-motion: reduce) {
  .app-dialog, .app-dialog::backdrop { transition-duration: 0.01s; }
}
</style>
