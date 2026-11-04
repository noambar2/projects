<script setup lang="ts">
import { ref } from 'vue'
import type { Task } from '@/composables/useTasks'

const props = defineProps<{
  remove: (task: Task) => Promise<boolean>
}>()

const dialog = ref<HTMLDialogElement>()
const task = ref<Task | null>(null)
const error = ref('')
const busy = ref(false)

function open(target: Task) {
  task.value = target
  error.value = ''
  dialog.value?.showModal()
}

async function confirmDelete() {
  if (!task.value) return
  error.value = ''
  busy.value = true
  const removed = await props.remove(task.value)
  busy.value = false
  if (removed) dialog.value?.close()
  else error.value = 'המשימה לא נמחקה. כדאי לנסות שוב.'
}

defineExpose({ open })
</script>

<template>
  <dialog ref="dialog" class="dialog" aria-labelledby="delete-task-title" aria-describedby="delete-task-text">
    <h2 id="delete-task-title">למחוק את המשימה?</h2>
    <p id="delete-task-text" class="text">
      <strong>{{ task?.title }}</strong> תימחק לשני המשתמשים, ואי אפשר יהיה לשחזר אותה.
    </p>
    <p v-if="error" class="form-error" role="alert">{{ error }}</p>
    <div class="actions">
      <button class="btn" type="button" autofocus @click="dialog?.close()">ביטול</button>
      <button class="btn danger" type="button" :disabled="busy" @click="confirmDelete">
        {{ busy ? 'מוחקים…' : 'מחיקה' }}
      </button>
    </div>
  </dialog>
</template>

<style scoped>
.dialog {
  width: min(440px, calc(100vw - 32px));
  padding: 24px;
  box-sizing: border-box;
  border: none;
  border-radius: var(--radius);
  background: var(--card);
  color: var(--ink);
  box-shadow: var(--shadow-hover);
}
.dialog::backdrop { background: rgba(18, 39, 54, 0.45); }
h2 { margin: 0 0 12px; color: var(--navy); font-size: 22px; font-weight: 700; }
.text { margin: 0 0 16px; font-size: 15px; overflow-wrap: anywhere; }
.form-error { margin-bottom: 16px; }
.actions { display: flex; gap: 8px; }
.danger { flex: 1; border-color: transparent; background: #b42318; color: #ffffff; font-weight: 700; }
.danger:hover:not(:disabled) { border-color: transparent; filter: brightness(1.1); }
</style>
