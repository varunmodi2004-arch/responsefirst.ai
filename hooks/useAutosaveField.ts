import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type SaveStatus = "idle" | "saving" | "saved";

const AUTOSAVE_DELAY_MS = 800;

/** Debounced, optimistic single-field autosave against one row in
 * one table. Three components used to each hand-write this exact
 * debounce-then-update-then-status dance (brief notes, claim notes,
 * every editable claim field) — this is the one copy.
 *
 * For `claims`, every save also logs a claim_activities row with
 * source: "contractor" — RLS (claim_activities_insert_contractor)
 * exists specifically to let the client do this directly, matching
 * how the backend already logs its own changes (system/ai sourced).
 * `stage` is deliberately excluded: trg_log_claim_stage_change
 * already logs stage changes itself, so logging it here too would
 * double up every entry in the Activity timeline. */
export function useAutosaveField<T = string>({
  table,
  id,
  field,
  label,
  contractorId,
  initialValue,
  serialize = (v: string) => v as unknown as T,
}: {
  table: string;
  id: string;
  field: string;
  /** Human-readable name for the activity log, e.g. "Insurance carrier".
   * Only used for claims — briefs has no activity table to log to. */
  label?: string;
  /** Required to log claim_activities (contractor_id is NOT NULL and
   * RLS-checked there) — irrelevant for briefs, which don't log. */
  contractorId?: string;
  initialValue: string;
  serialize?: (value: string) => T;
}) {
  const [value, setValue] = useState(initialValue);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleChange(newValue: string) {
    setValue(newValue);
    setStatus("saving");

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(async () => {
      const supabase = createClient();
      const payload = { [field]: newValue === "" ? null : serialize(newValue) };
      // Supabase's generated types only accept the exact literal Update
      // shape per table; `table`/`field` are generic here by design (this
      // hook is shared across briefs/claims and many fields), so TS can't
      // verify the shape statically. Every call site is hand-checked
      // against the real schema instead — see lib/labels.ts's field lists.
      const { error } = await supabase
        .from(table)
        .update(payload as never)
        .eq("id", id);

      if (error) {
        console.error(`save ${table}.${field}:`, error.message);
        setStatus("idle");
        return;
      }

      if (table === "claims" && field !== "stage" && contractorId) {
        const { error: activityError } = await supabase.from("claim_activities").insert({
          claim_id: id,
          contractor_id: contractorId,
          activity_type: field === "notes" ? "note_added" : "field_updated",
          description: field === "notes" ? "Note updated" : `Updated ${label ?? field}`,
          source: "contractor",
        } as never);
        // Best-effort — the field save above already succeeded and is
        // what the contractor is watching for; a failed activity log
        // entry shouldn't flip the indicator back to an error state.
        if (activityError) console.error("log claim_activities:", activityError.message);
      }

      setStatus("saved");
    }, AUTOSAVE_DELAY_MS);
  }

  return { value, status, handleChange };
}
