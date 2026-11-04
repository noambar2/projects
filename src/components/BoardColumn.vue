<script setup lang="ts">
import { ref, watch } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import TaskCard from '@/components/TaskCard.vue'
import { STATUS_LABELS, type Task, type TaskStatus } from '@/composables/useTasks'

const props = defineProps<{
  status: TaskStatus
  tasks: Task[]
  draggingId: string | null
}>()

const emit = defineEmits<{
  add: []
  edit: [task: Task]
  delete: [task: Task]
  status: [task: Task, status: TaskStatus]
  toggleSubtask: [task: Task, subtaskId: string]
  dragStart: [task: Task]
  dragEnd: []
  dropTask: []
}>()

const isDropTarget = ref(false)

function onDragOver(event: DragEvent) {
  if (!props.draggingId) return
  event.preventDefault()
  isDropTarget.value = true
}

function onDragLeave(event: DragEvent) {
  const target = event.currentTarget as HTMLElement
  if (!target.contains(event.relatedTarget as Node | null)) isDropTarget.value = false
}

function onDrop(event: DragEvent) {
  event.preventDefault()
  if (isDropTarget.value) emit('dropTask')
  isDropTarget.value = false
}

function onCardDragStart(event: DragEvent, task: Task) {
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', task.title) // Firefox won't start a drag without data.
  }
  emit('dragStart', task)
}

watch(
  () => props.draggingId,
  (id) => {
    if (!id) isDropTarget.value = false
  },
)
</script>

<template>
  <section class="column" :class="[`status-${status}`, { 'drop-target': isDropTarget }]" @dragover="onDragOver" @dragleave="onDragLeave" @drop="onDrop">
    <header class="column-head">
      <span class="status-dot"></span>
      <h2>{{ STATUS_LABELS[status] }}</h2>
      <span class="status-count">{{ tasks.length }}</span>
      <button
        v-if="status !== 'done'"
        class="add"
        type="button"
        :aria-label="`משימה חדשה ב${STATUS_LABELS[status]}`"
        @click="emit('add')"
      >
        <AppIcon name="plus" />
      </button>
    </header>

    <div class="cards">
      <TaskCard
        v-for="task in tasks"
        :key="task.id"
        :class="{ dragging: task.id === draggingId }"
        :task="task"
        mode="board"
        @dragstart="onCardDragStart($event, task)"
        @dragend="emit('dragEnd')"
        @edit="emit('edit', task)"
        @delete="emit('delete', task)"
        @status="emit('status', task, $event)"
        @toggle-subtask="emit('toggleSubtask', task, $event)"
      />
    </div>
  </section>
</template>

<style scoped>
.column { display: flex; flex-direction: column; gap: 12px; min-width: 0; }
.column-head {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 48px;
  padding-inline: 14px 6px;
  box-sizing: border-box;
  background: var(--card);
  border: 1px solid rgba(var(--ink-rgb), 0.08);
  border-radius: var(--radius);
}
h2 { margin: 0; color: var(--navy); font-size: 15px; font-weight: 700; white-space: nowrap; }
.add {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  margin-inline-start: auto;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
}
.add:hover { background: rgba(var(--ink-rgb), 0.06); color: var(--navy); }
.add:focus-visible { outline: 2px solid var(--blue); outline-offset: 1px; }
.cards { display: flex; flex: 1; flex-direction: column; gap: 12px; min-height: 120px; }
.drop-target .cards {
  outline: 2px dashed var(--blue);
  outline-offset: 4px;
  border-radius: var(--radius);
  background: var(--blue-tint);
}
.dragging { opacity: 0.35; }
</style>
