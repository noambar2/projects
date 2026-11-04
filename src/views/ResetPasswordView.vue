<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { authReady, inPasswordRecovery, MIN_PASSWORD_LENGTH, setNewPassword } from '@/composables/useAuth'

const router = useRouter()

const next = ref('')
const confirm = ref('')
const error = ref('')
const busy = ref(false)
const checking = ref(true)

// The recovery event can arrive just after the session is ready, so allow it a moment.
let timer: number | undefined
void authReady.then(() => {
  timer = window.setTimeout(() => (checking.value = false), 800)
})
onBeforeUnmount(() => window.clearTimeout(timer))

async function submit() {
  error.value = ''
  if (next.value.length < MIN_PASSWORD_LENGTH) {
    error.value = `הסיסמה החדשה צריכה לכלול לפחות ${MIN_PASSWORD_LENGTH} תווים.`
    return
  }
  if (next.value !== confirm.value) {
    error.value = 'הסיסמאות לא זהות.'
    return
  }
  busy.value = true
  const failure = await setNewPassword(next.value)
  busy.value = false
  if (failure) error.value = failure
  else await router.replace('/tasks')
}
</script>

<template>
  <main class="login">
    <section class="card">
      <h1>סיסמה חדשה<span class="dot">.</span></h1>

      <form v-if="inPasswordRecovery" class="form" @submit.prevent="submit">
        <label class="field">
          <span>סיסמה חדשה</span>
          <input v-model="next" type="password" dir="ltr" autocomplete="new-password" required />
          <small>לפחות {{ MIN_PASSWORD_LENGTH }} תווים</small>
        </label>
        <label class="field">
          <span>אימות סיסמה</span>
          <input v-model="confirm" type="password" dir="ltr" autocomplete="new-password" required />
        </label>
        <p v-if="error" class="form-error" role="alert">{{ error }}</p>
        <button class="btn primary" type="submit" :disabled="busy">{{ busy ? 'שומרים…' : 'שמירת הסיסמה' }}</button>
      </form>

      <p v-else-if="checking" class="text" role="status">בודקים את הקישור…</p>

      <template v-else>
        <p class="form-error" role="alert">הקישור לא תקין או שפג תוקפו. אפשר לבקש קישור חדש ממסך הכניסה.</p>
        <RouterLink class="back" to="/login">חזרה לכניסה</RouterLink>
      </template>
    </section>
  </main>
</template>

<style scoped>
.login {
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px max(16px, env(safe-area-inset-right, 0px)) 24px max(16px, env(safe-area-inset-left, 0px));
  box-sizing: border-box;
}
.card {
  width: 100%;
  max-width: 420px;
  padding: 32px;
  box-sizing: border-box;
  background: var(--card);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
}
h1 { margin: 0 0 24px; color: var(--navy); font-size: 28px; font-weight: 700; line-height: 1.25; }
.text { margin: 0; color: var(--muted); }
.back { display: inline-block; margin-top: 16px; color: var(--blue-text); font-size: 15px; font-weight: 500; }

@media (max-width: 360px) {
  .card { padding: 20px; }
}
</style>
