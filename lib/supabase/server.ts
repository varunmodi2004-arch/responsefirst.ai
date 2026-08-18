import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/database.types'

/**
 * Supabase client for server-side code (Server Components, Route
 * Handlers, Server Actions). Bound to the request's cookies so RLS
 * policies see the right `auth.uid()`.
 *
 * Server Components can't write cookies (Next.js will throw if you try),
 * so `setAll` below is wrapped in a try/catch — a Server Component
 * calling this mid-render will hit that catch and silently no-op, which
 * is fine as long as `proxy.ts` is also refreshing the session on every
 * request. Route Handlers and Server Actions CAN write cookies, so the
 * same code path works for both without branching.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from a Server Component during render — no-op.
            // proxy.ts refreshes and persists the session cookie for
            // every request, so this is safe to ignore here.
          }
        },
      },
    }
  )
}
