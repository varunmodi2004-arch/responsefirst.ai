"use client";

import { buttonClasses } from "@/components/ui/Button";

/** What every route's error.tsx renders. A route segment error in
 * this app is almost always a transient Supabase/network hiccup, not
 * a real bug the contractor needs to know about — so this stays calm
 * and offers the one useful action (try again) rather than a stack
 * trace or an alarming tone. */
export function ErrorState({ reset }: { reset: () => void }) {
  return (
    <div className="animate-fade-up rounded-xl border border-line bg-paper-raised px-6 py-12 text-center">
      <div className="mb-3 text-2xl" aria-hidden="true">
        ⚠️
      </div>
      <p className="font-display text-base font-semibold text-ink">Something didn&rsquo;t load</p>
      <p className="mx-auto mt-2 max-w-sm text-sm text-ink-muted">
        This is usually temporary. Give it another try — your data is safe either way.
      </p>
      <button onClick={reset} className={`${buttonClasses()} mt-4`}>
        Try again
      </button>
    </div>
  );
}
