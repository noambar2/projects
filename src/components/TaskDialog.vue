<script setup lang="ts">
import { computed, ref } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import {
  LIST_STATUSES,
  STATUS_LABELS,
  type EditableTaskFields,
  type Subtask,
  type Task,
  type TaskStatus,
} from '@/composables/useTasks'

const props = defineProps<{
  save: (fields: EditableTaskFields, task: Task | null) => Promise<boolean>
}>()

const dialog = ref<HTMLDialogElement>()
const editing = ref<Task | null>(null)
const title = ref('')
const notes = ref('')
const status = ref<TaskStatus>('todo')
const dueDate = ref('')
const subtasks = ref<Subtask[]>([])
const error = ref('')
const busy = ref(false)

// A new task can't start as done: completion is recorded when a task moves there.
const statusOptions = computed(() => LIST_STATUSES.filter((option) => editing.value || option !== 'done'))

function open(task: Task | null, defaultStatus: TaskStatus = 'todo') {
  editing.value = task
  title.value = task?.title ?? ''
  notes.value = task?.notes ?? ''
  status.value = task?.status ?? defaultStatus
  dueDate.value = task?.due_date ?? ''
  subtasks.value = (task?.subtasks ?? []).map((subtask) => ({ ...subtask }))
  error.value = ''
  dialog.value?.showModal()
}

function addSubtask() {
  subtasks.value.push({ id: crypto.randomUUID(), title: '', done: false })
}

function removeSubtask(id: string) {
  subtasks.value = subtasks.value.filter((subtask) => subtask.id !== id)
}

async function submit() {
  const cleanTitle = title.value.trim()
  if (!cleanTitle) {
    error.value = 'צריך לכתוב כותרת למשימה.'
    return
  }
  error.value = ''
  busy.value = true
  const saved = await props.save(
    {
      title: cleanTitle,
      notes: notes.value.trim() || null,
      status: status.value,
      due_date: dueDate.value || null,
      subtasks: subtasks.value
        .map((subtask) => ({ ...subtask, title: subtask.title.trim() }))
        .filter((subtask) => subtask.title),
    },
    editing.value,
  )
  busy.value = false
  if (saved) dialog.value?.close()
  else error.value = 'המשימה לא נשמרה. כדאי לנסות שוב.'
}

defineExpose({ open })
</script>

<template>
  <dialog ref="dialog" class="dialog" aria-labelledby="task-dialog-title">
    <h2 id="task-dialog-title">{{ editing ? 'עריכת משימה' : 'משימה חדשה' }}<span class="dot">.</span></h2>
    <form class="form" @submit.prevent="submit">
      <label class="field">
        <span>כותרת</span>
        <input v-model="title" type="text" required />
      </label>
      <label class="field">
        <span>הערות</span>
        <textarea v-model="notes" rows="3"></textarea>
      </label>
      <div class="row">
        <label class="field">
          <span>סטטוס</span>
          <select v-model="status">
            <option v-for="option in statusOptions" :key="option" :value="option">{{ STATUS_LABELS[option] }}</option>
          </select>
        </label>
        <label class="field">
          <span>תאריך יעד (לא חובה)</span>
          <input v-model="dueDate" type="date" />
        </label>
      </div>

      <fieldset class="subtasks">
        <legend>תתי-משימות</legend>
        <div v-for="subtask in subtasks" :key="subtask.id" class="subtask">
          <input v-model="subtask.done" type="checkbox" :aria-label="`סימון ${subtask.title || 'תת-משימה'} כהושלמה`" />
          <input v-model="subtask.title" class="subtask-title" type="text" aria-label="כותרת תת-משימה" />
          <button class="btn icon-btn" type="button" :aria-label="`הסרת ${subtask.title || 'תת-משימה'}`" @click="removeSubtask(subtask.id)">
            <AppIcon name="x" />
          </button>
        </div>
        <button class="btn add-subtask" type="button" @click="addSubtask">
          <AppIcon name="plus" :size="16" />
          הוספת תת-משימה
        </button>
      </fieldset>

      <p v-if="error" class="form-error" role="alert">{{ error }}</p>
      <div class="actions">
        <button class="btn primary" type="submit" :disabled="busy">{{ busy ? 'שומרים…' : 'שמירה' }}</button>
        <button class="btn" type="button" @click="dialog?.close()">ביטול</button>
      </div>
    </form>
  </dialog>
</template>

<style scoped>
.dialog {
  width: min(560px, calc(100vw - 32px));
  max-height: calc(100dvh - 32px);
  padding: 24px;
  box-sizing: border-box;
  border: none;
  border-radius: 10px;
  background: var(--card);
  color: var(--ink);
  box-shadow: var(--shadow-hover);
}
.dialog::backdrop { background: rgba(18, 39, 54, 0.45); }
h2 { margin: 0 0 20px; color: var(--navy); font-size: 22px; font-weight: 700; }
.row { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.subtasks { display: flex; flex-direction: column; gap: 8px; min-width: 0; margin: 0; padding: 0; border: none; }
legend { margin-bottom: 6px; padding: 0; color: var(--navy); font-size: 15px; font-weight: 500; }
.subtask { display: flex; align-items: center; gap: 8px; }
.subtask input[type="checkbox"] { flex: none; width: 18px; height: 18px; margin: 0; accent-color: var(--cta); }
.subtask-title {
  flex: 1;
  min-width: 0;
  min-height: 44px;
  padding-inline: 12px;
  border: 1px solid rgba(18, 39, 54, 0.24);
  border-radius: 10px;
  background: var(--card);
  color: var(--ink);
  font: inherit;
}
.subtask-title:focus-visible { outline: 2px solid var(--blue); outline-offset: 1px; border-color: transparent; }
.subtask .icon-btn { flex: none; }
.add-subtask { align-self: flex-start; }
.actions { display: flex; gap: 8px; }
.actions .primary { flex: 1; }

@media (max-width: 480px) {
  .row { grid-template-columns: minmax(0, 1fr); }
}
</style>
