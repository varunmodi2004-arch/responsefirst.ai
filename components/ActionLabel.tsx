import { ACTION_LABELS } from "@/lib/labels";
import { Badge } from "@/components/ui/Badge";

/**
 * v3.1 Section 6.1 + decision (Aug 14 2026). Two distinct render
 * paths, not one fallback-of-the-other:
 *  - One of the 7 canonical V2 values -> Badge (the safety-relevant
 *    call_911_instruct case is a real, tested value here, not an
 *    edge case — see the warning in v3.1 6.1).
 *  - Anything else non-null (legacy free-text, 14/17 real briefs as
 *    of Aug 14 2026) -> plain text, own line, truncated. Decision 3
 *    is explicit that this must not become a badge or get mapped
 *    onto any taxonomy — these are full sentences from V1-era
 *    briefs, not single unexpected words.
 *  - null -> nothing rendered ("No badge" per 6.1's table).
 */
export function ActionLabel({ action }: { action: string | null }) {
  if (!action) return null;

  const known = ACTION_LABELS[action];
  if (known) {
    return <Badge tone={known.tone}>{known.label}</Badge>;
  }

  return <p className="truncate text-sm text-ink-muted">{action}</p>;
}
