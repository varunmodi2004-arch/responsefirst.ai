"use client";

import type { BriefWithRelations } from "@/lib/database.types";
import { useRealtimeRefresh } from "@/hooks/useRealtimeRefresh";
import { LeadCard } from "@/components/LeadCard";

export function LeadCardList({
  contractorId,
  initialBriefs,
}: {
  contractorId: string;
  initialBriefs: BriefWithRelations[];
}) {
  useRealtimeRefresh("briefs", contractorId);

  return (
    <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
      {initialBriefs.map((brief, i) => (
        <li key={brief.id} className="animate-fade-up" style={{ animationDelay: `${Math.min(i, 6) * 40}ms` }}>
          <LeadCard brief={brief} />
        </li>
      ))}
    </ul>
  );
}
