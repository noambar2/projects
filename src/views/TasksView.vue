<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { RouterLink } from 'vue-router'
import AppDialog from '@/components/AppDialog.vue'
import AppIcon from '@/components/AppIcon.vue'
import BoardColumn from '@/components/BoardColumn.vue'
import DeleteTaskDialog from '@/components/DeleteTaskDialog.vue'
import TaskCard from '@/components/TaskCard.vue'
import TaskDialog from '@/components/TaskDialog.vue'
import { session, signOut, useRedirectWhenSignedOut } from '@/composables/useAuth'
import {
  BOARD_STATUSES,
  LIST_SECTIONS,
  STATUS_LABELS,
  useTasks,
  type EditableTaskFields,
  type Task,
  type TaskStatus,
} from '@/composables/useTasks'

type View = 'board' | 'list' | 'priority' | 'backlog' | 'completed'

const VIEW_STORAGE_KEY = 'tasks:view'

useRedirectWhenSignedOut()

const {
  byStatus,
  priorityActive,
  olderDone,
  loading,
  loadFailed,
  actionError,
  liveConnected,
  load,
  addTask,
  updateTask,
  deleteTask,
  saveEdit,
  setStatus,
  moveTask,
} = useTasks()

const deleteDialog = ref<InstanceType<typeof DeleteTaskDialog>>()
const signOutDialog = ref<InstanceType<typeof AppDialog>>()
const taskDialog = ref<InstanceType<typeof TaskDialog>>()
const detailsDialog = ref<InstanceType<typeof AppDialog>>()
const email = computed(() => session.value?.user.email ?? '')

// The board needs a mouse and room for four columns, so phones and tablets get the list.
const listOnlyQuery = window.matchMedia('(max-width: 900px), (pointer: coarse)')
const listOnly = ref(listOnlyQuery.matches)
function onListOnlyChange(event: MediaQueryListEvent) {
  listOnly.value = event.matches
}
listOnlyQuery.addEventListener('change', onListOnlyChange)
onBeforeUnmount(() => listOnlyQuery.removeEventListener('change', onListOnlyChange))

const chosenView = ref<View>(readStoredView())
const view = computed<View>(() => (listOnly.value && chosenView.value === 'board' ? 'list' : chosenView.value))
const views = computed(() =>
  [
    { id: 'board' as const, label: 'לוח' },
    { id: 'list' as const, label: 'רשימה' },
    { id: 'priority' as const, label: 'תעדוף' },
    { id: 'backlog' as const, label: 'בקלוג' },
    { id: 'completed' as const, label: 'הושלמו' },
  ].filter((item) => !listOnly.value || item.id !== 'board'),
)

function readStoredView(): View {
  try {
    const stored = localStorage.getItem(VIEW_STORAGE_KEY)
    return stored === 'list' || stored === 'priority' || stored === 'backlog' || stored === 'completed'
      ? stored
      : 'board'
  } catch {
    return 'board'
  }
}

function chooseView(id: View) {
  chosenView.value = id
  try {
    localStorage.setItem(VIEW_STORAGE_KEY, id)
  } catch {
    // The choice just won't be remembered.
  }
}

const dragging = ref<Task | null>(null)

// The phone's details sheet follows the task by id, so live updates show in it.
const detailsId = ref<string | null>(null)
const detailsTask = computed(
  () => [...Object.values(byStatus.value).flat(), ...olderDone.value].find((task) => task.id === detailsId.value) ?? null,
)

function openDetails(task: Task) {
  detailsId.value = task.id
  detailsDialog.value?.open()
}

// Editing and deleting happen in their own dialogs, so the sheet steps aside first.
function editFromDetails(task: Task) {
  detailsDialog.value?.close()
  taskDialog.value?.open(task)
}

function deleteFromDetails(task: Task) {
  detailsDialog.value?.close()
  deleteDialog.value?.open(task)
}

function openNewTask(status?: TaskStatus) {
  taskDialog.value?.open(null, status ?? (view.value === 'backlog' ? 'backlog' : 'todo'))
}

function saveTask(fields: EditableTaskFields, task: Task | null): Promise<boolean> {
  return task ? saveEdit(task, fields) : addTask(fields)
}

function toggleSubtask(task: Task, subtaskId: string) {
  void updateTask(task.id, {
    subtasks: task.subtasks.map((subtask) =>
      subtask.id === subtaskId ? { ...subtask, done: !subtask.done } : subtask,
    ),
  })
}

function dropTask(status: TaskStatus) {
  if (dragging.value) setStatus(dragging.value, status)
  dragging.value = null
}
</script>

