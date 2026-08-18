import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import type { Contractor } from '@/lib/database.types'

/**
 * Fetches the current user's contractor row.
 *
 * There's no user_id filter in the query below on purpose — RLS
 * (`contractors_select_own`, from 20260710120100_contractors.sql)
 * already restricts this to exactly one row: the caller's own. That
 * policy is the actual security boundary; the getClaims() check here is
 * defense in depth so this function fails predictably (returns null)
 * if it's ever called somewhere proxy.ts didn't already gate, rather
 * than surfacing a confusing Postgres error.
 *
 * Returns null if there's no authenticated user, or if the row somehow
 * doesn't exist yet (shouldn't happen — handle_new_user() creates it
 * synchronously on signup — but a network hiccup between auth and the
 * trigger completing is cheaper to handle here than to leave as a
 * crash).
 *
 * Wrapped in React's cache() since Phase 4 calls this from both the
 * dashboard layout and individual pages in the same request — without
 * this, that's two round trips for identical data on every navigation.
 */
export const getContractor = cache(async (): Promise<Contractor | null> => {
  const supabase = await createClient()

  const { data: claims } = await supabase.auth.getClaims()
  if (!claims) return null

  const { data: contractor, error } = await supabase
    .from('contractors')
    .select('*')
    .single()

  if (error) {
    console.error('getContractor:', error.message)
    return null
  }

  return contractor
})
