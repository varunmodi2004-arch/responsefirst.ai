import type { BriefWithRelations } from "@/lib/database.types";

/** The 15 fields v3.1 Section 9 Screen 3 Section 7 counts for "X of 15
 * fields captured" — 14 simple non-null checks plus risk_flags
 * (counted separately below, since it's an array where "captured"
 * means non-empty, not just non-null). */
const COMPLETENESS_FIELDS = [
  "damage_type", "damage_description", "damage_severity", "interior_damage",
  "insurance_carrier", "has_filed_claim", "competitor_mentioned",
  "estimated_value_low", "estimated_value_high", "urgency", "recommended_action",
  "suggested_opening", "situation_summary", "lead_score",
] as const;

export function LeadIntelligence({ brief }: { brief: BriefWithRelations }) {
  const transcript = brief.transcripts;

  const capturedCount =
    COMPLETENESS_FIELDS.filter((field) => brief[field] != null).length +
    (brief.risk_flags.length > 0 ? 1 : 0);

  return (
    <details className="rounded-xl border border-line bg-paper-raised p-4">
      <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-ink-muted">
        What Sarah captured
      </summary>
      <ul className="mt-3 space-y-2 text-sm text-ink">
        {transcript?.created_at && (
          <li>
            Call answered ·{" "}
            {new Date(transcript.created_at).toLocaleString(undefined, {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
            {transcript.duration_seconds != null && ` · ${transcript.duration_seconds}s`}
          </li>
        )}
        {(brief.damage_type || brief.damage_description) && (
          <li>{[brief.damage_type, truncate(brief.damage_description, 60)].filter(Boolean).join(" · ")}</li>
        )}
        {brief.insurance_carrier && (
          <li>
            {brief.insurance_carrier} · Filed:{" "}
            {brief.has_filed_claim == null ? "unknown" : brief.has_filed_claim ? "yes" : "no"}
          </li>
        )}
        {brief.competitor_mentioned && (
          <li>
            {[brief.competitor_name ?? "Competitor mentioned", brief.competitor_timing].filter(Boolean).join(" · ")}
          </li>
        )}
      </ul>
      <p className="mt-3 text-xs text-ink-muted">{capturedCount} of 15 fields captured</p>
    </details>
  );
}

function truncate(text: string | null, max: number): string | null {
  if (!text) return null;
  return text.length > max ? `${text.slice(0, max)}…` : text;
}
