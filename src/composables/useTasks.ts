import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'review' | 'done'

export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'לא התחיל',
  in_progress: 'בתהליך',
  review: 'בבדיקה',
  done: 'הושלם',
  backlog: 'בקלוג',
}

export const BOARD_STATUSES: TaskStatus[] = ['todo', 'in_progress', 'review', 'done']
export const LIST_STATUSES: TaskStatus[] = ['todo', 'in_progress', 'review', 'backlog', 'done']

const RECENT_DONE_MS = 7 * 24 * 60 * 60 * 1000

export interface Subtask {
  id: string
  title: string
  done: boolean
}

export interface Task {
  id: string
  title: string
  notes: string | null
  status: TaskStatus
  sort_order: number
  due_date: string | null
  subtasks: Subtask[]
  created_by: string | null
  created_at: string
  updated_at: string
  completed_at: string | null
}

export type EditableTaskFields = Pick<Task, 'title' | 'notes' | 'status' | 'due_date' | 'subtasks'>

export function useTasks() {
  const tasks = ref<Task[]>([])
  const loading = ref(true)
  const loadFailed = ref(false)
  const actionError = ref('')
  const liveConnected = ref(true)
  const now = ref(Date.now()) // Refreshed on load, which runs whenever the page returns.

  const byStatus = computed<Record<TaskStatus, Task[]>>(() => ({
    backlog: inPriorityOrder('backlog'),
    todo: inPriorityOrder('todo'),
    in_progress: inPriorityOrder('in_progress'),
    review: inPriorityOrder('review'),
    done: doneTasks.value.filter((task) => !isOlderDone(task)),
  }))

  /** Tasks completed more than a week ago, which leave the board and the main list. */
  const olderDone = computed(() => doneTasks.value.filter(isOlderDone))

  const doneTasks = computed(() =>
    tasks.value
      .filter((task) => task.status === 'done')
      .sort((a, b) => (b.completed_at ?? '').localeCompare(a.completed_at ?? '')),
  )

  function isOlderDone(task: Task) {
    return !!task.completed_at && now.value - Date.parse(task.completed_at) > RECENT_DONE_MS
  }

  function inPriorityOrder(status: TaskStatus) {
    return tasks.value
      .filter((task) => task.status === status)
      .sort((a, b) => a.sort_order - b.sort_order || a.created_at.localeCompare(b.created_at))
  }

  async function load() {
    now.value = Date.now()
    const { data, error } = await supabase.from('tasks').select('*')
    loading.value = false
    // Keep showing what we have if a background refresh fails.
    loadFailed.value = !!error && tasks.value.length === 0
    if (!error) tasks.value = data as Task[]
  }

  /** Applies a row from the server, ignoring one older than what we already have. */
  function applyRow(row: Task) {
    const index = tasks.value.findIndex((task) => task.id === row.id)
    if (index === -1) tasks.value.push(row)
    else if (row.updated_at >= tasks.value[index].updated_at) tasks.value[index] = row
  }

  async function addTask(fields: EditableTaskFields): Promise<boolean> {
    const { data, error } = await supabase.from('tasks').insert(fields).select().single()
    if (error) return false
    applyRow(data as Task)
    return true
  }

  async function updateTask(id: string, fields: Partial<EditableTaskFields & Pick<Task, 'sort_order'>>) {
    const task = tasks.value.find((item) => item.id === id)
    if (task) {
      // Show the change right away. Done tasks are sorted by this date, which the server sets.
      if (fields.status === 'done' && task.status !== 'done') task.completed_at = new Date().toISOString()
      Object.assign(task, fields)
    }

    const { data, error } = await supabase.from('tasks').update(fields).eq('id', id).select().single()
    if (error) {
      actionError.value = 'השינוי לא נשמר. כדאי לנסות שוב.'
      await load()
      return false
    }
    actionError.value = ''
    applyRow(data as Task)
    return true
  }

  async function deleteTask(task: Task): Promise<boolean> {
    const { error } = await supabase.from('tasks').delete().eq('id', task.id)
    if (error) return false
    tasks.value = tasks.value.filter((item) => item.id !== task.id)
    return true
  }

  /** Saves the edit form. A task that changes list goes to the end of the new one. */
  function saveEdit(task: Task, fields: EditableTaskFields) {
    return updateTask(task.id, fields.status === task.status ? fields : { ...fields, sort_order: endOrder(fields.status, task) })
  }

  function endOrder(status: TaskStatus, task: Task) {
    const list = inPriorityOrder(status)
    const last = list[list.length - 1]
    return last ? last.sort_order + 1 : task.sort_order
  }

  function setStatus(task: Task, status: TaskStatus) {
    if (status !== task.status) void updateTask(task.id, { status, sort_order: endOrder(status, task) })
  }

  /** Places the task between its new neighbors, so only one row has to change. */
  function moveToPosition(task: Task, status: TaskStatus, index: number) {
    const others = inPriorityOrder(status).filter((item) => item.id !== task.id)
    if (status === task.status) {
      // Done tasks stay sorted by completion date, so there is no position to change.
      if (status === 'done') return
      if (inPriorityOrder(status).findIndex((item) => item.id === task.id) === index) return
    }
    const previous = others[index - 1]
    const next = others[index]
    let sortOrder = task.sort_order
    if (previous && next) sortOrder = (previous.sort_order + next.sort_order) / 2
    else if (previous) sortOrder = previous.sort_order + 1
    else if (next) sortOrder = next.sort_order - 1
    void updateTask(task.id, { status, sort_order: sortOrder })
  }

  function moveTask(task: Task, direction: 'up' | 'down') {
    const list = byStatus.value[task.status]
    const index = list.findIndex((item) => item.id === task.id)
    moveToPosition(task, task.status, index + (direction === 'up' ? -1 : 1))
  }

  let channel: RealtimeChannel | undefined

  function refreshWhenVisible() {
    if (document.visibilityState === 'visible') void load()
  }

  onMounted(() => {
    void load()
    channel = supabase
      .channel('tasks-changes')
      .on<Task>('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, (payload) => {
        // A denied event arrives with empty rows and only an error, e.g. after the session expires.
        if (payload.errors?.length) return
        if (payload.eventType === 'DELETE') {
          tasks.value = tasks.value.filter((task) => task.id !== payload.old.id)
        } else {
          applyRow(payload.new)
        }
      })
      .subscribe((status) => {
        liveConnected.value = status === 'SUBSCRIBED'
        // Catch anything that changed while the connection was down.
        if (status === 'SUBSCRIBED') void load()
      })
    // Phones suspend background tabs, so refresh when the page returns.
    document.addEventListener('visibilitychange', refreshWhenVisible)
  })

  onBeforeUnmount(() => {
    document.removeEventListener('visibilitychange', refreshWhenVisible)
    if (channel) void supabase.removeChannel(channel)
  })

  return {
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
  }
}
