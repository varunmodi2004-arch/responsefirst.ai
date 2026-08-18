import { notFound } from "next/navigation";
import { getBrief } from "@/lib/briefs";
import { OutcomeButtons } from "@/components/OutcomeButtons";
import { NotesField } from "@/components/NotesField";
import { TranscriptCollapse } from "@/components/TranscriptCollapse";
import { RecordingCollapse } from "@/components/RecordingCollapse";
import { TierBadge } from "@/components/TierBadge";
import { ActionLabel } from "@/components/ActionLabel";
import { WhatToSay } from "@/components/WhatToSay";
import { CallbackPrep } from "@/components/CallbackPrep";
import { LeadIntelligence } from "@/components/LeadIntelligence";
import { damageTypeLabel, contactBlocked } from "@/lib/labels";
import { Card } from "@/components/ui/Card";
import { buttonClasses } from "@/components/ui/Button";

/**
 * v3.1 Section 9 Screen 3, in the exact order Phase 2B task B8
 * specifies: Name -> Risk -> WhatToSay -> Call -> Details ->
 * CallbackPrep -> LeadIntelligence -> Transcript -> Notes -> Outcomes.
 * Critical design rule (v3.1, restated in the original kickoff):
 * suggested opening appears BEFORE the call button — not after.
 */
export default async function BriefDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const brief = await getBrief(id);

  // RLS returns null both for "doesn't exist" and "not yours" — both
  // are a 404 from the contractor's point of view, deliberately not
  // distinguished (see Phase 4 plan, security considerations).
  if (!brief) notFound();

  const customer = brief.customers;
  const transcript = brief.transcripts;
  const valueLabel = formatValueRange(brief.estimated_value_low, brief.estimated_value_high);
  const blocked = contactBlocked(brief.contact_permission);

  return (
    <div className="animate-fade-up space-y-4 pb-24">
      {/* Section 1: Header */}
      <div>
        <p className="font-display text-2xl font-bold text-ink">{customer?.name ?? "Caller"}</p>
        {customer?.property_address && (
          <p className="mt-0.5 text-sm text-ink-muted">{customer.property_address}</p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <TierBadge score={brief.lead_score} />
          <ActionLabel action={brief.recommended_action} />
        </div>
        {brief.recommended_follow_up && (
          <p className="mt-1 text-sm text-ink-muted">{brief.recommended_follow_up}</p>
        )}
      </div>

      {/* Section 2: Risk Flags */}
      {brief.risk_flags.length > 0 && (
        <div className="space-y-1 rounded-lg bg-accent/10 px-3 py-2 text-sm font-medium text-accent-hover">
          {brief.risk_flags.map((flag) => (
            <p key={flag}>⚠ {flag}</p>
          ))}
        </div>
      )}

      {/* Section 3: What to Say (ABOVE the call button — see design rule above) */}
      <WhatToSay
        suggestedOpening={brief.suggested_opening}
        situationSummary={brief.situation_summary}
        keyObjections={brief.key_objections}
      />

      {/* Section 4: Call Button */}
      {customer?.phone &&
        (blocked ? (
          <div className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-line bg-paper-raised px-4 py-3 text-base font-medium text-ink-muted">
            Contact declined
          </div>
        ) : (
          <a
            href={`tel:${customer.phone}`}
            className={`${buttonClasses({ fullWidth: true })} py-3 text-base`}
          >
            📞 Call {customer.name ?? ""}
          </a>
        ))}

      {/* Section 5: Details */}
      <Card>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">Details</p>
        <dl className="space-y-2 text-sm">
          <Row label="Damage" value={damageTypeLabel(brief.damage_type)} />
          <Row label="Carrier" value={brief.insurance_carrier ?? "Unknown"} />
          <Row label="Filed claim?" value={brief.has_filed_claim == null ? "Unknown" : brief.has_filed_claim ? "Yes" : "No"} />
          <Row label="Competitor" value={competitorText(brief.competitor_mentioned, brief.competitor_name)} />
          {valueLabel && <Row label="Value" value={valueLabel} />}
        </dl>
      </Card>

      {/* Section 6: Callback Prep */}
      <CallbackPrep
        insurance_carrier={brief.insurance_carrier}
        has_filed_claim={brief.has_filed_claim}
        damage_type={brief.damage_type}
        damage_severity={brief.damage_severity}
        interior_damage={brief.interior_damage}
        missing_fields={brief.missing_fields}
      />

      {/* Section 7: Lead Intelligence */}
      <LeadIntelligence brief={brief} />

      {/* Section 8: Transcript, Recording, Notes */}
      <TranscriptCollapse text={transcript?.transcript_text ?? null} />
      <RecordingCollapse recordingUrl={transcript?.recording_url ?? null} likelyExpired={brief.recordingLikelyExpired} />

      <Card>
        <NotesField table="briefs" id={brief.id} initialNotes={brief.notes} />
      </Card>

      {/* Section 9 (+ 10: BookedCelebration, handled inside OutcomeButtons) */}
      <OutcomeButtons
        briefId={brief.id}
        currentStatus={brief.status}
        customerName={customer?.name ?? "Caller"}
        estimatedValueLow={brief.estimated_value_low}
        estimatedValueHigh={brief.estimated_value_high}
      />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="text-right font-medium text-ink">{value}</dd>
    </div>
  );
}

function competitorText(mentioned: boolean, name: string | null): string {
  if (!mentioned) return "None mentioned";
  return name ?? "Yes (unnamed)";
}

function formatValueRange(low: number | null, high: number | null): string | null {
  if (low == null || high == null) return null;
  const fmt = (n: number) => (n >= 1000 ? `$${Math.round(n / 1000)}K` : `$${Math.round(n)}`);
  return `${fmt(low)} – ${fmt(high)}`;
}
