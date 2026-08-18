import type { PipelineStats } from "@/lib/claims";

export function PipelineHeader({ stats }: { stats: PipelineStats }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <p className="text-sm font-medium text-ink">
        {stats.claimCount} active job{stats.claimCount !== 1 ? "s" : ""}
      </p>
      <p className="text-sm text-ink-muted">
        {formatCurrency(stats.totalValue)} pipeline
        {stats.needsAttention > 0 && ` · ${stats.needsAttention} need attention`}
      </p>
    </div>
  );
}

function formatCurrency(n: number): string {
  if (n >= 1000) return `$${Math.round(n / 1000)}K`;
  return `$${Math.round(n)}`;
}
