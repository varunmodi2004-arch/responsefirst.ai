import Link from "next/link";
import { getContractor } from "@/lib/contractor";
import { getPendingBriefs } from "@/lib/briefs";
import { getPipelineStats } from "@/lib/claims";
import { MorningBriefing } from "@/components/MorningBriefing";
import { LeadCard } from "@/components/LeadCard";

/**
 * Phase 2C Home — the "15-second rule" screen. A contractor opens the
 * dashboard and immediately understands: who to call first, why, and
 * what else needs attention.
 *
 * Composition:
 *   MorningBriefing  (greeting + context + CTA)
 *   Top LeadCard     (the single highest-priority lead)
 *   "See all" link   (to /dashboard/leads)
 *
 * Replaces the Phase 1 AlertCards + StatsBar + full LeadCardList.
 * All data is already seed-filtered in lib/briefs.ts and lib/claims.ts.
 */
export default async function HomePage() {
  const [contractor, briefs, stats] = await Promise.all([
    getContractor(),
    getPendingBriefs(),
    getPipelineStats(),
  ]);

  const topLead = briefs[0] ?? null;

  return (
    <div className="animate-fade-up space-y-4">
      <MorningBriefing
        ownerName={contractor?.owner_name ?? null}
        topLead={topLead}
        pendingCount={briefs.length}
        stats={stats}
      />

      {topLead && (
        <div className="space-y-3">
          <LeadCard brief={topLead} />
          {briefs.length > 1 && (
            <Link
              href="/dashboard/leads"
              className="block text-center text-sm font-medium text-accent-hover hover:underline"
            >
              See all {briefs.length} leads →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
