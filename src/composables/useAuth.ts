import { ref, shallowRef, watch } from 'vue'
import { useRouter } from 'vue-router'
import { isAuthRetryableFetchError, type AuthError, type Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export const session = shallowRef<Session | null>(null)

/** True only after arriving through a password reset email, which proves who the user is. */
export const inPasswordRecovery = ref(false)

/** Resolves once the stored session, if any, has been read. */
export const authReady = supabase.auth.getSession().then(({ data }) => {
  session.value = data.session
})

supabase.auth.onAuthStateChange((event, nextSession) => {
  session.value = nextSession
  if (event === 'PASSWORD_RECOVERY') inPasswordRecovery.value = true
})

export const MIN_PASSWORD_LENGTH = 8

let signingOutHere = false

/**
 * For private pages. Choosing to sign out leads to the links page. A session that ended
 * any other way, such as expiring, leads to login so the user can continue.
 */
export function useRedirectWhenSignedOut() {
  const router = useRouter()
  watch(session, (value) => {
    if (value) return
    router.replace(signingOutHere ? '/' : '/login')
    signingOutHere = false
  })
}

export async function signIn(email: string, password: string): Promise<string | null> {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (!error) return null
  return error.code === 'invalid_credentials' ? 'האימייל או הסיסמה שגויים.' : describeAuthError(error)
}

/** Signs out this device only, so the other devices stay signed in. */
export async function signOut(): Promise<void> {
  signingOutHere = true
  await supabase.auth.signOut({ scope: 'local' })
}

/** Confirms the current password first, so an unlocked device alone can't change it. */
export async function changePassword(currentPassword: string, newPassword: string): Promise<string | null> {
  const email = session.value?.user.email
  if (!email) return 'החיבור פג. צריך להתחבר מחדש.'

  const check = await supabase.auth.signInWithPassword({ email, password: currentPassword })
  if (check.error) {
    return check.error.code === 'invalid_credentials' ? 'הסיסמה הנוכחית שגויה.' : describeAuthError(check.error)
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword })
  return error ? describeAuthError(error) : null
}

/** Doesn't reveal whether the address has an account: Supabase answers the same either way. */
export async function requestPasswordReset(email: string): Promise<string | null> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${location.origin}${import.meta.env.BASE_URL}reset-password`,
  })
  return error ? describeAuthError(error) : null
}

export async function setNewPassword(password: string): Promise<string | null> {
  const { error } = await supabase.auth.updateUser({ password })
  if (error) return describeAuthError(error)
  inPasswordRecovery.value = false
  return null
}

function describeAuthError(error: AuthError): string {
  if (isAuthRetryableFetchError(error)) return 'אין חיבור לשרת. כדאי לבדוק את האינטרנט ולנסות שוב.'
  switch (error.code) {
    case 'over_request_rate_limit':
    case 'over_email_send_rate_limit':
      return 'היו יותר מדי ניסיונות. כדאי לחכות כמה דקות ולנסות שוב.'
    case 'email_address_not_authorized':
      return 'אי אפשר לשלוח כרגע מייל לכתובת הזו. כדאי לפנות למנהלת האתר.'
    case 'weak_password':
      return 'הסיסמה החדשה חלשה מדי. כדאי לבחור סיסמה ארוכה יותר.'
    case 'same_password':
      return 'הסיסמה החדשה זהה לנוכחית.'
    default:
      return 'משהו השתבש. כדאי לנסות שוב.'
  }
}
