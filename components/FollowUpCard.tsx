import Link from "next/link";
import type { BriefWithRelations } from "@/lib/database.types";
import { BRIEF_STATUS_LABELS, briefStatusTone } from "@/lib/labels";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

/**
 * Follow-ups list item — v3.1 Section 9 Screen 6. Deliberately not
 * call-to-action shaped like LeadCard (no "Call now" button): these
 * are leads already contacted, so the action is reviewing what
 * happened, not calling again. Phase 2C (task C4) revises this
 * component further; this is the functional Phase 2A version.
 */
export function FollowUpCard({
  brief,
  claimId,
}: {
  brief: BriefWithRelations;
  claimId: string | null;
}) {
  const customer = brief.customers;
  const valueLabel = formatValueRange(brief.estimated_value_low, brief.estimated_value_high);
  const timeAgo = formatTimeAgo(brief.status_updated_at);

  return (
    <Card padding="md">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-ink">{customer?.name ?? "Caller"}</p>
        <Badge tone={briefStatusTone(brief.status)}>{BRIEF_STATUS_LABELS[brief.status]}</Badge>
      </div>

      <p className="mt-1 text-xs text-ink-muted">{timeAgo}</p>

      {brief.damage_description && (
        <p className="mt-2 truncate text-sm text-ink-muted">{brief.damage_description}</p>
      )}

      {valueLabel && <p className="mt-1 text-sm font-medium text-ink">{valueLabel}</p>}

      <div className="mt-3">
        {brief.status === "booked" && claimId ? (
          <Link href={`/dashboard/claim/${claimId}`} className="text-sm font-medium text-accent-hover hover:underline">
            View claim →
          </Link>
        ) : (
          <Link href={`/dashboard/brief/${brief.id}`} className="text-sm font-medium text-accent-hover hover:underline">
            View brief →
          </Link>
        )}
      </div>
    </Card>
  );
}

/** Same $XK–$YK convention as LeadCard's formatValueRange, but hidden
 * (not "Value pending") when either bound is missing — this is a
 * secondary line here, not the card's hero. */
function formatValueRange(low: number | null, high: number | null): string | null {
  if (low == null || high == null) return null;
  const fmt = (n: number) => (n >= 1000 ? `$${Math.round(n / 1000)}K` : `$${Math.round(n)}`);
  return `${fmt(low)}–${fmt(high)}`;
}

function formatTimeAgo(isoString: string | null): string {
  if (!isoString) return "—";
  const minutes = Math.max(0, (Date.now() - new Date(isoString).getTime()) / 60_000);
  if (minutes < 60) return `${Math.round(minutes)}m ago`;
  const hours = minutes / 60;
  if (hours < 24) return `${Math.round(hours)}h ago`;
  const days = hours / 24;
  return `${Math.round(days)}d ago`;
}
