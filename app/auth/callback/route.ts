import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Both auth methods land here with a `code` param (PKCE flow):
 *  - Google OAuth redirects back after the consent screen
 *  - Magic Link redirects here after the emailed link is clicked
 *
 * Per the approved Phase 2 scope (Option B): always redirect to
 * /dashboard on success, regardless of onboarding_completed. The
 * onboarding gate is explicitly deferred to Phase 8.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    console.log("Exchange error:", error) 

    if (!error) {
      return NextResponse.redirect(`${origin}/dashboard`)
    }

    console.error("Auth callback failed:", error)
  }
    
  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
