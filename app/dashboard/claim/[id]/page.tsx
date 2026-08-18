import { notFound } from "next/navigation";
import { getClaim, getClaimActivities } from "@/lib/claims";
import { ClaimFieldsEditable } from "@/components/ClaimFieldsEditable";
import { NotesField } from "@/components/NotesField";
import { ActivityTimeline } from "@/components/ActivityTimeline";
import { ClaimActivityRefresher } from "@/components/ClaimActivityRefresher";
import { Card } from "@/components/ui/Card";
import { buttonClasses } from "@/components/ui/Button";

export default async function ClaimDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const claim = await getClaim(id);

  // RLS returning nothing means either the claim doesn't exist or
  // isn't this contractor's — both a 404 from here, not distinguished.
  if (!claim) notFound();

  const activities = await getClaimActivities(claim.id);
  const customer = claim.customers;

  return (
    <div className="animate-fade-up space-y-6">
      <ClaimActivityRefresher contractorId={claim.contractor_id} />
      <div>
        <p className="font-display text-xl font-semibold text-ink">{customer?.name ?? "Customer"}</p>
        {customer?.property_address && <p className="text-sm text-ink-muted">{customer.property_address}</p>}
        {customer?.phone && (
          <a href={`tel:${customer.phone}`} className={`${buttonClasses({ size: "sm" })} mt-3 sm:w-auto`}>
            Call {customer.name ?? "customer"}
          </a>
        )}
      </div>

      <Card>
        <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-ink-muted">Claim details</p>
        <ClaimFieldsEditable claim={claim} />
      </Card>

      <Card>
        <NotesField table="claims" id={claim.id} contractorId={claim.contractor_id} initialNotes={claim.notes} />
      </Card>

      <Card>
        <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-ink-muted">Activity</p>
        <ActivityTimeline activities={activities} />
      </Card>
    </div>
  );
}
