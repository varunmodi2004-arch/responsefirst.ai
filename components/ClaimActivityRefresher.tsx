"use client";

import { useRealtimeRefresh } from "@/hooks/useRealtimeRefresh";

/** Renders nothing — just wires the claim detail page to refresh
 * when claim_activities changes, so an edit made through
 * ClaimFieldsEditable/NotesField (both client components doing their
 * own direct Supabase writes, outside Next.js's request lifecycle)
 * shows up in the Activity timeline without a manual reload. */
export function ClaimActivityRefresher({ contractorId }: { contractorId: string }) {
  useRealtimeRefresh("claim_activities", contractorId);
  return null;
}
