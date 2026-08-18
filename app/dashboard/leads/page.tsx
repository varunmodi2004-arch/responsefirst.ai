import { getContractor } from "@/lib/contractor";
import { getPendingBriefs } from "@/lib/briefs";
import { EmptyState } from "@/components/ui/EmptyState";
import { LeadCardList } from "@/components/LeadCardList";

/**
 * Leads screen — v3.1 Section 9 Screen 2. "Who should I call next?"
 *
 * Phase 2A: relocates the pending-briefs list Phase 1's Today page
 * used to own, unchanged (same query, same LeadCardList, same
 * LeadCard). The name-first LeadCard rework (TierBadge/ActionLabel/
 * WaitingTime) is Phase 2B — this route intentionally doesn't touch
 * that yet, so today it looks identical to the old Today page's list.
 */
export default async function LeadsPage() {
  const [contractor, briefs] = await Promise.all([getContractor(), getPendingBriefs()]);

  const hasPhoneNumber = !!contractor?.twilio_phone_number;

  return (
    <div className="animate-fade-up space-y-6">
      {briefs.length === 0 ? (
        <EmptyState
          icon={hasPhoneNumber ? "📞" : "☎️"}
          title={hasPhoneNumber ? "All caught up" : "Your phone line isn't set up yet"}
          subtitle={
            hasPhoneNumber
              ? "No leads waiting. Check your follow-ups for recent activity."
              : "Sarah can't take calls until a number is provisioned for your account. Reach out and we'll get you connected."
          }
        />
      ) : (
        <>
          <p className="text-sm text-ink-muted">
            {briefs.length} lead{briefs.length !== 1 ? "s" : ""} waiting
          </p>
          <LeadCardList contractorId={contractor?.id ?? ""} initialBriefs={briefs} />
        </>
      )}
    </div>
  );
}
