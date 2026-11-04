<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { signIn } from '@/composables/useAuth'

const route = useRoute()
const router = useRouter()

const email = ref('')
const password = ref('')
const error = ref('')
const busy = ref(false)

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
      <h1>כניסה למשימות<span class="dot">.</span></h1>
      <form class="form" @submit.prevent="submit">
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

@media (max-width: 360px) {
  .card { padding: 20px; }
}
</style>
