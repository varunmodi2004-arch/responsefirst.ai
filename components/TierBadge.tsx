import { leadScoreTier } from "@/lib/labels";
import { Badge } from "@/components/ui/Badge";

/** v3.1 Section 6.2. Renders nothing for null or <20 — there is no
 * "no tier" badge, the badge is just absent (matches the Fallback
 * column: "No badge shown", not a placeholder). */
export function TierBadge({ score }: { score: number | null }) {
  const tier = leadScoreTier(score);
  if (!tier) return null;

  return (
    <Badge tone={tier.tone} outline={tier.outline}>
      {tier.label}
    </Badge>
  );
}
