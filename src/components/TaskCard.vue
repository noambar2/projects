<script setup lang="ts">
import { computed, ref } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import { mockups } from '@/data/projects'
import { LIST_STATUSES, STATUS_LABELS, type Task, type TaskStatus } from '@/composables/useTasks'

const props = defineProps<{
  task: Task
  /** 'sheet' shows everything about one task, for the details sheet on phones. */
  mode: 'board' | 'list' | 'sheet'
  /** What a list row keeps on a phone besides its title: its notes (swipe to delete),
      priority arrows, or the status. Everything else is a tap away, in the details sheet. */
  phoneShow?: 'summary' | 'order' | 'status'
  reorderable?: boolean
  canMoveUp?: boolean
  canMoveDown?: boolean
}>()

const emit = defineEmits<{
  open: []
  edit: []
  delete: []
  move: [direction: 'up' | 'down']
  status: [status: TaskStatus]
  toggleSubtask: [id: string]
}>()

const isDone = computed(() => props.task.status === 'done')
const mockupFitsPhones = computed(
  () => mockups.find((mockup) => mockup.url === props.task.mockup_url)?.device === 'mobile',
)
const showControls = computed(() => isDone.value || props.mode !== 'board' || !!props.task.mockup_url)
const doneCount = computed(() => props.task.subtasks.filter((subtask) => subtask.done).length)
// In the list, subtasks fold away behind an arrow next to the title, so rows keep one height.
const listSubtasks = computed(() => props.mode === 'list' && props.task.subtasks.length > 0)
const subtasksOpen = ref(false)
const showSubtaskList = computed(
  () => (listSubtasks.value && subtasksOpen.value) || (props.mode === 'sheet' && props.task.subtasks.length > 0),
)

// On a phone a list row is only a summary, so tapping it (anywhere but its own controls) opens the details.
const phoneQuery = window.matchMedia('(max-width: 720px)')
function onCardClick(event: MouseEvent) {
  if (props.mode !== 'list' || !phoneQuery.matches) return
  if (justSwiped) {
    justSwiped = false
    return
  }
  if ((event.target as HTMLElement).closest('button, a, select, label, input')) return
  // A tap on a row whose delete button is showing just puts the row back.
  if (reveal.value > 0) {
    reveal.value = 0
    return
  }
  emit('open')
}

// Swipe to delete, as in Apple's Clock app. In right-to-left the row slides right
// and the delete button grows in from the left edge.
const DELETE_WIDTH = 88
const reveal = ref(0)
const swiping = ref(false)
let startX = 0
let startY = 0
let startReveal = 0
let tracking = false
let justSwiped = false

const canSwipe = computed(() => props.mode === 'list' && (props.phoneShow ?? 'summary') === 'summary')

function onTouchStart(event: TouchEvent) {
  if (!canSwipe.value || !phoneQuery.matches || event.touches.length !== 1) return
  startX = event.touches[0].clientX
  startY = event.touches[0].clientY
  startReveal = reveal.value
  tracking = true
  swiping.value = false
}

function onTouchMove(event: TouchEvent) {
  if (!tracking) return
  const dx = event.touches[0].clientX - startX
  const dy = event.touches[0].clientY - startY
  if (!swiping.value) {
    if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) {
      tracking = false // The page is scrolling.
      return
    }
    if (Math.abs(dx) < 10) return
    swiping.value = true
  }
  reveal.value = Math.min(Math.max(startReveal + dx, 0), DELETE_WIDTH * 1.5)
}

function onTouchEnd() {
  if (!tracking) return
  tracking = false
  if (!swiping.value) return
  swiping.value = false
  justSwiped = true
  window.setTimeout(() => (justSwiped = false), 400)
  reveal.value = reveal.value > DELETE_WIDTH / 2 ? DELETE_WIDTH : 0
}

function deleteFromSwipe() {
  reveal.value = 0
  emit('delete')
}

const dayMonth = new Intl.DateTimeFormat('he-IL', { day: 'numeric', month: 'numeric' })
const fullDate = new Intl.DateTimeFormat('he-IL', { day: 'numeric', month: 'numeric', year: 'numeric' })

const dueLabel = computed(() => {
  if (!props.task.due_date) return ''
  const [year, month, day] = props.task.due_date.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return (year === new Date().getFullYear() ? dayMonth : fullDate).format(date)
})

// Like the due date, the year shows only when it isn't this year.
const completedLabel = computed(() => {
  if (!props.task.completed_at) return ''
  const date = new Date(props.task.completed_at)
  return (date.getFullYear() === new Date().getFullYear() ? dayMonth : fullDate).format(date)
})

