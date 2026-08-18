import { getProcessedBriefs } from "@/lib/briefs";
import { getClaimByBriefId } from "@/lib/claims";
import { EmptyState } from "@/components/ui/EmptyState";
import { FollowUpCard } from "@/components/FollowUpCard";

/**
 * Follow-ups screen — v3.1 Section 9 Screen 6. "What happened with
 * leads I already contacted?" A static list (no timers/reminders —
 * that system is explicitly out of scope; see
 * PHASE2_DATA_CONTRACT_ADDENDUM.md Section 1).
 */
export default async function FollowUpsPage() {
  const briefs = await getProcessedBriefs();

  // Only booked briefs can have a claim; look those up in parallel
  // rather than one-by-one, and skip the query entirely for everyone else.
  const bookedIds = briefs.filter((b) => b.status === "booked").map((b) => b.id);
  const claimIdEntries = await Promise.all(
    bookedIds.map(async (briefId) => [briefId, await getClaimByBriefId(briefId)] as const)
  );
  const claimIdByBriefId = new Map(claimIdEntries);

  return (
    <div className="animate-fade-up space-y-6">
      {briefs.length === 0 ? (
        <EmptyState
          icon="📋"
          title="No leads processed yet"
          subtitle="Start by contacting a lead from the Leads tab."
        />
      ) : (
        <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {briefs.map((brief) => (
            <li key={brief.id}>
              <FollowUpCard brief={brief} claimId={claimIdByBriefId.get(brief.id) ?? null} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
