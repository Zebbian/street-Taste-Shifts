import { createClient, type Session } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!url || !publishableKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY')
}

/**
 * This client is used ONLY for authentication (sign-in/out, session state).
 * All application data goes through the Express API in lib/apiClient.ts —
 * this app never queries Supabase's Postgres directly from the browser.
 */
export const supabaseAuth = createClient(url, publishableKey)

export async function signInWithPassword(email: string, password: string) {
  const { data, error } = await supabaseAuth.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data.session
}

export async function signOut() {
  await supabaseAuth.auth.signOut()
}

export async function getSession(): Promise<Session | null> {
  const { data } = await supabaseAuth.auth.getSession()
  return data.session
}

export function onAuthStateChange(callback: (session: Session | null) => void) {
  const { data } = supabaseAuth.auth.onAuthStateChange((_event, session) => callback(session))
  return () => data.subscription.unsubscribe()
}
