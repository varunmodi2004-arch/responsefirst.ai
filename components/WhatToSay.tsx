import { Card } from "@/components/ui/Card";

/** v3.1 Section 9 Screen 3 Section 3. Renders above the call button —
 * B8 enforces that ordering at the page level, this component doesn't
 * know or care where it sits, it just needs to never be the thing
 * that gets pushed below the button. */
export function WhatToSay({
  suggestedOpening,
  situationSummary,
  keyObjections,
}: {
  suggestedOpening: string | null;
  situationSummary: string | null;
  keyObjections: string[];
}) {
  const analysisPending = !suggestedOpening && !situationSummary;

  return (
    <Card>
      {analysisPending ? (
        <p className="text-sm italic text-ink-muted">
          Analysis pending — Sarah is still processing this call.
        </p>
      ) : (
        <>
          {suggestedOpening && <p className="text-base italic text-ink">“{suggestedOpening}”</p>}
          {situationSummary && (
            <p className={`text-sm text-ink-muted ${suggestedOpening ? "mt-2" : ""}`}>{situationSummary}</p>
          )}
        </>
      )}

      {keyObjections.length > 0 && (
        <div className="mt-3 border-t border-line pt-3">
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Potential pushback
          </p>
          <ul className="space-y-1">
            {keyObjections.map((objection) => (
              <li key={objection} className="flex gap-1.5 text-sm text-ink">
                <span aria-hidden="true">•</span>
                {objection}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
