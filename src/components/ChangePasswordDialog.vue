<script setup lang="ts">
import { computed, ref } from 'vue'
import { changePassword, MIN_PASSWORD_LENGTH, session } from '@/composables/useAuth'

const dialog = ref<HTMLDialogElement>()
const current = ref('')
const next = ref('')
const confirm = ref('')
const error = ref('')
const busy = ref(false)
const done = ref(false)

const email = computed(() => session.value?.user.email ?? '')

function open() {
  dialog.value?.showModal()
}

function close() {
  dialog.value?.close()
}

function reset() {
  current.value = ''
  next.value = ''
  confirm.value = ''
  error.value = ''
  done.value = false
}

async function submit() {
  error.value = ''
  if (next.value.length < MIN_PASSWORD_LENGTH) {
    error.value = `הסיסמה החדשה צריכה לכלול לפחות ${MIN_PASSWORD_LENGTH} תווים.`
    return
  }
  if (next.value !== confirm.value) {
    error.value = 'הסיסמאות החדשות לא זהות.'
    return
  }
  busy.value = true
  const failure = await changePassword(current.value, next.value)
  busy.value = false
  if (failure) {
    error.value = failure
    return
  }
  current.value = next.value = confirm.value = ''
  done.value = true
}

defineExpose({ open })
</script>

<template>
  <dialog ref="dialog" class="dialog" aria-labelledby="change-password-title" @close="reset">
    <h2 id="change-password-title">החלפת סיסמה<span class="dot">.</span></h2>

    <div v-if="done" class="form">
      <p class="form-success" role="status">הסיסמה הוחלפה.</p>
      <button class="btn primary" type="button" @click="close">סגירה</button>
    </div>

    <form v-else class="form" @submit.prevent="submit">
      <!-- Lets password managers save the new password under the right account. -->
      <input type="email" :value="email" autocomplete="username" readonly hidden />
      <label class="field">
        <span>סיסמה נוכחית</span>
        <input v-model="current" type="password" dir="ltr" autocomplete="current-password" required />
      </label>
      <label class="field">
        <span>סיסמה חדשה</span>
        <input v-model="next" type="password" dir="ltr" autocomplete="new-password" required />
        <small>לפחות {{ MIN_PASSWORD_LENGTH }} תווים</small>
      </label>
      <label class="field">
        <span>אימות סיסמה חדשה</span>
        <input v-model="confirm" type="password" dir="ltr" autocomplete="new-password" required />
      </label>
      <p v-if="error" class="form-error" role="alert">{{ error }}</p>
      <div class="actions">
        <button class="btn primary" type="submit" :disabled="busy">{{ busy ? 'מחליפים…' : 'החלפת סיסמה' }}</button>
        <button class="btn" type="button" @click="close">ביטול</button>
      </div>
    </form>
  </dialog>
</template>

<style scoped>
.dialog {
  width: min(440px, calc(100vw - 32px));
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
.actions { display: flex; gap: 8px; }
.actions .primary { flex: 1; }
</style>
