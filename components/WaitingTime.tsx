"use client";

import { useSyncExternalStore } from "react";

function subscribe() {
  // Single snapshot is enough for this use case — no live-updating
  // clock needed, the card re-renders on router.refresh() anyway
  // (see useRealtimeRefresh), which re-reads the snapshot fresh.
  return () => {};
}
function getSnapshot() {
  return Date.now();
}
function getServerSnapshot() {
  // No wall-clock reads during SSR — avoids a server/client
  // hydration mismatch. Renders a neutral placeholder for the first
  // frame instead.
  return null;
}

/**
 * v3.1 Section 9 Screen 2: "<1h muted, 1–4h default, 4–24h orange,
 * >24h red." This is Design Principle 5 ("Urgency Is Time, Not
 * Color") in component form — on the Leads screen it's the primary
 * urgency signal, not a decoration next to one.
 *
 * useSyncExternalStore is React's sanctioned way to read an external,
 * non-deterministic value like the clock: react-hooks/purity
 * correctly flags Date.now() called directly during render (a plain
 * inline call, or a useState/useEffect combo, both hit it in slightly
 * different ways), and this is the escape hatch built for exactly
 * this case rather than threading a `now` prop through every caller
 * up to the page component.
 *
 * Design-token gap, flagging rather than silently deciding: the app's
 * palette has one accent color (orange, #d4531f) and no separate
 * "red" — there's no distinct hue for the >24h tier as literally
 * specified. Using accent-hover (the same orange, darker) + bold to
 * escalate past the 4–24h tier's plain accent, rather than inventing
 * a new color token unasked. Revisit if a true red is wanted.
 */
export function WaitingTime({ createdAt }: { createdAt: string }) {
  const now = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (now === null) {
    return <span className="text-xs text-ink-muted">Waiting —</span>;
  }

  const minutes = Math.max(0, (now - new Date(createdAt).getTime()) / 60_000);
  const hours = minutes / 60;

  if (minutes < 60) {
    return <span className="text-xs text-ink-muted">Waiting {Math.max(1, Math.round(minutes))}m</span>;
  }
  if (hours < 4) {
    return <span className="text-xs text-ink">Waiting {Math.round(hours)}h</span>;
  }
  if (hours < 24) {
    return <span className="text-xs text-accent">Waiting {Math.round(hours)}h</span>;
  }
  return <span className="text-xs font-semibold text-accent-hover">Waiting {Math.round(hours / 24)}d</span>;
}
