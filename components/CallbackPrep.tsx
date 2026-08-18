import type { Brief } from "@/lib/database.types";
import { Card } from "@/components/ui/Card";

type CallbackPrepBrief = Pick<
  Brief,
  "insurance_carrier" | "has_filed_claim" | "damage_type" | "damage_severity" | "interior_damage" | "missing_fields"
>;

const CHECKLIST: { field: keyof Omit<CallbackPrepBrief, "missing_fields">; text: string }[] = [
  { field: "insurance_carrier", text: "Ask about their insurance carrier" },
  { field: "has_filed_claim", text: "Ask if they've filed a claim" },
  { field: "damage_type", text: "Confirm type of damage" },
  { field: "damage_severity", text: "Assess damage severity" },
  { field: "interior_damage", text: "Check for interior damage" },
];

/**
 * v3.1 Section 9 Screen 3 Section 6, extended per the earlier decision
 * on missing_fields: prefer the real `missing_fields` column (live V2
 * data, an AI-curated gap list — see PHASE2_DATA_CONTRACT_ADDENDUM.md)
 * when it's populated; fall back to v3.1's original null-check logic
 * otherwise (true for ~14/17 real briefs, the pre-V2 ones). Show only
 * if at least one item is actually missing by whichever source is in
 * play — never invents a gap that isn't real by either measure.
 */
export function CallbackPrep(brief: CallbackPrepBrief) {
  const source = brief.missing_fields && brief.missing_fields.length > 0 ? brief.missing_fields : null;

  const missing = CHECKLIST.filter((item) =>
    source ? source.includes(item.field) : brief[item.field] === null
  );

  if (missing.length === 0) return null;

  return (
    <Card>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">Before you call</p>
      <ul className="space-y-1.5">
        {missing.map((item) => (
          <li key={item.field} className="flex items-start gap-1.5 text-sm text-ink">
            <span aria-hidden="true" className="text-ink-muted">☐</span>
            {item.text}
          </li>
        ))}
      </ul>
    </Card>
  );
}
