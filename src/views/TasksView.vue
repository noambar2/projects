<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import ChangePasswordDialog from '@/components/ChangePasswordDialog.vue'
import { session, signOut } from '@/composables/useAuth'

const router = useRouter()
const passwordDialog = ref<InstanceType<typeof ChangePasswordDialog>>()
const email = computed(() => session.value?.user.email ?? '')

// Covers signing out here, in another tab, or the session expiring.
watch(session, (value) => {
  if (!value) router.replace('/login')
})
</script>

<template>
  <main class="page">
    <header class="top">
      <div class="heading">
        <h1>משימות<span class="dot">.</span></h1>
        <p dir="ltr" class="email">{{ email }}</p>
      </div>
      <div class="account">
        <button class="btn" type="button" @click="passwordDialog?.open()">החלפת סיסמה</button>
        <button class="btn" type="button" @click="signOut">יציאה</button>
      </div>
    </header>

    <section class="card">
      <p>כאן יופיעו המשימות.</p>
    </section>

    <ChangePasswordDialog ref="passwordDialog" />
  </main>
</template>

<style scoped>
.page {
  max-width: 1040px;
  margin-inline: auto;
  padding-block: 48px 64px;
  padding-left: max(16px, env(safe-area-inset-left, 0px));
  padding-right: max(16px, env(safe-area-inset-right, 0px));
}
.top {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px 24px;
  margin-bottom: 24px;
}
.heading { min-width: 0; }
h1 { margin: 0; color: var(--navy); font-size: 32px; font-weight: 700; line-height: 1.25; }
.email { margin: 2px 0 0; color: var(--muted); font-size: 14px; text-align: right; overflow-wrap: anywhere; }
.account { display: flex; gap: 8px; }
.card { padding: 24px; background: var(--card); border-radius: 10px; box-shadow: var(--shadow); }
.card p { margin: 0; color: var(--muted); }

@media (max-width: 720px) {
  .page { padding-block: 24px 40px; }
  h1 { font-size: 28px; }
}
</style>
