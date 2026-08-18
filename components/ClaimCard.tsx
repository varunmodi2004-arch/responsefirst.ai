import Link from "next/link";
import type { ClaimWithRelations } from "@/lib/database.types";
import { STAGE_LABELS, stageTone } from "@/lib/labels";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

/**
 * Phase 2D — name-first ClaimCard hierarchy:
 *   Name  →  address  →  attention signal  →  stage  →  financial  →  details
 *
 * Backend-controlled fields (is_stalled, needs_attention, stall_reason,
 * days_in_current_stage) are read-only display. The dashboard never
 * writes to these — W6 (Daily Stall Detection) is the sole producer.
 */
export function ClaimCard({ claim }: { claim: ClaimWithRelations }) {
  const customer = claim.customers;

  // Contractor estimate minus insurance estimate — a positive gap means
  // insurance is underpaying relative to the contractor's assessment.
  // Only show when both values are real numbers from live data.
  const underpaidAmount =
    claim.contractor_estimate != null && claim.insurance_estimate != null
      ? claim.contractor_estimate - claim.insurance_estimate
      : null;

  return (
    <Card interactive padding="md" className="group">
      <Link
        href={`/dashboard/claim/${claim.id}`}
        className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate/40 focus-visible:ring-offset-2 focus-visible:ring-offset-paper-raised"
      >
        {/* 1. Name — hero */}
        <p className="font-display text-base font-semibold text-ink">
          {customer?.name ?? "Customer"}
        </p>

        {/* 2. Address */}
        {customer?.property_address && (
          <p className="mt-0.5 truncate text-sm text-ink-muted">
            {customer.property_address}
          </p>
        )}

        {/* 3. Attention signal (read-only from backend) */}
        {claim.needs_attention && (
          <div className="mt-2">
            <Badge tone="accent-strong">Needs attention</Badge>
          </div>
        )}

        {/* 4. Stage badge */}
        <div className="mt-2 flex items-center gap-2">
          <Badge tone={stageTone(claim.stage)}>
            {STAGE_LABELS[claim.stage] ?? claim.stage}
          </Badge>
        </div>

        {/* 5. Stall signal — uses real days_in_current_stage from DB (read-only) */}
        {claim.is_stalled && claim.days_in_current_stage > 0 && (
          <p className="mt-2 text-xs font-medium italic text-ink-muted">
            Stuck {claim.days_in_current_stage} day{claim.days_in_current_stage !== 1 ? "s" : ""}
            {claim.stall_reason ? ` — ${claim.stall_reason}` : ""}
          </p>
        )}

        {/* 6. Financial signal — only when the underlying numbers support it */}
        {underpaidAmount != null && underpaidAmount > 0 && (
          <p className="mt-2 text-xs font-medium text-accent-hover">
            Underpaid by ${underpaidAmount.toLocaleString()}
          </p>
        )}

        {/* 7. Carrier */}
        {claim.insurance_carrier && (
          <p className="mt-1 text-xs text-ink-muted">{claim.insurance_carrier}</p>
        )}
      </Link>
    </Card>
  );
}
