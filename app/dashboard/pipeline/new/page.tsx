import { getContractor } from "@/lib/contractor";
import { AddClaimForm } from "@/components/AddClaimForm";

export default async function NewClaimPage() {
  const contractor = await getContractor();

  return (
    <div className="animate-fade-up">
      <p className="mb-4 font-display text-lg font-semibold text-ink">Add a claim</p>
      <AddClaimForm contractorId={contractor?.id ?? ""} />
    </div>
  );
}
