<script setup lang="ts">
import { ref } from 'vue'
import AppDialog from '@/components/AppDialog.vue'
import type { Task } from '@/composables/useTasks'

const props = defineProps<{
  remove: (task: Task) => Promise<boolean>
}>()

const dialog = ref<InstanceType<typeof AppDialog>>()
const task = ref<Task | null>(null)
const error = ref('')
const busy = ref(false)

function open(target: Task) {
  task.value = target
  error.value = ''
  dialog.value?.open()
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
  <AppDialog ref="dialog" title="למחוק את המשימה?" :width="440">
    <p class="text">
      <strong>{{ task?.title }}</strong> תימחק לשני המשתמשים, ואי אפשר יהיה לשחזר אותה.
    </p>
    <p v-if="error" class="form-error" role="alert">{{ error }}</p>

    <template #footer>
      <button class="btn" type="button" autofocus @click="dialog?.close()">ביטול</button>
      <button class="btn danger" type="button" :disabled="busy" @click="confirmDelete">
        {{ busy ? 'מוחקים…' : 'מחיקה' }}
      </button>
    </template>
  </AppDialog>
</template>

<style scoped>
.text { margin: 0; font-size: 15px; overflow-wrap: anywhere; }
.form-error { margin-top: 12px; }
.danger { flex: 1; border-color: transparent; background: #b42318; color: #ffffff; font-weight: 700; }
.danger:hover:not(:disabled) { border-color: transparent; filter: brightness(1.1); }
</style>
