"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { BriefStatus } from "@/lib/database.types";
import { BookedCelebration } from "@/components/BookedCelebration";

const OUTCOMES: { status: BriefStatus; label: string }[] = [
  { status: "contacted", label: "Called" },
  { status: "booked", label: "Booked" },
  { status: "not_qualified", label: "Not qualified" },
  { status: "lost", label: "Lost" },
];

export function OutcomeButtons({
  briefId,
  currentStatus,
  customerName,
  estimatedValueLow,
  estimatedValueHigh,
}: {
  briefId: string;
  currentStatus: BriefStatus;
  customerName: string;
  estimatedValueLow: number | null;
  estimatedValueHigh: number | null;
}) {
  const [status, setStatus] = useState(currentStatus);
  const [isPending, startTransition] = useTransition();
  const [showCelebration, setShowCelebration] = useState(false);
  const router = useRouter();

  function handleSelect(newStatus: BriefStatus) {
    setStatus(newStatus); // optimistic
    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase
        .from("briefs")
        .update({ status: newStatus })
        .eq("id", briefId);

      if (error) {
        console.error("update brief status:", error.message);
        setStatus(currentStatus); // roll back on failure
        return;
      }

      if (newStatus === "booked") {
        setShowCelebration(true); // v3.1 9/Screen3/Section10
      }

      router.refresh();
    });
  }

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 border-t border-line bg-paper-raised p-3 sm:static sm:rounded-xl sm:border">
        <div className="mx-auto flex max-w-[860px] gap-2">
          {OUTCOMES.map((outcome) => (
            <button
              key={outcome.status}
              type="button"
              disabled={isPending}
              onClick={() => handleSelect(outcome.status)}
              className={`flex-1 rounded-lg px-2 py-2.5 text-xs font-medium transition-colors disabled:opacity-60 ${
                status === outcome.status
                  ? "bg-ink text-white"
                  : "bg-paper text-ink-muted hover:text-ink"
              }`}
            >
              {outcome.label}
            </button>
          ))}
        </div>
      </div>

      {showCelebration && (
        <BookedCelebration
          briefId={briefId}
          customerName={customerName}
          estimatedValueLow={estimatedValueLow}
          estimatedValueHigh={estimatedValueHigh}
        />
      )}
    </>
  );
}
