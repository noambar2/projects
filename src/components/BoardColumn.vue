<script setup lang="ts">
import { computed, ref, watch } from 'vue'
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
  dropTask: [index: number]
}>()

const list = ref<HTMLElement>()
const dropIndex = ref<number | null>(null)

const others = computed(() => props.tasks.filter((task) => task.id !== props.draggingId))

function placeholderBefore(task: Task) {
  return dropIndex.value !== null && task.id !== props.draggingId && others.value.indexOf(task) === dropIndex.value
}

function onDragOver(event: DragEvent) {
  if (!props.draggingId) return
  event.preventDefault()
  // Done tasks are sorted by completion date, so a new one always lands on top.
  if (props.status === 'done') {
    dropIndex.value = 0
    return
  }
  const cards = [...(list.value?.querySelectorAll<HTMLElement>('[data-task-id]') ?? [])].filter(
    (card) => card.dataset.taskId !== props.draggingId,
  )
  const next = cards.findIndex((card) => {
    const rect = card.getBoundingClientRect()
    return event.clientY < rect.top + rect.height / 2
  })
  dropIndex.value = next === -1 ? cards.length : next
}

function onDragLeave(event: DragEvent) {
  const target = event.currentTarget as HTMLElement
  if (!target.contains(event.relatedTarget as Node | null)) dropIndex.value = null
}

function onDrop(event: DragEvent) {
  event.preventDefault()
  if (dropIndex.value !== null) emit('dropTask', dropIndex.value)
  dropIndex.value = null
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
    if (!id) dropIndex.value = null
  },
)
</script>

<template>
  <section class="column" :class="`status-${status}`" @dragover="onDragOver" @dragleave="onDragLeave" @drop="onDrop">
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

    <div ref="list" class="cards">
      <template v-for="task in tasks" :key="task.id">
        <div v-if="placeholderBefore(task)" class="placeholder"></div>
        <TaskCard
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
      </template>
      <div v-if="dropIndex !== null && dropIndex >= others.length" class="placeholder"></div>
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
  border: 1px solid rgba(18, 39, 54, 0.08);
  border-radius: 10px;
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
.add:hover { background: rgba(18, 39, 54, 0.06); color: var(--navy); }
.add:focus-visible { outline: 2px solid var(--blue); outline-offset: 1px; }
.cards { display: flex; flex: 1; flex-direction: column; gap: 12px; min-height: 120px; }
.placeholder {
  flex: none;
  height: 88px;
  border: 2px dashed var(--blue);
  border-radius: 10px;
  background: var(--blue-tint);
}
.dragging { opacity: 0.35; }
</style>