const overdue = computed(() => {
  const today = new Date().toLocaleDateString('en-CA') // YYYY-MM-DD in local time
  return !!props.task.due_date && !isDone.value && props.task.due_date < today
})
</script>

<template>
  <article
    class="card"
    :class="[`status-${task.status}`, `mode-${mode}`, mode === 'list' ? `phone-${phoneShow ?? 'summary'}` : '', { done: isDone, flush: !reorderable, swiping }]"
    :style="canSwipe ? { '--reveal': `${reveal}px` } : undefined"
    :data-task-id="task.id"
    :draggable="mode === 'board'"
    @click="onCardClick"
    @touchstart="onTouchStart"
    @touchmove="onTouchMove"
    @touchend="onTouchEnd"
    @touchcancel="onTouchEnd"
  >
    <div class="head">
      <div class="title">
        <button
          v-if="listSubtasks"
          class="subtask-toggle"
          type="button"
          :aria-expanded="subtasksOpen"
          :aria-label="`תתי-משימות: ${doneCount} מתוך ${task.subtasks.length} הושלמו`"
          @click="subtasksOpen = !subtasksOpen"
        >
          <AppIcon name="chevron-down" :size="16" />
        </button>
        <h3>{{ task.title }}</h3>
        <span v-if="listSubtasks" class="subtask-count" aria-hidden="true">{{ doneCount }}/{{ task.subtasks.length }}</span>
      </div>
      <div class="tools">
        <a
          v-if="mode === 'sheet' && task.mockup_url"
          class="btn tool mockup-tool"
          :href="task.mockup_url"
          target="_blank"
          rel="noopener"
          aria-label="מעבר למוקאפ"
          title="מעבר למוקאפ"
        >
          <AppIcon name="mockup" :size="16" />
        </a>
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
      הושלם<template v-if="completedLabel"> ב-{{ completedLabel }}</template>
    </div>
    <div v-if="task.due_date" class="dates">
      <span class="due" :class="{ overdue }">
        <AppIcon name="target" :size="14" />
        ת. יעד {{ dueLabel }}
      </span>
    </div>

    <div v-if="showSubtaskList" class="subtasks">
      <p v-if="mode === 'sheet'" class="progress-label">
        <span>תתי-משימות</span>
        <span>{{ doneCount }}/{{ task.subtasks.length }}</span>
      </p>
      <ul>
        <li v-for="subtask in task.subtasks" :key="subtask.id">
          <label>
            <input type="checkbox" :checked="subtask.done" @change="$emit('toggleSubtask', subtask.id)" />
            <span :class="{ checked: subtask.done }">{{ subtask.title }}</span>
          </label>
        </li>
      </ul>
    </div>
    <details v-else-if="task.subtasks.length && mode === 'board'" class="subtasks">
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

    <div v-if="showControls" class="controls">
      <button v-if="isDone" class="btn undo" type="button" aria-label="החזרה ללא התחיל" title="החזרה ללא התחיל" @click="$emit('status', 'todo')">
        <AppIcon name="undo" :size="16" />
        <span class="undo-label">פתיחה מחדש</span>
      </button>

      <template v-else-if="mode !== 'board'">
        <div v-if="reorderable" class="order">
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
      </template>

      <a
        v-if="task.mockup_url"
        class="btn mockup-link"
        :class="{ 'desktop-only': !mockupFitsPhones }"
        :href="task.mockup_url"
        target="_blank"
        rel="noopener"
        draggable="false"
        aria-label="מעבר למוקאפ"
      >
        <AppIcon name="mockup" :size="16" />
        <span class="mockup-label">מעבר למוקאפ</span>
      </a>
    </div>

    <button
      v-if="canSwipe"
      class="swipe-delete"
      type="button"
      :tabindex="reveal > 0 ? 0 : -1"
      :aria-hidden="reveal === 0"
      @click.stop="deleteFromSwipe"
    >
      <AppIcon name="trash" :size="16" />
      מחיקה
    </button>
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
  border: 1px solid rgba(var(--ink-rgb), 0.08);
  border-radius: var(--radius);
  box-shadow: 0 2px 8px rgba(var(--ink-rgb), 0.06);
}
.card[draggable="true"] { cursor: grab; }
.card[draggable="true"]:active { cursor: grabbing; }

/* Done tasks recede: see-through and flat. Text stays readable and buttons stay solid. */
.card.done { background: var(--card-faded); box-shadow: none; }
.card.done h3 { color: var(--muted); font-weight: 400; }

