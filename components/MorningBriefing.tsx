import Link from "next/link";
import type { BriefWithRelations } from "@/lib/database.types";
import type { PipelineStats } from "@/lib/claims";
import { Card } from "@/components/ui/Card";
import { buttonClasses } from "@/components/ui/Button";

/**
 * Phase 2C — the AI-guided home card. Replaces the Phase 1 composition
 * of AlertCards + StatsBar + full LeadCardList. Designed to satisfy the
 * 15-second rule: within ~15 seconds a contractor knows who to call,
 * why, and what else needs attention.
 *
 * This component never invents business metrics. It renders only
 * verified live data: pending leads count, the top lead, and organic
 * pipeline numbers. Backend-controlled fields (needs_attention,
 * is_stalled) are read-only.
 */
export function MorningBriefing({
  ownerName,
  topLead,
  pendingCount,
  stats,
}: {
  ownerName: string | null;
  topLead: BriefWithRelations | null;
  pendingCount: number;
  stats: PipelineStats;
}) {
  const greeting = ownerName
    ? `Good ${timeOfDay()}, ${ownerName.split(/\s+/)[0]}.`
    : `Good ${timeOfDay()}.`;

  const customer = topLead?.customers;
  const situationText = topLead?.damage_description;

  return (
    <Card>
      <p className="font-display text-lg font-semibold text-ink">{greeting}</p>

      {pendingCount > 0 && topLead ? (
        <div className="mt-3 space-y-3">
          <p className="text-sm text-ink-muted">
            <span className="font-semibold text-ink">{pendingCount} lead{pendingCount !== 1 ? "s" : ""}</span>{" "}
            waiting — <span className="font-medium text-ink">{customer?.name ?? "a caller"}</span>{" "}
            is your top priority.
          </p>

          {situationText && (
            <p className="truncate text-sm text-ink-muted">{situationText}</p>
          )}

          {stats.needsAttention > 0 && (
            <p className="text-sm text-ink-muted">
              <span className="font-semibold text-accent-hover">
                {stats.needsAttention} job{stats.needsAttention !== 1 ? "s" : ""} need attention
              </span>
              {stats.totalValue > 0 && (
                <> · {formatCurrency(stats.totalValue)} pipeline</>
              )}
            </p>
          )}

          {stats.needsAttention === 0 && stats.claimCount > 0 && (
            <p className="text-sm text-ink-muted">
              {stats.claimCount} active job{stats.claimCount !== 1 ? "s" : ""}
              {stats.totalValue > 0 && <> · {formatCurrency(stats.totalValue)} pipeline</>}
              {" "}— all on track.
            </p>
          )}

          <Link
            href={`/dashboard/brief/${topLead.id}`}
            className={buttonClasses({ fullWidth: true })}
          >
            Start with {customer?.name?.split(/\s+/)[0] ?? "top lead"} →
          </Link>
        </div>
      ) : pendingCount === 0 && stats.claimCount > 0 ? (
        <div className="mt-3 space-y-2">
          <p className="text-sm text-ink-muted">
            No new leads right now — Sarah is answering calls on your line.
          </p>
          <p className="text-sm text-ink-muted">
            Your pipeline has{" "}
            <span className="font-medium text-ink">
              {stats.claimCount} active job{stats.claimCount !== 1 ? "s" : ""}
            </span>
            {stats.totalValue > 0 && <> worth {formatCurrency(stats.totalValue)}</>}.
            {stats.needsAttention > 0 && (
              <> <span className="font-semibold text-accent-hover">{stats.needsAttention} need attention.</span></>
            )}
          </p>
          {stats.needsAttention > 0 && (
            <Link
              href="/dashboard/pipeline"
              className={buttonClasses({ fullWidth: true })}
            >
              Review jobs →
            </Link>
          )}
        </div>
      ) : (
        <p className="mt-3 text-sm text-ink-muted">
          Welcome to ResponseFirst. Sarah is answering calls on your line —
          new leads will appear here as they come in.
        </p>
      )}
    </Card>
  );
}

function timeOfDay(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

function formatCurrency(n: number): string {
  if (n >= 1000) return `$${Math.round(n / 1000)}K`;
  return `$${Math.round(n)}`;
}
