import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/proxy'

/**
 * proxy.ts — Next.js 16+ (this file was called middleware.ts, exporting
 * a `middleware` function, in Next.js 15 and earlier).
 *
 * A leftover middleware.ts is NOT an error in Next.js 16 — it's just
 * silently ignored at build time, which means route protection quietly
 * stops working with no warning. If you're reading this after an
 * upgrade and auth seems to have stopped gating /dashboard, check that
 * this is still named proxy.ts and the function below is still named
 * `proxy`, not `middleware`.
 *
 * https://nextjs.org/docs/app/api-reference/file-conventions/proxy
 */
export async function proxy(request: NextRequest) {
  return updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Run on every path except static assets and image optimization
     * files, so we're not spending a Supabase call on every JS chunk.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