.head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
h3 { margin: 0; color: var(--navy); font-size: 16px; font-weight: 500; line-height: 1.4; overflow-wrap: anywhere; }
.tools { display: flex; flex: none; gap: 4px; }

.title { display: flex; align-items: center; gap: 6px; min-width: 0; }
.subtask-toggle {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
}
.subtask-toggle:hover { background: rgba(var(--ink-rgb), 0.07); color: var(--navy); }
.subtask-toggle:focus-visible { outline: 2px solid var(--blue); outline-offset: 1px; }
/* Closed, the arrow points along the reading direction; open, it points down. */
.subtask-toggle svg { transform: rotate(-90deg); transition: transform 0.15s ease; }
.subtask-toggle[aria-expanded="true"] svg { transform: none; }
.subtask-count { flex: none; color: var(--muted); font-size: 12px; font-variant-numeric: tabular-nums; }
/* Open subtasks line up with the title, past the arrow. */
.mode-list .subtasks { padding-inline-start: 30px; }
.mode-list .subtasks ul { margin-top: 4px; }
.tool {
  width: 32px;
  min-height: 32px;
  padding: 0;
  border-color: rgba(var(--ink-rgb), 0.14);
  border-radius: 8px;
  color: var(--muted);
}

.notes { margin: 0; color: var(--muted); font-size: 14px; white-space: pre-wrap; overflow-wrap: anywhere; }
.clamp { display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 3; line-clamp: 3; overflow: hidden; }

.dates { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; font-size: 13px; }
.due {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-height: 32px;
  padding-inline: 10px;
  box-sizing: border-box;
  border-radius: 8px;
  background: rgba(var(--ink-rgb), 0.07);
  color: var(--muted);
}
.due.overdue { background: rgba(180, 35, 24, 0.1); color: var(--danger); font-weight: 500; }
.completed { display: flex; align-items: center; gap: 6px; color: var(--green-text); font-size: 13px; font-weight: 500; }
.completed svg, .due svg { flex: none; } /* Long dates must not squeeze the icons. */

.mockup-link {
  flex: none;
  box-sizing: border-box;
  min-height: 32px;
  padding-inline: 10px;
  border-color: transparent;
  border-radius: 8px;
  background: var(--blue-tint);
  color: var(--blue-text);
  font-size: 13px;
  text-decoration: none;
  white-space: nowrap;
}
.mockup-link:hover { border-color: var(--blue); }

.subtasks summary { display: block; cursor: pointer; list-style: none; }
.subtasks summary::-webkit-details-marker { display: none; }
.subtasks summary:focus-visible { outline: 2px solid var(--blue); outline-offset: 2px; border-radius: 4px; }
.progress-label { display: flex; justify-content: space-between; margin-bottom: 6px; color: var(--navy); font-size: 13px; font-weight: 500; }
.segments { display: flex; gap: 4px; }
.segments span { flex: 1; height: 4px; border-radius: 2px; background: rgba(var(--ink-rgb), 0.12); }
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
  border: 1px solid rgba(var(--ink-rgb), 0.24);
  border-radius: var(--radius);
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

/* List: each task is one row of a table. The section's list draws the frame and the rows
   draw the dividers. Dates and links read as plain text, and row buttons stay quiet. */
