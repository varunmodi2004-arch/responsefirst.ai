import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/** Subscribes to realtime changes on one table, scoped to a
 * contractor, and refreshes the current route when anything changes.
 * The server-fetched props stay the single source of truth — this
 * just tells Next.js when to go re-fetch them, rather than hand-
 * merging realtime payloads into local state. Three call sites
 * (leads, claims, notifications) used to each hand-roll this exact
 * effect; this is the one copy. */
export function useRealtimeRefresh(table: string, contractorId: string | undefined) {
  const router = useRouter();

  useEffect(() => {
    if (!contractorId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`${table}-${contractorId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table, filter: `contractor_id=eq.${contractorId}` },
        () => router.refresh()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, contractorId, router]);
}
