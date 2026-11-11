<script setup lang="ts">
import { computed, ref } from 'vue'
import AppDialog from '@/components/AppDialog.vue'
import AppIcon from '@/components/AppIcon.vue'
import { mockups } from '@/data/projects'
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

const dialog = ref<InstanceType<typeof AppDialog>>()
const titleInput = ref<HTMLInputElement>()
const editing = ref<Task | null>(null)
const title = ref('')
const notes = ref('')
const status = ref<TaskStatus>('todo')
const dueDate = ref('')
const subtasks = ref<Subtask[]>([])
const mockupUrl = ref('')
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
  mockupUrl.value = task?.mockup_url ?? ''
  subtasks.value = (task?.subtasks ?? []).map((subtask) => ({ ...subtask }))
  error.value = ''
  dialog.value?.open()
  // A phone's keyboard would cover the sheet, so only mouse users start in the field.
  if (!task && matchMedia('(pointer: fine)').matches) titleInput.value?.focus()
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
      mockup_url: mockupUrl.value || null,
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
  <AppDialog ref="dialog" :title="editing ? 'עריכת משימה' : 'משימה חדשה'" :width="560">
    <form id="task-form" class="form" @submit.prevent="submit">
      <label class="field">
        <span>כותרת</span>
        <input ref="titleInput" v-model="title" type="text" required />
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

      <label class="field">
        <span>קישור למוקאפ (לא חובה)</span>
        <select v-model="mockupUrl">
          <option value="">ללא</option>
          <option v-for="mockup in mockups" :key="mockup.url" :value="mockup.url">{{ mockup.title }}</option>
        </select>
      </label>

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
    </form>

    <template #footer>
      <button class="btn" type="button" @click="dialog?.close()">ביטול</button>
      <button class="btn primary save" type="submit" form="task-form" :disabled="busy">{{ busy ? 'שומרים…' : 'שמירה' }}</button>
    </template>
  </AppDialog>
</template>

<style scoped>
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
  border: 1px solid rgba(var(--ink-rgb), 0.24);
  border-radius: var(--radius);
  background: var(--card);
  color: var(--ink);
  font: inherit;
}
.subtask-title:focus-visible { outline: 2px solid var(--blue); outline-offset: 1px; border-color: transparent; }
.subtask .icon-btn { flex: none; }
.add-subtask { align-self: flex-start; }
.save { flex: 1; }

@media (max-width: 480px) {
  .row { grid-template-columns: minmax(0, 1fr); }
}
</style>