.card.mode-list {
  gap: 2px 12px;
  min-height: 44px;
  padding: 6px 12px;
  border: none;
  border-bottom: 1px solid rgba(var(--ink-rgb), 0.08);
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}
.card.mode-list:last-child { border-bottom: none; }
.card.mode-list:hover { background: rgba(var(--ink-rgb), 0.03); }
.mode-list h3 { font-size: 14px; }
.mode-list .notes {
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.mode-list .subtasks { margin-block: 2px 4px; }
.mode-list.done .dates { display: none; } /* For done tasks the completion date says more. */
.mode-list .dates, .mode-list .completed { white-space: nowrap; }
.mode-list .due { min-height: 0; padding: 0; background: none; font-size: 13px; }
.mode-list .due.overdue { background: none; }
.mode-list .completed { font-size: 13px; }

/* Row buttons have no frame until the pointer is on them.
   .card raises these above the shared list-control rules further down. */
.card.mode-list .tool,
.card.mode-list .order .btn,
.card.mode-list .mockup-link,
.card.mode-list .undo {
  width: 32px;
  min-height: 32px;
  padding: 0;
  border-color: transparent;
  background: transparent;
  color: var(--muted);
}
.card.mode-list .mockup-link { color: var(--blue-text); }
.card.mode-list .tool:hover,
.card.mode-list .order .btn:hover:not(:disabled),
.card.mode-list .mockup-link:hover,
.card.mode-list .undo:hover { border-color: transparent; background: rgba(var(--ink-rgb), 0.07); }
.mode-list .mockup-label { display: none; }
/* Undo keeps its words: a lone arrow doesn't say what it does. */
.card.mode-list .undo { width: auto; gap: 6px; padding-inline: 8px; font-size: 13px; }
.card.mode-list .status-select { border-color: transparent; }
.card.mode-list .status-select:hover { border-color: rgba(var(--ink-rgb), 0.14); }

/* Edit and delete stay in view but faint, and come forward on the row being pointed at
   or worked in, so their spot never looks empty. */
.mode-list .tools { gap: 0; opacity: 0.45; transition: opacity 0.15s ease; }
.mode-list:hover .tools,
.mode-list:focus-within .tools { opacity: 1; }
@media (hover: none) {
  .mode-list .tools { opacity: 0.7; }
}

/* Wider than a phone: one line per task, with fixed column widths that keep dates, mockups
   and statuses lined up from row to row. Notes and subtasks sit on a second line. */
@media (min-width: 721px) {
  .mode-list {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) 32px 132px 124px 68px;
    align-items: center;
  }
  .mode-list .head { display: contents; }
  .mode-list .controls { display: contents; }
  .mode-list .order { grid-column: 1; grid-row: 1; gap: 0; }
  .mode-list .title { grid-column: 2; grid-row: 1; }
  .mode-list .mockup-link { grid-column: 3; grid-row: 1; }
  .mode-list .dates,
  .mode-list .completed { grid-column: 4; grid-row: 1; }
  .mode-list .status-select,
  .mode-list .undo { grid-column: 5; grid-row: 1; }
  .card.mode-list .undo { justify-self: start; }
  .card.mode-list .status-select { width: 124px; }
  .mode-list .tools { grid-column: 6; grid-row: 1; justify-content: flex-end; }
  .mode-list .notes,
  .mode-list .subtasks { grid-column: 2 / 5; }

  /* Without arrows, the content starts at the edge. */
  .mode-list.flush .title { grid-column: 1 / 3; }
  .mode-list.flush .notes,
  .mode-list.flush .subtasks { grid-column: 1 / 5; }
}

/* Phones: a short row per task, holding the title and only what the tab is for (see phoneShow).
   Tapping the row opens the rest in the details sheet. */
