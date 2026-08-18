import type { ClaimStage, UrgencyLevel, BriefStatus, ContactPermission } from "@/lib/database.types";
import type { BadgeTone } from "@/components/ui/Badge";

export const STAGE_ORDER: ClaimStage[] = [
  "claim_filed",
  "adjuster_scheduled",
  "estimate_received",
  "supplement_filed",
  "supplement_approved",
  "in_production",
  "completed",
  "payment_collected",
];

export const STAGE_LABELS: Record<ClaimStage, string> = {
  claim_filed: "Claim filed",
  adjuster_scheduled: "Adjuster scheduled",
  estimate_received: "Estimate received",
  supplement_filed: "Supplement filed",
  supplement_approved: "Supplement approved",
  in_production: "In production",
  completed: "Completed",
  payment_collected: "Payment collected",
};

/** completed/payment_collected read as a genuine win — everything
 * earlier in the pipeline is still in motion, so it gets the neutral
 * "in progress" treatment rather than borrowing the attention color. */
export function stageTone(stage: ClaimStage): "confirm-soft" | "slate-soft" {
  return stage === "completed" || stage === "payment_collected" ? "confirm-soft" : "slate-soft";
}

/**
 * FINALIZED (decision, Aug 14 2026): critical > emergency > high >
 * standard > low. `emergency` and `standard` are live urgency_level
 * values not in v3.1 Section 6.3 (spec predates them). Per the live
 * Workflow 2 urgency-determination table: `emergency` is the 15-minute
 * SLA tier between `critical` and `high` (active leak, no life-safety
 * trigger) — same escalate-now tone as critical, distinguished by
 * label text, not color. `standard` occupies the position `medium`
 * used to hold, between `high` and `low` — same tone as medium.
 *
 * Not currently rendered on LeadCard or Brief Detail: v3.1's data
 * contracts for both (Screen 2 / Screen 3 Section 1) don't list a raw
 * urgency badge as an element, and Design Principle 5 ("Urgency Is
 * Time, Not Color") explicitly has WaitingTime + TierBadge +
 * ActionLabel replace it. Kept here, finalized and correct, in case a
 * future screen needs it.
 */
export const URGENCY_TONE: Record<UrgencyLevel, "accent-strong" | "accent-soft" | "slate-soft" | "neutral"> = {
  critical: "accent-strong",
  emergency: "accent-strong",
  high: "accent-soft",
  medium: "slate-soft",
  standard: "slate-soft",
  low: "neutral",
};

export function urgencyLabel(level: UrgencyLevel): string {
  return level.charAt(0).toUpperCase() + level.slice(1);
}

/** v3.1 Section 6.2: lead_score -> tier badge. null/<20 -> no badge
 * (return null, not a "—" badge). "Early"'s "Gray, outline" and
 * "Elite"'s "Green, strong" needed Badge extended (outline prop,
 * confirm-strong tone) — see components/ui/Badge.tsx. */
export function leadScoreTier(
  score: number | null
): { label: string; tone: BadgeTone; outline?: boolean } | null {
  if (score == null || score < 20) return null;
  if (score >= 85) return { label: "Elite", tone: "confirm-strong" };
  if (score >= 65) return { label: "Strong", tone: "slate-soft" };
  if (score >= 40) return { label: "Good", tone: "neutral" };
  return { label: "Early", tone: "neutral", outline: true };
}

/**
 * v3.1 Section 6.1: the 7-value V2 recommended_action taxonomy
 * (decision, Aug 14 2026: canonical — this is the only enum the
 * dashboard maps to a badge). `call_911_instruct` MUST read
 * distinctly from the other "call now" variants — never let it fall
 * through to a generic label; see the warning in v3.1 6.1.
 *
 * Legacy free-text values (14 of 17 real briefs as of Aug 14 2026 —
 * see PHASE2_DATA_CONTRACT_ADDENDUM.md) are NOT in this map and are
 * deliberately not force-fit into it: ActionLabel displays them
 * plainly instead of badging them. No taxonomy is invented for them.
 */
export const ACTION_LABELS: Record<string, { label: string; tone: BadgeTone }> = {
  call_911_instruct: { label: "🚨 Emergency", tone: "accent-strong" },
  escalate_on_call: { label: "Call now", tone: "accent-strong" },
  call_now: { label: "Call now", tone: "accent-strong" },
  call_today: { label: "Call today", tone: "accent-soft" },
  standard_callback: { label: "This week", tone: "slate-soft" },
  nurture: { label: "Low priority", tone: "neutral" },
  do_not_prioritize: { label: "No action", tone: "neutral" },
};

/**
 * v3.1 Section 6.4, extended with the 3 live values it predates
 * (tree_impact/age_wear/unknown_storm — see
 * PHASE2_DATA_CONTRACT_ADDENDUM.md Section 2). Kept defensive against
 * a 9th value the type doesn't know about yet: today's DamageType
 * union already proved narrower than live reality once, so the
 * capitalize fallback stays reachable at runtime even though TS
 * thinks every case is covered.
 */
const DAMAGE_TYPE_LABELS: Record<string, string> = {
  hail: "Hail",
  wind: "Wind",
  water: "Water",
  fire: "Fire",
  other: "Other",
  tree_impact: "Tree damage",
  age_wear: "Age & wear",
  unknown_storm: "Storm damage",
};

export function damageTypeLabel(type: string | null): string {
  if (type == null) return "—";
  return DAMAGE_TYPE_LABELS[type] ?? type.charAt(0).toUpperCase() + type.slice(1);
}

/**
 * Decision (Aug 14 2026): the Call button is disabled — not hidden —
 * when contact_permission is explicitly 'declined'. 'granted',
 * 'UNKNOWN' (the AI's own "couldn't determine" value, distinct from a
 * real decline — see PHASE2_DATA_CONTRACT_ADDENDUM.md "Gotcha"), and
 * null (pre-V2 briefs, ~14/17 rows) all leave calling enabled — this
 * function is intentionally an allowlist of exactly one blocking
 * value, not a denylist, so it fails open for every value v3.1/the
 * live schema didn't anticipate rather than silently blocking calls.
 */
export function contactBlocked(permission: ContactPermission | null): boolean {
  return permission === "declined";
}

/**
 * brief_status -> Follow-ups badge label/tone. Extends v3.1 Section
 * 6.5 (which only covers pending/contacted/booked/not_qualified/lost)
 * with the live `follow_up` value — 0 real rows use it today and no
 * button in this app sets it (no 5th outcome, per decision), but a
 * future process could set it directly, so it must render as a real
 * badge, not a raw enum string, per decision 3.
 */
export const BRIEF_STATUS_LABELS: Record<BriefStatus, string> = {
  pending: "Pending",
  contacted: "Called",
  booked: "Booked",
  not_qualified: "Not qualified",
  lost: "Lost",
  follow_up: "Follow-up",
};

export function briefStatusTone(status: BriefStatus): "confirm-soft" | "slate-soft" | "neutral" {
  if (status === "booked") return "confirm-soft";
  if (status === "contacted" || status === "follow_up") return "slate-soft";
  return "neutral"; // not_qualified, lost, pending
}
