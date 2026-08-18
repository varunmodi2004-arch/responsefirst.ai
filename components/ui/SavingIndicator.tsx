import type { SaveStatus } from "@/hooks/useAutosaveField";

export function SavingIndicator({ status }: { status: SaveStatus }) {
  if (status === "idle") return null;
  return (
    <span className="animate-fade-in text-[10px] text-ink-muted" aria-live="polite">
      {status === "saving" ? "Saving…" : "Saved"}
    </span>
  );
}
