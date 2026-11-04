import { createRouter, createWebHistory } from 'vue-router'
import { applyThemeFor } from '@/lib/theme'
import HomeView from '@/views/HomeView.vue'

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    guestOnly?: boolean
    themed?: boolean
  }
}

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', component: HomeView },
    { path: '/login', component: () => import('@/views/LoginView.vue'), meta: { guestOnly: true } },
    { path: '/reset-password', component: () => import('@/views/ResetPasswordView.vue'), meta: { themed: true } },
    { path: '/tasks', component: () => import('@/views/TasksView.vue'), meta: { requiresAuth: true } },
    { path: '/settings', component: () => import('@/views/SettingsView.vue'), meta: { requiresAuth: true } },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

// Auth is imported on demand so the public links page doesn't load the Supabase client.
router.beforeEach(async (to) => {
  if (!to.meta.requiresAuth && !to.meta.guestOnly) return

  const { authReady, session } = await import('@/composables/useAuth')
  await authReady

  if (to.meta.requiresAuth && !session.value) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }
  if (to.meta.guestOnly && session.value) return { path: '/tasks' }
})

router.afterEach(applyThemeFor)
