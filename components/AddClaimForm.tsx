"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function AddClaimForm({ contractorId }: { contractorId: string }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [carrier, setCarrier] = useState("");
  const [estimate, setEstimate] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(undefined);
    setIsSaving(true);

    const supabase = createClient();

    // Upsert on (contractor_id, phone) — same find-or-create pattern
    // Workflow 1 uses, so re-entering an existing customer's phone
    // here doesn't create a duplicate customer row.
    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .upsert(
        { contractor_id: contractorId, name, phone, property_address: address || null },
        { onConflict: "contractor_id,phone" }
      )
      .select("id")
      .single();

    if (customerError || !customer) {
      setError(customerError?.message ?? "Could not save customer");
      setIsSaving(false);
      return;
    }

    const { data: claim, error: claimError } = await supabase
      .from("claims")
      .insert({
        contractor_id: contractorId,
        customer_id: customer.id,
        insurance_carrier: carrier || null,
        contractor_estimate: estimate ? Number(estimate) : null,
      })
      .select("id")
      .single();

    if (claimError || !claim) {
      setError(claimError?.message ?? "Could not create claim");
      setIsSaving(false);
      return;
    }

    // Best-effort — claims created from a brief get a "claim created"
    // entry from Workflow 5; manual ones deserve the same starting
    // point in their Activity timeline. Never blocks navigation.
    await supabase.from("claim_activities").insert({
      claim_id: claim.id,
      contractor_id: contractorId,
      activity_type: "claim_created",
      description: "Claim added manually",
      source: "contractor",
    } as never);

    router.push(`/dashboard/claim/${claim.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <p className="rounded-lg bg-accent/10 px-3 py-2 text-sm text-accent-hover">{error}</p>
      )}

      <Field label="Customer name" required>
        <input
          type="text" required value={name} onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-line bg-paper-raised px-3 py-2 text-sm text-ink focus:border-slate focus:outline-none focus:ring-2 focus:ring-slate/20"
        />
      </Field>

      <Field label="Phone" required>
        <input
          type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)}
          className="w-full rounded-lg border border-line bg-paper-raised px-3 py-2 text-sm text-ink focus:border-slate focus:outline-none focus:ring-2 focus:ring-slate/20"
        />
      </Field>

      <Field label="Property address">
        <input
          type="text" value={address} onChange={(e) => setAddress(e.target.value)}
          className="w-full rounded-lg border border-line bg-paper-raised px-3 py-2 text-sm text-ink focus:border-slate focus:outline-none focus:ring-2 focus:ring-slate/20"
        />
      </Field>

      <Field label="Insurance carrier">
        <input
          type="text" value={carrier} onChange={(e) => setCarrier(e.target.value)}
          className="w-full rounded-lg border border-line bg-paper-raised px-3 py-2 text-sm text-ink focus:border-slate focus:outline-none focus:ring-2 focus:ring-slate/20"
        />
      </Field>

      <Field label="Your estimate ($)">
        <input
          type="number" min="0" step="0.01" value={estimate} onChange={(e) => setEstimate(e.target.value)}
          className="w-full rounded-lg border border-line bg-paper-raised px-3 py-2 text-sm text-ink focus:border-slate focus:outline-none focus:ring-2 focus:ring-slate/20"
        />
      </Field>

      <p className="text-xs text-ink-muted">
        Everything else — adjuster info, dates, supplement tracking — is
        editable from the claim once it&rsquo;s created.
      </p>

      <button
        type="submit"
        disabled={isSaving}
        className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-60"
      >
        {isSaving ? "Creating…" : "Create claim"}
      </button>
    </form>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-muted">
        {label}
        {required && <span className="text-accent"> *</span>}
      </label>
      {children}
    </div>
  );
}
