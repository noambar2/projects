<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import AppIcon from '@/components/AppIcon.vue'
import ChangePasswordForm from '@/components/ChangePasswordForm.vue'
import { session, useRedirectWhenSignedOut } from '@/composables/useAuth'

useRedirectWhenSignedOut()

const email = computed(() => session.value?.user.email ?? '')
</script>

<template>
  <main class="page">
    <RouterLink class="back" to="/tasks">
      <AppIcon name="arrow-right" />
      חזרה למשימות
    </RouterLink>
    <h1>הגדרות<span class="dot">.</span></h1>
    <p dir="ltr" class="email">{{ email }}</p>

    <section class="card">
      <h2>החלפת סיסמה</h2>
      <ChangePasswordForm />
    </section>
  </main>
</template>

<style scoped>
.page {
  max-width: 520px;
  margin-inline: auto;
  padding-block: 48px 64px;
  padding-left: max(16px, env(safe-area-inset-left, 0px));
  padding-right: max(16px, env(safe-area-inset-right, 0px));
}
.back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 44px;
  margin-bottom: 8px;
  color: var(--blue-text);
  font-size: 15px;
  font-weight: 500;
  text-decoration: none;
}
.back:hover { text-decoration: underline; }
.back:focus-visible { outline: 2px solid var(--blue); outline-offset: 2px; border-radius: 4px; }
h1 { margin: 0; color: var(--navy); font-size: 32px; font-weight: 700; line-height: 1.25; }
.email { margin: 2px 0 24px; color: var(--muted); font-size: 14px; text-align: right; overflow-wrap: anywhere; }
.card { padding: 24px; background: var(--card); border-radius: 10px; box-shadow: var(--shadow); }
h2 { margin: 0 0 20px; color: var(--navy); font-size: 20px; font-weight: 700; }

@media (max-width: 720px) {
  .page { padding-block: 16px 40px; }
  h1 { font-size: 28px; }
}
</style>
