"use client";

import { useState } from "react";
import type { ClaimWithRelations } from "@/lib/database.types";
import { useRealtimeRefresh } from "@/hooks/useRealtimeRefresh";
import { ClaimCard } from "@/components/ClaimCard";

/**
 * Phase 2D — attention-first pipeline layout. Claims are split into:
 *   1. NEEDS ATTENTION — expanded, always visible
 *   2. ON TRACK — collapsed by default, click to expand
 *
 * Uses the existing `needs_attention` field set by W6 (backend-
 * controlled, read-only from the dashboard). Does not invent new
 * scoring logic.
 */
export function ClaimCardList({
  contractorId,
  initialClaims,
}: {
  contractorId: string;
  initialClaims: ClaimWithRelations[];
}) {
  useRealtimeRefresh("claims", contractorId);
  const [onTrackOpen, setOnTrackOpen] = useState(false);

  const attention = initialClaims.filter((c) => c.needs_attention);
  const onTrack = initialClaims.filter((c) => !c.needs_attention);

  return (
    <div className="space-y-6">
      {/* Needs Attention — always expanded */}
      {attention.length > 0 && (
        <div className="animate-fade-up">
          <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-accent-hover">
            ⚠ Needs attention
          </p>
          <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {attention.map((claim) => (
              <li key={claim.id}>
                <ClaimCard claim={claim} />
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* On Track — collapsed by default */}
      {onTrack.length > 0 && (
        <div className="animate-fade-up" style={{ animationDelay: "40ms" }}>
          <button
            type="button"
            onClick={() => setOnTrackOpen((o) => !o)}
            className="mb-2.5 flex w-full items-baseline gap-2 text-left"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              On track
            </p>
            <span className="text-xs text-ink-muted/70">{onTrack.length}</span>
            <span className="ml-auto text-xs text-ink-muted">
              {onTrackOpen ? "▾ Hide" : "▸ Show"}
            </span>
          </button>

          {onTrackOpen && (
            <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {onTrack.map((claim) => (
                <li key={claim.id}>
                  <ClaimCard claim={claim} />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* When nothing needs attention and on-track list is also empty */}
      {attention.length === 0 && onTrack.length === 0 && null}
    </div>
  );
}
