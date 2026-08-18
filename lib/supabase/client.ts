import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/lib/database.types'

/**
 * Supabase client for the browser (Client Components only).
 * Reads the session from cookies that the server client / proxy already
 * manage — this client never needs to touch cookies directly itself.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
