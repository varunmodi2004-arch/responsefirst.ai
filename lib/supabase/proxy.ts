import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Route prefixes that require an authenticated session. Add to this
 * list as new protected areas ship (Phase 4+).
 */
const PROTECTED_PREFIXES = ['/dashboard']

/**
 * Refreshes the Supabase session on every matched request and gates
 * protected routes. Named `proxy` throughout (not `middleware`) because
 * Next.js 16 renamed the file convention — see the root `proxy.ts` for
 * the one-line explanation. This file is the actual logic; `proxy.ts`
 * just wires it into the file convention Next.js looks for.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Write refreshed cookies to the incoming request (so any
          // Server Component reached by this same request sees the new
          // token) AND to the outgoing response (so the browser gets it).
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // getClaims() verifies the JWT (locally against the project's JWKS
  // when possible, otherwise via the Auth server) and refreshes an
  // expiring session as a side effect. Deliberately NOT using
  // getSession() here — its embedded user object is read straight from
  // the cookie and isn't verified, so it can't be trusted for gating.
  const { data } = await supabase.auth.getClaims()
  const isAuthenticated = !!data?.claims

  const path = request.nextUrl.pathname
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`)
  )

  if (isProtected && !isAuthenticated) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return response
}
