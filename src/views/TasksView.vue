<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { RouterLink } from 'vue-router'
import AppIcon from '@/components/AppIcon.vue'
import BoardColumn from '@/components/BoardColumn.vue'
import DeleteTaskDialog from '@/components/DeleteTaskDialog.vue'
import TaskCard from '@/components/TaskCard.vue'
import TaskDialog from '@/components/TaskDialog.vue'
import { session, signOut, useRedirectWhenSignedOut } from '@/composables/useAuth'
import {
  BOARD_STATUSES,
  LIST_STATUSES,
  STATUS_LABELS,
  useTasks,
  type EditableTaskFields,
  type Task,
  type TaskStatus,
} from '@/composables/useTasks'

type View = 'board' | 'list' | 'backlog' | 'completed'

const VIEW_STORAGE_KEY = 'tasks:view'

useRedirectWhenSignedOut()

const {
  byStatus,
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
  moveToPosition,
} = useTasks()

const deleteDialog = ref<InstanceType<typeof DeleteTaskDialog>>()
const taskDialog = ref<InstanceType<typeof TaskDialog>>()
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
    { id: 'backlog' as const, label: 'בקלוג' },
    { id: 'completed' as const, label: 'הושלמו' },
  ].filter((item) => !listOnly.value || item.id !== 'board'),
)

function readStoredView(): View {
  try {
    const stored = localStorage.getItem(VIEW_STORAGE_KEY)
    return stored === 'list' || stored === 'backlog' || stored === 'completed' ? stored : 'board'
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

function dropTask(status: TaskStatus, index: number) {
  if (dragging.value) moveToPosition(dragging.value, status, index)
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
        <RouterLink class="btn icon-btn" to="/settings" aria-label="הגדרות" title="הגדרות">
          <AppIcon name="settings" />
        </RouterLink>
        <button class="btn icon-btn" type="button" aria-label="התנתקות" title="התנתקות" @click="signOut">
          <AppIcon class="logout" name="logout" />
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
      <button class="btn primary" type="button" @click="openNewTask()">
        <AppIcon name="plus" :size="16" />
        משימה חדשה
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
        @drop-task="dropTask(status, $event)"
      />
    </div>

    <div v-else-if="view === 'completed'" class="sections">
      <p v-if="olderDone.length === 0" class="empty">משימות שהושלמו לפני יותר משבוע יופיעו כאן.</p>
      <div v-else class="list">
        <TaskCard
          v-for="task in olderDone"
          :key="task.id"
          :task="task"
          mode="list"
          @edit="taskDialog?.open(task)"
          @delete="deleteDialog?.open(task)"
          @status="setStatus(task, $event)"
          @toggle-subtask="toggleSubtask(task, $event)"
        />
      </div>
    </div>

    <div v-else class="sections">
      <section v-for="status in view === 'backlog' ? (['backlog'] as const) : LIST_STATUSES" :key="status" :class="`status-${status}`">
        <h2 v-if="view === 'list'" class="section-title">
          <span class="status-dot"></span>
          {{ STATUS_LABELS[status] }}
          <span class="status-count">{{ byStatus[status].length }}</span>
        </h2>
        <p v-if="byStatus[status].length === 0" class="empty">אין כאן משימות.</p>
        <div v-else class="list">
          <TaskCard
            v-for="(task, index) in byStatus[status]"
            :key="task.id"
            :task="task"
            mode="list"
            :can-move-up="index > 0"
            :can-move-down="index < byStatus[status].length - 1"
            @edit="taskDialog?.open(task)"
            @delete="deleteDialog?.open(task)"
            @move="moveTask(task, $event)"
            @status="setStatus(task, $event)"
            @toggle-subtask="toggleSubtask(task, $event)"
          />
        </div>
      </section>
    </div>

    <TaskDialog ref="taskDialog" :save="saveTask" />
    <DeleteTaskDialog ref="deleteDialog" :remove="deleteTask" />
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
.account a { box-sizing: border-box; }
.logout { transform: scaleX(-1); } /* Points the way out in a right-to-left layout. */

.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 20px;
  border-bottom: 1px solid rgba(18, 39, 54, 0.12);
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

.notice { margin: 0 0 16px; color: var(--muted); font-size: 14px; }
.notice.form-error { color: #b42318; }
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
.list { display: flex; flex-direction: column; gap: 12px; }

@media (min-width: 901px) and (pointer: fine) {
  .sections { gap: 20px; }
  .section-title { margin-bottom: 8px; font-size: 15px; }
  .list { gap: 6px; }
}

@media (max-width: 720px) {
  .page { padding-block: 24px 40px; }
  h1 { font-size: 28px; }
  .toolbar > .primary { border-radius: 999px; }
  .view-tab.current::after { bottom: 0; }
}
</style>
