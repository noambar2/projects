import { shallowRef } from 'vue'
import { isAuthRetryableFetchError, type AuthError, type Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export const session = shallowRef<Session | null>(null)

/** Resolves once the stored session, if any, has been read. */
export const authReady = supabase.auth.getSession().then(({ data }) => {
  session.value = data.session
})

supabase.auth.onAuthStateChange((_event, nextSession) => {
  session.value = nextSession
})

export const MIN_PASSWORD_LENGTH = 8

export async function signIn(email: string, password: string): Promise<string | null> {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (!error) return null
  return error.code === 'invalid_credentials' ? 'האימייל או הסיסמה שגויים.' : describeAuthError(error)
}

/** Signs out this device only, so the other devices stay signed in. */
export async function signOut(): Promise<void> {
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

function describeAuthError(error: AuthError): string {
  if (isAuthRetryableFetchError(error)) return 'אין חיבור לשרת. כדאי לבדוק את האינטרנט ולנסות שוב.'
  switch (error.code) {
    case 'over_request_rate_limit':
    case 'over_email_send_rate_limit':
      return 'היו יותר מדי ניסיונות. כדאי לחכות כמה דקות ולנסות שוב.'
    case 'weak_password':
      return 'הסיסמה החדשה חלשה מדי. כדאי לבחור סיסמה ארוכה יותר.'
    case 'same_password':
      return 'הסיסמה החדשה זהה לנוכחית.'
    default:
      return 'משהו השתבש. כדאי לנסות שוב.'
  }
}
