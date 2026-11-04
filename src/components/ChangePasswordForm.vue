<script setup lang="ts">
import { computed, ref } from 'vue'
import { changePassword, MIN_PASSWORD_LENGTH, session } from '@/composables/useAuth'

const current = ref('')
const next = ref('')
const confirm = ref('')
const error = ref('')
const success = ref(false)
const busy = ref(false)

const email = computed(() => session.value?.user.email ?? '')

async function submit() {
  error.value = ''
  success.value = false
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
  success.value = true
}
</script>

<template>
  <form class="form" @submit.prevent="submit">
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
    <p v-if="success" class="form-success" role="status">הסיסמה הוחלפה.</p>
    <button class="btn primary" type="submit" :disabled="busy">{{ busy ? 'מחליפים…' : 'החלפת סיסמה' }}</button>
  </form>
</template>
