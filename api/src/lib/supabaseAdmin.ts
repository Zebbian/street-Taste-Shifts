import { createClient } from '@supabase/supabase-js'
import { env } from '../env.js'

/**
 * Server-only Supabase client using the secret key. Never import this from
 * anything that could ship to a browser bundle. Used exclusively for
 * managing auth users (invite/deactivate) via the Admin API.
 */
export const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})
