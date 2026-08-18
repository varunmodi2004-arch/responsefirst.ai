export function TranscriptCollapse({ text }: { text: string | null }) {
  if (!text) return null;

  return (
    <details className="rounded-xl border border-line bg-paper-raised p-4">
      <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-ink-muted">
        Transcript
      </summary>
      <p className="mt-3 max-h-64 overflow-y-auto whitespace-pre-wrap text-sm text-ink">
        {text}
      </p>
    </details>
  );
}
