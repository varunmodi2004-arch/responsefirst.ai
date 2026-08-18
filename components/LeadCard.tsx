import Link from "next/link";
import type { BriefWithRelations } from "@/lib/database.types";
import { contactBlocked } from "@/lib/labels";
import { Card } from "@/components/ui/Card";
import { buttonClasses } from "@/components/ui/Button";
import { TierBadge } from "@/components/TierBadge";
import { ActionLabel } from "@/components/ActionLabel";
import { WaitingTime } from "@/components/WaitingTime";

/**
 * v3.1 Section 9 Screen 2 — the exact 7-element data contract:
 * Name (hero), Tier badge, Action label, Situation line, Value range,
 * Waiting time, Call button. Deliberately does NOT show: a raw
 * urgency badge (superseded by Tier/Action/Time — Design Principle
 * 5), property_address, insurance_carrier, or risk_flags — none of
 * those are in Screen 2's contract; address and risk flags remain on
 * Brief Detail (Progressive Disclosure).
 */
export function LeadCard({ brief }: { brief: BriefWithRelations }) {
  const customer = brief.customers;
  const situationText = brief.damage_description;
  const valueLabel = formatValueRange(brief.estimated_value_low, brief.estimated_value_high);
  const secondLine = [situationText, valueLabel].filter(Boolean).join(" · ");
  const blocked = contactBlocked(brief.contact_permission);

  return (
    <Card padding="md">
      <Link
        href={`/dashboard/brief/${brief.id}`}
        className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate/40 focus-visible:ring-offset-2 focus-visible:ring-offset-paper-raised"
      >
        <div className="flex items-start justify-between gap-2">
          <p className="font-display text-lg font-semibold text-ink">{customer?.name ?? "Caller"}</p>
          <TierBadge score={brief.lead_score} />
        </div>

        <div className="mt-1">
          <ActionLabel action={brief.recommended_action} />
        </div>

        {secondLine && <p className="mt-2 truncate text-sm text-ink-muted">{secondLine}</p>}

        <div className="mt-1">
          <WaitingTime createdAt={brief.created_at} />
        </div>
      </Link>

      {customer?.phone &&
        (blocked ? (
          <div className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-line bg-paper px-4 py-2.5 text-sm font-medium text-ink-muted">
            Contact declined
          </div>
        ) : (
          <a href={`tel:${customer.phone}`} className={`${buttonClasses({ fullWidth: true })} mt-3`}>
            {callLabel(customer.name)}
          </a>
        ))}
    </Card>
  );
}

function callLabel(name: string | null | undefined): string {
  const first = name?.trim().split(/\s+/)[0];
  return first ? `📞 Call ${first}` : "📞 Call";
}

function formatValueRange(low: number | null, high: number | null): string | null {
  if (low == null || high == null) return null;
  const fmt = (n: number) => (n >= 1000 ? `$${Math.round(n / 1000)}K` : `$${Math.round(n)}`);
  return `${fmt(low)}–${fmt(high)}`;
}
