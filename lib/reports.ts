import { createClient } from "@/lib/supabase/server";

export type WeeklyReport = {
  id: string;
  created_at: string;
  contractor_id: string;
  week_start: string;
  week_end: string;
  calls_received: number;
  briefs_generated: number;
  briefs_booked: number;
  claims_created: number;
  claims_completed: number;
  total_claim_value: number | null;
  roi_multiple: number | null;
  narrative: string | null;
  provenance_source: string | null;
};

/** Most recent non-seed weekly report for the authenticated contractor.
 * Returns null if no organic report exists yet — the caller shows
 * nothing rather than a misleading placeholder. */
export async function getLatestReport(): Promise<WeeklyReport | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("weekly_reports")
    .select("*")
    .neq("provenance_source", "seed")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("getLatestReport:", error.message);
    return null;
  }

  return data;
}
