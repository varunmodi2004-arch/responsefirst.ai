"use client";

import { useAutosaveField } from "@/hooks/useAutosaveField";
import { SavingIndicator } from "@/components/ui/SavingIndicator";
import { STAGE_ORDER, STAGE_LABELS } from "@/lib/labels";
import type { Claim, SupplementStatus } from "@/lib/database.types";

const SUPPLEMENT_OPTIONS: SupplementStatus[] = [
  "not_needed", "opportunity_flagged", "filed", "pending_response",
  "approved", "partially_approved", "denied",
];

type FieldConfig = {
  key: keyof Claim;
  label: string;
  type: "text" | "number" | "date" | "select";
  options?: readonly string[];
  optionLabels?: Record<string, string>;
  prefix?: string;
};

/**
 * Phase 2D — two-tier progressive disclosure.
 *
 * Tier 1 (always visible): the 6 fields a contractor checks most often.
 * Tier 2 (collapsed): the remaining 13 fields, available on click.
 *
 * Does NOT remove any editable fields from the existing implementation.
 * Does NOT break the autosave path — same useAutosaveField hook.
 * Does NOT change the underlying Supabase update mechanism.
 *
 * Backend-controlled fields (amount_outstanding, is_stalled,
 * needs_attention, stall_reason, days_in_current_stage, reminder flags)
 * are NOT included in either tier — they are read-only, set by
 * triggers/workflows, and displayed elsewhere.
 */

// Tier 1: the 6 essential fields visible by default
const TIER_1_FIELDS: FieldConfig[] = [
  { key: "stage", label: "Pipeline stage", type: "select", options: STAGE_ORDER, optionLabels: STAGE_LABELS },
  { key: "insurance_carrier", label: "Insurance carrier", type: "text" },
  { key: "contractor_estimate", label: "Your estimate", type: "number", prefix: "$" },
  { key: "insurance_estimate", label: "Insurance estimate", type: "number", prefix: "$" },
  { key: "adjuster_meeting_date", label: "Adjuster meeting", type: "date" },
  { key: "supplement_status", label: "Supplement status", type: "select", options: SUPPLEMENT_OPTIONS },
];

// Tier 2: the remaining fields, collapsed by default
const TIER_2_SECTIONS: { title: string; fields: FieldConfig[] }[] = [
  {
    title: "Insurance",
    fields: [
      { key: "policy_number", label: "Policy number", type: "text" },
      { key: "claim_number", label: "Claim number", type: "text" },
      { key: "adjuster_name", label: "Adjuster name", type: "text" },
      { key: "adjuster_phone", label: "Adjuster phone", type: "text" },
      { key: "adjuster_email", label: "Adjuster email", type: "text" },
    ],
  },
  {
    title: "Financials",
    fields: [
      { key: "supplement_amount", label: "Supplement amount", type: "number", prefix: "$" },
      { key: "final_approved_amount", label: "Final approved", type: "number", prefix: "$" },
      { key: "deductible_amount", label: "Deductible", type: "number", prefix: "$" },
      { key: "amount_paid", label: "Amount paid", type: "number", prefix: "$" },
    ],
  },
  {
    title: "Timeline",
    fields: [
      { key: "estimate_received_date", label: "Estimate received", type: "date" },
      { key: "production_start_date", label: "Production start", type: "date" },
      { key: "completion_date", label: "Completion date", type: "date" },
      { key: "final_payment_date", label: "Final payment", type: "date" },
    ],
  },
];

export function ClaimFieldsEditable({ claim }: { claim: Claim }) {
  return (
    <div className="space-y-6">
      {/* Tier 1: Essential fields — always visible */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {TIER_1_FIELDS.map((field) => (
          <EditableField
            key={field.key}
            claimId={claim.id}
            contractorId={claim.contractor_id}
            field={field}
            value={claim[field.key]}
          />
        ))}
      </div>

      {/* Tier 2: Additional fields — collapsed */}
      <details className="group">
        <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-ink-muted">
          All fields
          <span className="ml-1 text-ink-muted/70 group-open:hidden">▸</span>
          <span className="ml-1 hidden text-ink-muted/70 group-open:inline">▾</span>
        </summary>
        <div className="mt-4 space-y-6">
          {TIER_2_SECTIONS.map((section) => (
            <div key={section.title}>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                {section.title}
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {section.fields.map((field) => (
                  <EditableField
                    key={field.key}
                    claimId={claim.id}
                    contractorId={claim.contractor_id}
                    field={field}
                    value={claim[field.key]}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}

function EditableField({
  claimId,
  contractorId,
  field,
  value,
}: {
  claimId: string;
  contractorId: string;
  field: FieldConfig;
  value: unknown;
}) {
  const { value: current, status, handleChange } = useAutosaveField({
    table: "claims",
    id: claimId,
    field: field.key,
    label: field.label,
    contractorId,
    initialValue: formatForInput(value, field.type),
    serialize: (v) => (field.type === "number" ? Number(v) : v),
  });

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{field.label}</label>
        <SavingIndicator status={status} />
      </div>

      {field.type === "select" ? (
        <select
          value={current}
          onChange={(e) => handleChange(e.target.value)}
          className="w-full rounded-lg border border-line bg-paper-raised px-3 py-2 text-sm text-ink transition-colors focus:border-slate focus:outline-none focus:ring-2 focus:ring-slate/20"
        >
          {field.options!.map((opt) => (
            <option key={opt} value={opt}>
              {field.optionLabels?.[opt] ?? opt.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      ) : field.prefix ? (
        <div className="flex items-center rounded-lg border border-line bg-paper-raised transition-colors focus-within:border-slate focus-within:ring-2 focus-within:ring-slate/20">
          <span className="pl-3 text-sm text-ink-muted">{field.prefix}</span>
          <input
            type={field.type}
            value={current}
            onChange={(e) => handleChange(e.target.value)}
            className="w-full rounded-lg bg-transparent py-2 pl-1 pr-3 text-sm text-ink focus:outline-none"
          />
        </div>
      ) : (
        <input
          type={field.type}
          value={current}
          onChange={(e) => handleChange(e.target.value)}
          className="w-full rounded-lg border border-line bg-paper-raised px-3 py-2 text-sm text-ink transition-colors focus:border-slate focus:outline-none focus:ring-2 focus:ring-slate/20"
        />
      )}
    </div>
  );
}

function formatForInput(value: unknown, type: FieldConfig["type"]): string {
  if (value == null) return "";
  if (type === "date" && typeof value === "string") return value.slice(0, 10);
  return String(value);
}