<template>
  <main class="page" :class="{ wide: view === 'board' }">
    <header class="top">
      <div class="heading">
        <h1>משימות<span class="dot">.</span></h1>
        <p dir="ltr" class="email">{{ email }}</p>
      </div>
      <div class="account">
        <RouterLink class="btn links-link" to="/" aria-label="אזור הקישורים" title="אזור הקישורים">
          <AppIcon name="link" :size="16" />
          <span class="links-text">אזור הקישורים</span>
        </RouterLink>
        <RouterLink class="btn icon-btn" to="/settings" aria-label="הגדרות" title="הגדרות">
          <AppIcon name="settings" :size="16" />
        </RouterLink>
        <button class="btn icon-btn" type="button" aria-label="התנתקות" title="התנתקות" @click="signOutDialog?.open()">
          <AppIcon class="logout" name="logout" :size="16" />
        </button>
      </div>
    </header>

    <div class="toolbar">
      <div class="views" role="group" aria-label="תצוגה">
        <button
          v-for="item in views"
          :key="item.id"
          class="view-tab"
          :class="{ current: view === item.id }"
          type="button"
          :aria-pressed="view === item.id"
          @click="chooseView(item.id)"
        >
          {{ item.label }}
          <span v-if="item.id === 'backlog'" class="count">{{ byStatus.backlog.length }}</span>
          <span v-if="item.id === 'completed'" class="count">{{ olderDone.length }}</span>
        </button>
      </div>
      <button class="btn primary" type="button" aria-label="משימה חדשה" @click="openNewTask()">
        <AppIcon name="plus" :size="16" />
        <span class="new-task-label">משימה חדשה</span>
      </button>
    </div>

    <p v-if="!liveConnected && !loading" class="notice" role="status">
      אין חיבור לעדכונים חיים. מנסים להתחבר מחדש…
    </p>
    <p v-if="actionError" class="form-error notice" role="alert">{{ actionError }}</p>

    <p v-if="loading" class="state">טוענים משימות…</p>
    <div v-else-if="loadFailed" class="state">
      <p class="form-error" role="alert">לא הצלחנו לטעון את המשימות.</p>
      <button class="btn" type="button" @click="load">ניסיון נוסף</button>
    </div>

    <div v-else-if="view === 'board'" class="board">
      <BoardColumn
        v-for="status in BOARD_STATUSES"
        :key="status"
        :status="status"
        :tasks="byStatus[status]"
        :dragging-id="dragging?.id ?? null"
        @add="openNewTask(status)"
        @edit="taskDialog?.open($event)"
        @delete="deleteDialog?.open($event)"
        @status="setStatus"
        @toggle-subtask="toggleSubtask"
        @drag-start="dragging = $event"
        @drag-end="dragging = null"
        @drop-task="dropTask(status)"
      />
    </div>

    <div v-else-if="view === 'priority'" class="sections">
      <section
        v-for="group in [
          { title: 'פעילות', status: 'in_progress', tasks: priorityActive },
          { title: 'בקלוג', status: 'backlog', tasks: byStatus.backlog },
        ]"
        :key="group.title"
        :class="`status-${group.status}`"
      >
        <h2 class="section-title">
          <span class="status-dot"></span>
          {{ group.title }}
          <span class="status-count">{{ group.tasks.length }}</span>
        </h2>
        <p v-if="group.tasks.length === 0" class="empty">אין כאן משימות.</p>
        <div v-else class="list">
          <TaskCard
            v-for="(task, index) in group.tasks"
            :key="task.id"
            :task="task"
            mode="list"
            phone-show="order"
            reorderable
            :can-move-up="index > 0"
            :can-move-down="index < group.tasks.length - 1"
            @edit="taskDialog?.open(task)"
            @delete="deleteDialog?.open(task)"
            @move="moveTask(task, $event, group.tasks)"
            @open="openDetails(task)"
            @status="setStatus(task, $event)"
            @toggle-subtask="toggleSubtask(task, $event)"
          />
        </div>
      </section>
    </div>

    <div v-else-if="view === 'completed'" class="sections">
      <p v-if="olderDone.length === 0" class="empty">משימות שהושלמו לפני יותר משבוע יופיעו כאן.</p>
      <div v-else class="list">
        <TaskCard
          v-for="task in olderDone"
          :key="task.id"
          :task="task"
          mode="list"
          @open="openDetails(task)"
          @edit="taskDialog?.open(task)"
          @delete="deleteDialog?.open(task)"
          @status="setStatus(task, $event)"
          @toggle-subtask="toggleSubtask(task, $event)"
        />
      </div>
    </div>

    <div v-else class="sections">
      <section v-for="status in view === 'backlog' ? (['backlog'] as const) : LIST_SECTIONS" :key="status" :class="`status-${status}`">
        <h2 v-if="view === 'list'" class="section-title">
          <span class="status-dot"></span>
          {{ STATUS_LABELS[status] }}
          <span class="status-count">{{ byStatus[status].length }}</span>
        </h2>
        <p v-if="byStatus[status].length === 0" class="empty">אין כאן משימות.</p>
        <div v-else class="list">
          <TaskCard
            v-for="task in byStatus[status]"
            :key="task.id"
            :task="task"
            mode="list"
            :phone-show="view === 'backlog' ? 'status' : 'summary'"
            @open="openDetails(task)"
            @edit="taskDialog?.open(task)"
            @delete="deleteDialog?.open(task)"
            @status="setStatus(task, $event)"
            @toggle-subtask="toggleSubtask(task, $event)"
          />
        </div>
      </section>
    </div>

    <TaskDialog ref="taskDialog" :save="saveTask" />
    <DeleteTaskDialog ref="deleteDialog" :remove="deleteTask" />

    <AppDialog ref="detailsDialog" class="details-sheet" title="פרטי משימה">
      <TaskCard
        v-if="detailsTask"
        :task="detailsTask"
        mode="sheet"
        @edit="editFromDetails(detailsTask)"
        @delete="deleteFromDetails(detailsTask)"
        @status="setStatus(detailsTask, $event)"
        @toggle-subtask="toggleSubtask(detailsTask, $event)"
      />
      <p v-else class="empty">המשימה כבר לא קיימת.</p>
    </AppDialog>

    <AppDialog ref="signOutDialog" title="להתנתק?" :width="400">
      <p class="sign-out-text">כדי לחזור למשימות במכשיר הזה צריך יהיה להתחבר שוב.</p>
      <template #footer>
        <button class="btn" type="button" autofocus @click="signOutDialog?.close()">ביטול</button>
        <button class="btn primary sign-out-confirm" type="button" @click="signOut">התנתקות</button>
      </template>
    </AppDialog>
  </main>
