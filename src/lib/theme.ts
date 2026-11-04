import type { RouteLocationNormalized } from 'vue-router'

// The palettes follow the מתגייסים site. Their colors live in styles/themes.css.
export const THEMES = [
  { id: 'light', name: 'בהיר', swatch: 'linear-gradient(135deg, #245377, #008ff0)' },
  { id: 'dark', name: 'כהה', swatch: 'linear-gradient(135deg, #102230, #2d8ac4)' },
  { id: 'purple', name: 'סגול', swatch: 'linear-gradient(135deg, #342866, #7a5cf0)' },
  { id: 'teal', name: 'טורקיז', swatch: 'linear-gradient(135deg, #16484a, #0aa2a2)' },
  { id: 'sunset', name: 'שקיעה', swatch: 'linear-gradient(135deg, #5e2d1c, #e2622c)' },
  { id: 'rose', name: 'ורוד', swatch: 'linear-gradient(135deg, #5c203a, #d63b73)' },
  { id: 'playful', name: 'צבעוני', swatch: 'conic-gradient(#7c5cf5, #ff7a1a, #00b3c7, #2eb872, #e6398b, #7c5cf5)' },
] as const

export type ThemeId = (typeof THEMES)[number]['id']

const STORAGE_KEY = 'tasks:theme' // Also read by the inline script in index.html.

export function getStoredTheme(): ThemeId {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return THEMES.find((theme) => theme.id === stored)?.id ?? 'light'
  } catch {
    return 'light'
  }
}

export function storeTheme(id: ThemeId) {
  document.documentElement.dataset.theme = id
  try {
    localStorage.setItem(STORAGE_KEY, id)
  } catch {
    // The choice just won't be remembered.
  }
}

/** Themes cover the private area only: the public links page keeps its single look. */
export function applyThemeFor(route: RouteLocationNormalized) {
  const root = document.documentElement
  if (route.meta.requiresAuth || route.meta.guestOnly) {
    root.dataset.theme = getStoredTheme()
    root.dataset.page = route.path.slice(1)
  } else {
    delete root.dataset.theme
    delete root.dataset.page
  }
}
