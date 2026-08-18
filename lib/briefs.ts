import { createClient } from "@/lib/supabase/server";
import type { BriefWithRelations } from "@/lib/database.types";

const BRIEF_SELECT = `
  *,
  customers ( name, phone, property_address ),
  transcripts ( transcript_text, recording_url, created_at, duration_seconds )
`;

/**
 * Pending briefs for the Today screen, one round trip via PostgREST
 * embedding rather than fetching briefs then separately fetching
 * customers/transcripts per row.
 *
 * Sorted by lead_score (there's a dedicated index for this —
 * briefs_lead_score_idx — from Phase 1). NULLS LAST is explicit
 * because Postgres's default DESC sort puts NULLs first, which would
 * shove any brief the AI couldn't score above real high-value leads.
 */
export async function getPendingBriefs(): Promise<BriefWithRelations[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("briefs")
    .select(BRIEF_SELECT)
    .eq("status", "pending")
    .neq("provenance_source", "seed")
    .order("lead_score", { ascending: false, nullsFirst: false })
    .returns<BriefWithRelations[]>();

  if (error) {
    console.error("getPendingBriefs:", error.message);
    return [];
  }

  return data ?? [];
}

const RECORDING_EXPIRY_MINUTES = 10;

/** Single brief for the Win Brief Detail screen. Null means either it
 * doesn't exist or (via RLS) it isn't this contractor's — the caller
 * treats both the same way: a 404.
 *
 * `recordingLikelyExpired` is computed here, not in the page component,
 * because calling Date.now() inside a component's render body trips
 * the react-hooks/purity lint rule (it can't tell a Server Component
 * apart from one that might re-render) — a plain async data function
 * isn't a component or hook, so it's not subject to that rule at all.
 */
export async function getBrief(
  id: string
): Promise<(BriefWithRelations & { recordingLikelyExpired: boolean }) | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("briefs")
    .select(BRIEF_SELECT)
    .eq("id", id)
    .maybeSingle()
    .returns<BriefWithRelations>();

  if (error) {
    console.error("getBrief:", error.message);
    return null;
  }

  if (!data) return null;

  const callEndedAt = data.transcripts?.created_at;
  const minutesSinceCall = callEndedAt
    ? (Date.now() - new Date(callEndedAt).getTime()) / 60_000
    : Infinity;

  return { ...data, recordingLikelyExpired: minutesSinceCall > RECORDING_EXPIRY_MINUTES };
}

/** Just the count for the Today screen's stats bar — cheaper than
 * fetching full rows when all that's needed is a number. */
export async function getPendingBriefCount(): Promise<number> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from("briefs")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending")
    .neq("provenance_source", "seed");

  if (error) {
    console.error("getPendingBriefCount:", error.message);
    return 0;
  }

  return count ?? 0;
}

/**
 * Processed briefs (any outcome other than pending) for the Follow-ups
 * screen — "what happened with leads I already contacted." Same
 * BRIEF_SELECT join as getPendingBriefs/getBrief, unchanged.
 *
 * Sorted by status_updated_at (most recently actioned first), not
 * created_at — a lead contacted last week but marked "booked" an hour
 * ago should surface above one marked "lost" yesterday. NULLS LAST
 * because a brief could in principle reach a non-pending status without
 * that column being set.
 *
 * Capped at 50: this is a recent-activity list, not an archive browser.
 */
export async function getProcessedBriefs(): Promise<BriefWithRelations[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("briefs")
    .select(BRIEF_SELECT)
    .neq("status", "pending")
    .neq("provenance_source", "seed")
    .order("status_updated_at", { ascending: false, nullsFirst: false })
    .limit(50)
    .returns<BriefWithRelations[]>();

  if (error) {
    console.error("getProcessedBriefs:", error.message);
    return [];
  }

  return data ?? [];
}