</template>

<style scoped>
.page {
  max-width: 820px;
  margin-inline: auto;
  padding-block: 48px 64px;
  padding-left: max(16px, env(safe-area-inset-left, 0px));
  padding-right: max(16px, env(safe-area-inset-right, 0px));
}
.page.wide { max-width: 1400px; }
.top {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px 24px;
  margin-bottom: 20px;
}
.heading { min-width: 0; }
h1 { margin: 0; color: var(--navy); font-size: 32px; font-weight: 700; line-height: 1.25; }
.email { margin: 2px 0 0; color: var(--muted); font-size: 14px; text-align: right; overflow-wrap: anywhere; }
.account { display: flex; gap: 8px; }
.account .btn {
  box-sizing: border-box;
  width: 32px;
  min-height: 32px;
  border-color: rgba(var(--ink-rgb), 0.14);
  border-radius: 8px;
  color: var(--muted);
}
.account .links-link { width: auto; padding-inline: 12px; font-size: 14px; text-decoration: none; }
@media (max-width: 720px) {
  .account .links-link { width: 32px; padding: 0; }
  .links-text { display: none; }
}
.toolbar > .primary { min-height: 32px; padding-inline: 12px; border-radius: 8px; font-size: 14px; }
.logout { transform: scaleX(-1); } /* Points the way out in a right-to-left layout. */

.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 20px;
  border-bottom: 1px solid rgba(var(--ink-rgb), 0.12);
  padding-bottom: 12px;
}
.views { display: flex; gap: 4px; }
.view-tab {
  position: relative;
  min-height: 44px;
  padding-inline: 14px;
  border: none;
  background: transparent;
  color: var(--muted);
  font: inherit;
  font-size: 15px;
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;
}
.view-tab:hover { color: var(--navy); }
.view-tab:focus-visible { outline: 2px solid var(--blue); outline-offset: -2px; border-radius: 8px; }
.view-tab.current { color: var(--blue-text); font-weight: 700; }
.view-tab.current::after {
  content: "";
  position: absolute;
  inset-inline: 0;
  bottom: -13px;
  height: 2px;
  background: var(--cta);
}
.count { font-size: 13px; font-weight: 500; }

.sign-out-text { margin: 0; font-size: 15px; }
.sign-out-confirm { flex: 1; }

/* A short task would leave the details sheet as a thin strip, so it opens at least this tall. */
@media (max-width: 720px) {
  .details-sheet :deep(.panel) { min-height: 60dvh; }
}

.notice { margin: 0 0 16px; color: var(--muted); font-size: 14px; }
.notice.form-error { color: var(--danger); }
.state { margin: 32px 0; color: var(--muted); text-align: center; }
.state .form-error { margin-bottom: 12px; }

.board { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; align-items: stretch; }

.sections { display: flex; flex-direction: column; gap: 28px; }
.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 12px;
  color: var(--navy);
  font-size: 16px;
  font-weight: 700;
}
.empty { margin: 0; color: var(--muted); font-size: 14px; }
/* One framed table per section; the rows draw their own dividers. */
.list {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid rgba(var(--ink-rgb), 0.1);
  border-radius: var(--radius);
  background: var(--card);
  box-shadow: 0 1px 3px rgba(var(--ink-rgb), 0.05);
}

@media (min-width: 721px) {
  .sections { gap: 20px; }
  .section-title { margin-bottom: 8px; font-size: 15px; }
}

@media (max-width: 720px) {
  .page { padding-block: 24px 40px; }
  h1 { font-size: 28px; }
  .toolbar { flex-wrap: nowrap; padding-bottom: 0; }
  /* Reaches over the toolbar's border, so the selected tab's line sits right on it. */
  .views { flex: 1; min-width: 0; margin-bottom: -1px; overflow-x: auto; scrollbar-width: none; }
  .views::-webkit-scrollbar { display: none; }
  .toolbar > .primary { flex: none; width: 32px; padding: 0; border-radius: 50%; }
  .new-task-label { display: none; }
  .view-tab { padding-inline: 8px; font-size: 14px; }
  .view-tab.current::after { bottom: 0; }
}
</style>
