<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import AppIcon from '@/components/AppIcon.vue'
import { requestPasswordReset, signIn } from '@/composables/useAuth'

const route = useRoute()
const router = useRouter()

const email = ref('')
const password = ref('')
const error = ref('')
const busy = ref(false)
const forgot = ref(false)
const resetSent = ref(false)

function showForgot(value: boolean) {
  forgot.value = value
  resetSent.value = false
  error.value = ''
}

async function sendReset() {
  error.value = ''
  busy.value = true
  const failure = await requestPasswordReset(email.value.trim())
  busy.value = false
  if (failure) error.value = failure
  else resetSent.value = true
}

async function submit() {
  error.value = ''
  busy.value = true
  const failure = await signIn(email.value.trim(), password.value)
  busy.value = false
  if (failure) {
    error.value = failure
    return
  }
  const redirect = route.query.redirect
  await router.replace(typeof redirect === 'string' && redirect.startsWith('/') ? redirect : '/tasks')
}
</script>

<template>
  <main class="login">
    <section class="card">
      <RouterLink class="back" to="/">
        <AppIcon name="arrow-right" :size="16" />
        חזרה לעמוד הקישורים
      </RouterLink>
      <h1>{{ forgot ? 'שכחתי סיסמה' : 'כניסה למשימות' }}<span class="dot">.</span></h1>

      <form v-if="forgot" class="form" @submit.prevent="sendReset">
        <p class="hint">נשלח למייל קישור לקביעת סיסמה חדשה.</p>
        <label class="field">
          <span>אימייל</span>
          <input v-model="email" type="email" dir="ltr" autocomplete="username" required />
        </label>
        <p v-if="error" class="form-error" role="alert">{{ error }}</p>
        <p v-if="resetSent" class="form-success" role="status">אם הכתובת רשומה אצלנו, הקישור בדרך למייל. כדאי לבדוק גם בספאם.</p>
        <button class="btn primary" type="submit" :disabled="busy">{{ busy ? 'שולחים…' : 'שליחת קישור' }}</button>
        <button class="text-link" type="button" @click="showForgot(false)">חזרה לכניסה</button>
      </form>

      <form v-else class="form" @submit.prevent="submit">
        <label class="field">
          <span>אימייל</span>
          <input v-model="email" type="email" dir="ltr" autocomplete="username" required />
        </label>
        <label class="field">
          <span>סיסמה</span>
          <input v-model="password" type="password" dir="ltr" autocomplete="current-password" required />
        </label>
        <p v-if="error" class="form-error" role="alert">{{ error }}</p>
        <button class="btn primary" type="submit" :disabled="busy">{{ busy ? 'מתחברים…' : 'כניסה' }}</button>
        <button class="text-link" type="button" @click="showForgot(true)">שכחתי סיסמה</button>
      </form>
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

.back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 32px;
  margin-bottom: 8px;
  color: var(--blue-text);
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
}
.back:hover { text-decoration: underline; }
.back:focus-visible { outline: 2px solid var(--blue); outline-offset: 2px; border-radius: 4px; }

.hint { margin: 0; color: var(--muted); font-size: 15px; }
.text-link {
  align-self: center;
  min-height: 32px;
  padding-inline: 8px;
  border: none;
  background: transparent;
  color: var(--blue-text);
  font: inherit;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}
.text-link:hover { text-decoration: underline; }
.text-link:focus-visible { outline: 2px solid var(--blue); outline-offset: 1px; border-radius: 4px; }

@media (max-width: 360px) {
  .card { padding: 20px; }
}
</style>
