import type { ClaimActivity } from "@/lib/database.types";
import { EmptyState } from "@/components/ui/EmptyState";

const SOURCE_LABEL: Record<string, string> = {
  system: "Automatic",
  contractor: "You",
  ai: "AI detected",
};

export function ActivityTimeline({ activities }: { activities: ClaimActivity[] }) {
  if (activities.length === 0) {
    return <EmptyState title="No activity yet" subtitle="Updates to this claim will show up here as they happen." />;
  }

  return (
    <ul className="space-y-4">
      {activities.map((activity) => (
        <li key={activity.id} className="relative pl-4">
          <span className="absolute left-0 top-1.5 h-1.5 w-1.5 rounded-full bg-line" aria-hidden="true" />
          <span className="absolute left-[3px] top-3 bottom-[-16px] w-px bg-line last:hidden" aria-hidden="true" />
          <p className="text-sm text-ink">{activity.description}</p>
          <p className="mt-0.5 text-[11px] text-ink-muted">
            {new Date(activity.created_at).toLocaleString(undefined, {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}{" "}
            · {SOURCE_LABEL[activity.source] ?? activity.source}
          </p>
        </li>
      ))}
    </ul>
  );
}
