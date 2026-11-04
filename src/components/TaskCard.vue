<script setup lang="ts">
import { computed } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import { LIST_STATUSES, STATUS_LABELS, type Task, type TaskStatus } from '@/composables/useTasks'

const props = defineProps<{
  task: Task
  mode: 'board' | 'list'
  canMoveUp?: boolean
  canMoveDown?: boolean
}>()

defineEmits<{
  edit: []
  delete: []
  move: [direction: 'up' | 'down']
  status: [status: TaskStatus]
  toggleSubtask: [id: string]
}>()

const isDone = computed(() => props.task.status === 'done')
const doneCount = computed(() => props.task.subtasks.filter((subtask) => subtask.done).length)

const dayMonth = new Intl.DateTimeFormat('he-IL', { day: 'numeric', month: 'numeric' })
const fullDate = new Intl.DateTimeFormat('he-IL', { day: 'numeric', month: 'numeric', year: 'numeric' })

const dueLabel = computed(() => {
  if (!props.task.due_date) return ''
  const [year, month, day] = props.task.due_date.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return (year === new Date().getFullYear() ? dayMonth : fullDate).format(date)
})

const overdue = computed(() => {
  const today = new Date().toLocaleDateString('en-CA') // YYYY-MM-DD in local time
  return !!props.task.due_date && !isDone.value && props.task.due_date < today
})
</script>

<template>
  <article
    class="card"
    :class="[`status-${task.status}`, `mode-${mode}`, { done: isDone }]"
    :data-task-id="task.id"
    :draggable="mode === 'board'"
  >
    <div class="head">
      <h3>{{ task.title }}</h3>
      <div class="tools">
        <button class="btn tool" type="button" :aria-label="`עריכת ${task.title}`" @click="$emit('edit')">
          <AppIcon name="pencil" :size="16" />
        </button>
        <button class="btn tool" type="button" :aria-label="`מחיקת ${task.title}`" @click="$emit('delete')">
          <AppIcon name="trash" :size="16" />
        </button>
      </div>
    </div>

    <p v-if="task.notes" class="notes" :class="{ clamp: mode === 'board' }">{{ task.notes }}</p>

    <div v-if="isDone" class="completed">
      <AppIcon name="check" :size="16" />
      הושלם<template v-if="task.completed_at"> ב-{{ fullDate.format(new Date(task.completed_at)) }}</template>
    </div>
    <div v-if="task.due_date" class="dates">
      <span class="due" :class="{ overdue }">יעד {{ dueLabel }}</span>
    </div>

    <details v-if="task.subtasks.length" class="subtasks">
      <summary>
        <span class="progress-label">
          <span>תתי-משימות</span>
          <span>{{ doneCount }}/{{ task.subtasks.length }}</span>
        </span>
        <span class="segments" aria-hidden="true">
          <span v-for="(subtask, index) in task.subtasks" :key="subtask.id" :class="{ filled: index < doneCount }"></span>
        </span>
      </summary>
      <ul>
        <li v-for="subtask in task.subtasks" :key="subtask.id">
          <label>
            <input type="checkbox" :checked="subtask.done" @change="$emit('toggleSubtask', subtask.id)" />
            <span :class="{ checked: subtask.done }">{{ subtask.title }}</span>
          </label>
        </li>
      </ul>
    </details>

    <button v-if="isDone" class="btn undo" type="button" @click="$emit('status', 'todo')">
      <AppIcon name="undo" :size="16" />
      החזרה ללא התחיל
    </button>

    <div v-else-if="mode === 'list'" class="controls">
      <div class="order">
        <button class="btn icon-btn" type="button" :disabled="!canMoveUp" aria-label="העברה למעלה" @click="$emit('move', 'up')">
          <AppIcon name="arrow-up" />
        </button>
        <button class="btn icon-btn" type="button" :disabled="!canMoveDown" aria-label="העברה למטה" @click="$emit('move', 'down')">
          <AppIcon name="arrow-down" />
        </button>
      </div>
      <label class="status-select">
        <span class="status-dot"></span>
        <span class="sr-only">סטטוס</span>
        <select :value="task.status" @change="$emit('status', ($event.target as HTMLSelectElement).value as TaskStatus)">
          <option v-for="status in LIST_STATUSES" :key="status" :value="status">{{ STATUS_LABELS[status] }}</option>
        </select>
      </label>
    </div>
  </article>
</template>

<style scoped>
.card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  box-sizing: border-box;
  background: var(--card);
  border: 1px solid rgba(18, 39, 54, 0.08);
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(18, 39, 54, 0.06);
}
.card[draggable="true"] { cursor: grab; }
.card[draggable="true"]:active { cursor: grabbing; }

/* Done tasks recede: see-through and flat. Text stays readable and buttons stay solid. */
.card.done { background: rgba(255, 255, 255, 0.5); box-shadow: none; }
.card.done h3 { color: var(--muted); font-weight: 500; }

