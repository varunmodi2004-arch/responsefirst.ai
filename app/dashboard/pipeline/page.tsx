import { getContractor } from "@/lib/contractor";
import { getActiveClaims, getPipelineStats } from "@/lib/claims";
import { PipelineHeader } from "@/components/PipelineHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { buttonClasses } from "@/components/ui/Button";
import { ClaimCardList } from "@/components/ClaimCardList";
import Link from "next/link";

export default async function PipelinePage() {
  const [contractor, claims, stats] = await Promise.all([
    getContractor(),
    getActiveClaims(),
    getPipelineStats(),
  ]);

  return (
    <div className="animate-fade-up space-y-6">
      <PipelineHeader stats={stats} />

      {claims.length === 0 ? (
        <EmptyState
          icon="📋"
          title="No active claims yet"
          subtitle={'Claims appear here automatically once a lead is marked "Booked," or you can add one directly.'}
          action={
            <Link href="/dashboard/pipeline/new" className={buttonClasses()}>
              Add a claim
            </Link>
          }
        />
      ) : (
        <>
          <div className="flex justify-end">
            <Link href="/dashboard/pipeline/new" className="text-sm font-medium text-accent-hover hover:underline">
              + Add a claim
            </Link>
          </div>
          <ClaimCardList contractorId={contractor?.id ?? ""} initialClaims={claims} />
        </>
      )}
    </div>
  );
}