.swipe-delete { display: none; }
@media (max-width: 720px) {
  .card.mode-list { flex-direction: row; flex-wrap: wrap; align-items: center; gap: 2px 8px; padding: 8px 12px; cursor: pointer; }
  .mode-list .head { flex: 1 1 0; min-width: 0; }
  .mode-list .title { flex: 1 1 0; }
  .mode-list h3 { font-size: 15px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .mode-list .controls { display: contents; }
  .mode-list .tools,
  .mode-list .subtask-toggle,
  .mode-list .subtask-count,
  .mode-list .notes,
  .mode-list .subtasks,
  .mode-list .dates,
  .mode-list .completed,
  .mode-list .mockup-link,
  .mode-list .undo,
  .mode-list .status-select,
  .mode-list .order { display: none; }

  /* The list tab: title and notes. Swiping the row reveals a delete button. */
  .phone-summary { position: relative; overflow: hidden; touch-action: pan-y; }
  .phone-summary .notes { display: block; flex: 1 0 100%; order: 1; }
  /* A done task keeps "reopen" on its row, next to the title. */
  .card.phone-summary .undo { display: inline-flex; flex: none; }
  .phone-summary > :not(.swipe-delete) { transform: translateX(var(--reveal, 0px)); transition: transform 0.2s ease; }
  .phone-summary .swipe-delete {
    position: absolute;
    inset-block: 0;
    inset-inline-end: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    width: var(--reveal, 0px);
    padding: 0;
    overflow: hidden;
    border: none;
    background: var(--danger);
    color: #ffffff;
    font: inherit;
    font-size: 14px;
    font-weight: 500;
    white-space: nowrap;
    cursor: pointer;
    transition: width 0.2s ease;
  }
  .phone-summary.swiping > *,
  .phone-summary.swiping .swipe-delete { transition: none; }

  /* Priority: arrows before the title, as on wider screens. */
  .phone-order .order { display: flex; order: -1; gap: 0; }
  /* Backlog: the status is the row's one action. */
  .phone-status .status-select { display: flex; flex: none; }
}

/* The details sheet: the title with its buttons, the notes, the subtasks, and last a line
   with the due date at the start and the status at the end. */
.card.mode-sheet {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 16px 12px;
  padding: 0;
  border: none;
  background: transparent;
  box-shadow: none;
}
.mode-sheet .head,
.mode-sheet .notes,
.mode-sheet .subtasks { grid-column: 1 / -1; }
.mode-sheet .notes { order: 1; }
.mode-sheet .subtasks { order: 2; }
.mode-sheet .dates,
.mode-sheet .completed { order: 3; grid-column: 1; }
.mode-sheet .controls { order: 4; grid-column: 2; }
.mode-sheet.done .dates { display: none; } /* As in the list, the completion date says more. */
/* The mockup opens from the icon next to edit and delete, even for desktop-only mockups:
   on the phone it's the person's choice to look. */
.mode-sheet .controls .mockup-link { display: none; }
.card.mode-sheet .mockup-tool { color: var(--blue-text); }
.mode-sheet h3 { font-size: 18px; }
.mode-sheet .progress-label { margin: 0; }
.mode-sheet .subtasks ul { margin-top: 8px; }
.mode-sheet .controls { justify-content: flex-start; }
/* The status looks as it does on a backlog row: small and without a frame. */
.card.mode-sheet .status-select {
  flex: none;
  min-height: 32px;
  padding-inline: 8px;
  border-color: transparent;
  border-radius: 8px;
}
.mode-sheet .status-select select { min-height: 30px; }

/* Board cards share the list's quiet look: a hairline frame, plain-text dates and links,
   and edit and delete floating over the corner of the card being pointed at. */
.card.mode-board {
  position: relative;
  gap: 8px;
  padding: 12px;
  border-color: rgba(var(--ink-rgb), 0.1);
  box-shadow: 0 1px 3px rgba(var(--ink-rgb), 0.05);
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
.card.mode-board:hover { border-color: rgba(var(--ink-rgb), 0.18); box-shadow: 0 4px 12px rgba(var(--ink-rgb), 0.08); }
.card.mode-board.done:hover { box-shadow: none; }
.mode-board h3 { font-size: 14px; }
.mode-board .notes { font-size: 13px; }

.mode-board .tools {
  position: absolute;
  inset-block-start: 6px;
  inset-inline-end: 6px;
  gap: 2px;
  padding: 2px;
  border-radius: 8px;
  background: var(--card);
  box-shadow: 0 1px 4px rgba(var(--ink-rgb), 0.12);
  opacity: 0;
  transition: opacity 0.15s ease;
}
.mode-board:hover .tools,
.mode-board:focus-within .tools { opacity: 1; }
.card.mode-board .tool { width: 28px; min-height: 28px; border-color: transparent; }
.card.mode-board .tool:hover { border-color: transparent; background: rgba(var(--ink-rgb), 0.07); color: var(--navy); }

.mode-board .due { min-height: 0; padding: 0; background: none; font-size: 13px; }
.mode-board .due.overdue { background: none; }
.mode-board.done .dates { display: none; } /* As in the list, the completion date says more. */
.mode-board .controls { justify-content: flex-start; gap: 4px 12px; }
.card.mode-board .mockup-link,
.card.mode-board .undo {
  min-height: 0;
  padding: 0;
  border: none;
  background: none;
  font-size: 13px;
}
.card.mode-board .undo { color: var(--muted); }
.card.mode-board .mockup-link:hover,
.card.mode-board .undo:hover { text-decoration: underline; }
.mode-board .progress-label { color: var(--muted); font-weight: 400; }

/* List controls match the edit and delete buttons. */
.mode-list .controls { justify-content: flex-start; }
.mode-list .order .btn {
  width: 32px;
  min-height: 32px;
  border-color: rgba(var(--ink-rgb), 0.14);
  border-radius: 8px;
  color: var(--muted);
}
.mode-list .order .btn:disabled { opacity: 0.4; }
.mode-list .status-select {
  flex: 0 1 124px;
  min-width: 0;
  min-height: 32px;
  padding-inline: 8px;
  border-color: rgba(var(--ink-rgb), 0.14);
  border-radius: 8px;
}
.mode-list .status-select select { min-height: 30px; }
.undo {
  min-height: 32px;
  padding-inline: 10px;
  border-color: rgba(var(--ink-rgb), 0.14);
  border-radius: 8px;
  font-size: 13px;
}

/* iOS zooms in on selects under 16px, so only mouse users get the smaller text. */
@media (pointer: fine) {
  .mode-list .status-select select { font-size: 13px; }
}
@media (pointer: coarse) {
  .mode-list .status-select { flex-basis: 140px; }
}

/* Most mockups are built for desktop, so phones and tablets don't offer them. */
@media (max-width: 900px), (pointer: coarse) {
  .mockup-link.desktop-only { display: none; }
}

</style>