.head { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; }
h3 { margin: 0; color: var(--navy); font-size: 16px; font-weight: 700; line-height: 1.4; overflow-wrap: anywhere; }
.tools { display: flex; flex: none; gap: 4px; }
.tool {
  width: 32px;
  min-height: 32px;
  padding: 0;
  border-color: rgba(18, 39, 54, 0.14);
  border-radius: 8px;
  color: var(--muted);
}
@media (pointer: coarse) {
  .tool { width: 44px; min-height: 44px; border-radius: 10px; }
}

.notes { margin: 0; color: var(--muted); font-size: 14px; white-space: pre-wrap; overflow-wrap: anywhere; }
.clamp { display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 3; line-clamp: 3; overflow: hidden; }

.dates { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; font-size: 13px; }
.due { padding: 1px 8px; border-radius: 6px; background: rgba(18, 39, 54, 0.07); color: var(--muted); }
.due.overdue { background: rgba(180, 35, 24, 0.1); color: #b42318; font-weight: 500; }
.completed { display: flex; align-items: center; gap: 6px; color: var(--green-text); font-size: 13px; font-weight: 500; }

.subtasks summary { display: block; cursor: pointer; list-style: none; }
.subtasks summary::-webkit-details-marker { display: none; }
.subtasks summary:focus-visible { outline: 2px solid var(--blue); outline-offset: 2px; border-radius: 4px; }
.progress-label { display: flex; justify-content: space-between; margin-bottom: 6px; color: var(--navy); font-size: 13px; font-weight: 500; }
.segments { display: flex; gap: 4px; }
.segments span { flex: 1; height: 4px; border-radius: 2px; background: rgba(18, 39, 54, 0.12); }
.segments .filled { background: var(--status); }
.subtasks ul { display: flex; flex-direction: column; gap: 8px; margin: 12px 0 0; padding: 0; list-style: none; }
.subtasks label { display: flex; align-items: flex-start; gap: 8px; color: var(--ink); font-size: 14px; cursor: pointer; }
.subtasks input { flex: none; width: 18px; height: 18px; margin: 2px 0 0; accent-color: var(--cta); }
.subtasks .checked { color: var(--muted); text-decoration: line-through; }

.undo { align-self: flex-start; }

.controls { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px; }
.status-select {
  display: flex;
  flex: 1 1 160px;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  padding-inline: 12px;
  box-sizing: border-box;
  border: 1px solid rgba(18, 39, 54, 0.24);
  border-radius: 10px;
}
.status-select:focus-within { outline: 2px solid var(--blue); outline-offset: 1px; }
.status-select select {
  flex: 1;
  min-width: 0;
  min-height: 42px;
  border: none;
  outline: none;
  background: transparent;
  color: var(--navy);
  font: inherit;
  font-size: 16px;
  font-weight: 500;
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
.order { display: flex; gap: 8px; }

/* Desktop list: one compact row of priority arrows, title, dates and same-sized controls.
   Anything longer wraps below, lined up with the title. */
@media (min-width: 901px) and (pointer: fine) {
  .mode-list {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) repeat(4, auto);
    align-items: center;
    gap: 6px 8px;
    padding: 8px 12px;
  }
  .mode-list .head { display: contents; }
  .mode-list .controls { display: contents; }
  .mode-list .order { grid-column: 1; grid-row: 1; gap: 4px; }
  .mode-list h3 { grid-column: 2; grid-row: 1; font-size: 15px; }
  .mode-list .completed { grid-column: 3; grid-row: 1; white-space: nowrap; }
  .mode-list .dates { grid-column: 4; grid-row: 1; white-space: nowrap; }
  .mode-list .status-select,
  .mode-list .undo { grid-column: 5; grid-row: 1; }
  .mode-list .tools { grid-column: 6; grid-row: 1; }
  .mode-list .notes,
  .mode-list .subtasks { grid-column: 2 / -1; }
  .mode-list .notes { font-size: 13px; }

  /* Done tasks have no arrows, so their content starts at the edge. */
  .mode-list.done h3 { grid-column: 1 / 3; }
  .mode-list.done .notes,
  .mode-list.done .subtasks { grid-column: 1 / -1; }

  .mode-list .order .btn {
    width: 32px;
    min-height: 32px;
    border-color: rgba(18, 39, 54, 0.14);
    border-radius: 8px;
    color: var(--muted);
  }
  .mode-list .order .btn:disabled { opacity: 0.4; }
  .mode-list .status-select {
    flex: none;
    width: 124px;
    min-height: 32px;
    padding-inline: 8px;
    border-color: rgba(18, 39, 54, 0.14);
    border-radius: 8px;
  }
  .mode-list .status-select select { min-height: 30px; font-size: 13px; }
  .mode-list .undo {
    min-height: 32px;
    padding-inline: 10px;
    border-color: rgba(18, 39, 54, 0.14);
    border-radius: 8px;
    font-size: 13px;
  }
}
</style>
