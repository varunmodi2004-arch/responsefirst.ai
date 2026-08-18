export type BadgeTone = "accent-strong" | "accent-soft" | "slate-soft" | "confirm-soft" | "confirm-strong" | "neutral";

const TONE_CLASSES: Record<BadgeTone, string> = {
  "accent-strong": "bg-accent text-white",
  "accent-soft": "bg-accent/15 text-accent-hover",
  "slate-soft": "bg-slate/15 text-slate",
  "confirm-soft": "bg-confirm-soft text-confirm",
  "confirm-strong": "bg-confirm text-white",
  neutral: "bg-line text-ink-muted",
};

/** Border-only variant of the same tone palette. Added for Phase 2B's
 * "Early" lead tier (v3.1 6.2 calls for "Gray, outline" — visually a
 * step down from "Good"'s filled gray, and Badge had no way to express
 * that distinction before this). */
const OUTLINE_CLASSES: Record<BadgeTone, string> = {
  "accent-strong": "border border-accent text-accent-hover",
  "accent-soft": "border border-accent/40 text-accent-hover",
  "slate-soft": "border border-slate/40 text-slate",
  "confirm-soft": "border border-confirm/40 text-confirm",
  "confirm-strong": "border border-confirm text-confirm",
  neutral: "border border-line text-ink-muted",
};

/** The one pill/tag component in the app. Every "urgency: critical",
 * "stage: booked", "needs attention" style badge goes through this —
 * new call sites pick a tone, they don't invent new badge CSS. */
export function Badge({
  children,
  tone = "neutral",
  size = "sm",
  outline = false,
}: {
  children: React.ReactNode;
  tone?: BadgeTone;
  size?: "sm" | "xs";
  outline?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold uppercase tracking-wide ${
        outline ? OUTLINE_CLASSES[tone] : TONE_CLASSES[tone]
      } ${size === "xs" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px]"}`}
    >
      {children}
    </span>
  );
}
