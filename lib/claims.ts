import { createClient } from "@/lib/supabase/server";
import type { ClaimWithRelations, ClaimActivity } from "@/lib/database.types";

const CLAIM_SELECT = `
  *,
  customers ( name, phone, property_address )
`;

/** All active (not yet paid out) claims, grouped by stage on the
 * client side — one query, not one per stage. */
export async function getActiveClaims(): Promise<ClaimWithRelations[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("claims")
    .select(CLAIM_SELECT)
    .neq("stage", "payment_collected")
    .neq("provenance_source", "seed")
    .order("needs_attention", { ascending: false })
    .order("created_at", { ascending: false })
    .returns<ClaimWithRelations[]>();

  if (error) {
    console.error("getActiveClaims:", error.message);
    return [];
  }

  return data ?? [];
}

/** claims.brief_id is a UNIQUE FK, so at most one claim can exist per
 * brief — this just needs the id, not a full ClaimWithRelations, for
 * building a "View claim →" link (Follow-ups; also BookedCelebration
 * in Phase 2B). Returns null both when no claim exists yet (WF5 hasn't
 * run/finished) and on error — callers treat those the same: no link
 * shown, or a "still being created" retry for the booked-just-now case. */
export async function getClaimByBriefId(briefId: string): Promise<string | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("claims")
    .select("id")
    .eq("brief_id", briefId)
    .maybeSingle();

  if (error || !data) return null;

  return data.id;
}

export async function getClaim(id: string): Promise<ClaimWithRelations | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("claims")
    .select(CLAIM_SELECT)
    .eq("id", id)
    .maybeSingle()
    .returns<ClaimWithRelations>();

  if (error) {
    console.error("getClaim:", error.message);
    return null;
  }

  return data;
}

export async function getAttentionClaims(): Promise<ClaimWithRelations[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("claims")
    .select(CLAIM_SELECT)
    .eq("needs_attention", true)
    .neq("provenance_source", "seed")
    .order("created_at", { ascending: false })
    .returns<ClaimWithRelations[]>();

  if (error) {
    console.error("getAttentionClaims:", error.message);
    return [];
  }

  return data ?? [];
}

export async function getClaimActivities(claimId: string): Promise<ClaimActivity[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("claim_activities")
    .select("*")
    .eq("claim_id", claimId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getClaimActivities:", error.message);
    return [];
  }

  return data ?? [];
}

export type PipelineStats = {
  claimCount: number;
  totalValue: number;
  supplementPending: number;
  needsAttention: number;
};

/** The Pipeline header's 4 numbers. All real from day one — the
 * original spec's own queries, just needsAttention will read 0 until
 * Phase 6's stall-detection cron actually sets that flag on anything.
 * Same "Coming in Phase 6" situation the Today screen's stats bar
 * already models for Phase 5 itself. */
export async function getPipelineStats(): Promise<PipelineStats> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("claims")
    .select("contractor_estimate, insurance_estimate, final_approved_amount, supplement_status, needs_attention")
    .neq("stage", "payment_collected")
    .neq("provenance_source", "seed");

  if (error) {
    console.error("getPipelineStats:", error.message);
    return { claimCount: 0, totalValue: 0, supplementPending: 0, needsAttention: 0 };
  }

  const rows = data ?? [];
  const totalValue = rows.reduce((sum, c) => {
    const value = c.final_approved_amount ?? c.insurance_estimate ?? c.contractor_estimate ?? 0;
    return sum + value;
  }, 0);

  return {
    claimCount: rows.length,
    totalValue,
    supplementPending: rows.filter((c) =>
      c.supplement_status === "filed" || c.supplement_status === "pending_response"
    ).length,
    needsAttention: rows.filter((c) => c.needs_attention).length,
  };
}
