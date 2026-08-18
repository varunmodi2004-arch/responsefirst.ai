"use client";

import { useAutosaveField } from "@/hooks/useAutosaveField";
import { SavingIndicator } from "@/components/ui/SavingIndicator";

/** Autosaving notes textarea for either a brief or a claim — the two
 * tables have identical `notes` column semantics, so one component
 * parameterized by table name replaces what used to be NotesField
 * and ClaimNotesField as separate, near-identical files. */
export function NotesField({
  table,
  id,
  contractorId,
  initialNotes,
}: {
  table: "briefs" | "claims";
  id: string;
  /** Required for claims (activity logging); unused for briefs. */
  contractorId?: string;
  initialNotes: string | null;
}) {
  const { value, status, handleChange } = useAutosaveField({
    table,
    id,
    field: "notes",
    contractorId,
    initialValue: initialNotes ?? "",
  });

  const fieldId = `${table}-notes`;

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <label htmlFor={fieldId} className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
          Notes
        </label>
        <SavingIndicator status={status} />
      </div>
      <textarea
        id={fieldId}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        rows={3}
        placeholder="Add a note for yourself…"
        className="w-full rounded-lg border border-line bg-paper-raised px-3 py-2 text-sm text-ink placeholder:text-ink-muted transition-colors focus:border-slate focus:outline-none focus:ring-2 focus:ring-slate/20"
      />
    </div>
  );
}
