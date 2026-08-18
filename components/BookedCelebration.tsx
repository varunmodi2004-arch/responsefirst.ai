"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { buttonClasses } from "@/components/ui/Button";

/** v3.1 Section 9 Screen 3 Section 10. WF5 (out of scope — not
 * touched) creates the claim asynchronously after a brief is marked
 * booked, so this can't just read getClaimByBriefId() once: it polls
 * (1s, then 3s) client-side using the same direct-Supabase-call
 * pattern OutcomeButtons/NotesField already use, since the server-only
 * lib/claims.ts helpers aren't callable from a Client Component. */
export function BookedCelebration({
  briefId,
  customerName,
  estimatedValueLow,
  estimatedValueHigh,
}: {
  briefId: string;
  customerName: string;
  estimatedValueLow: number | null;
  estimatedValueHigh: number | null;
}) {
  const [claimId, setClaimId] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const delays = [1000, 3000];
    if (attempt >= delays.length) return;

    const timer = setTimeout(async () => {
      const supabase = createClient();
      const { data } = await supabase.from("claims").select("id").eq("brief_id", briefId).maybeSingle();
      if (data) {
        setClaimId(data.id);
      } else {
        setAttempt((a) => a + 1);
      }
    }, delays[attempt]);

    return () => clearTimeout(timer);
  }, [attempt, briefId]);

  const valueLabel = formatValueRange(estimatedValueLow, estimatedValueHigh);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Lead booked"
    >
      <div className="animate-fade-up w-full max-w-sm rounded-xl bg-paper-raised p-6 text-center shadow-[var(--shadow-raised)]">
        <p className="font-display text-lg font-semibold text-ink">
          ✓ Booked — {customerName}
          {valueLabel ? ` · ${valueLabel}` : ""}
        </p>

        <div className="mt-5 space-y-2">
          {claimId ? (
            <Link href={`/dashboard/claim/${claimId}`} className={buttonClasses({ fullWidth: true })}>
              View claim →
            </Link>
          ) : (
            <p className="text-sm text-ink-muted">Claim is being created…</p>
          )}

          <Link
            href="/dashboard/leads"
            className="block w-full text-sm text-ink-muted underline underline-offset-2 hover:text-ink"
          >
            Back to leads →
          </Link>
        </div>
      </div>
    </div>
  );
}

function formatValueRange(low: number | null, high: number | null): string | null {
  if (low == null || high == null) return null;
  const fmt = (n: number) => (n >= 1000 ? `$${Math.round(n / 1000)}K` : `$${Math.round(n)}`);
  return `${fmt(low)}–${fmt(high)}`;
}
