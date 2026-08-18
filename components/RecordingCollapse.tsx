export function RecordingCollapse({
  recordingUrl,
  likelyExpired,
}: {
  recordingUrl: string | null;
  likelyExpired: boolean;
}) {
  if (!recordingUrl) return null;

  return (
    <details className="rounded-xl border border-line bg-paper-raised p-4">
      <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-ink-muted">
        Recording
      </summary>
      <div className="mt-3">
        {likelyExpired ? (
          <p className="text-sm italic text-ink-muted">
            Recording no longer available — Retell links expire 10 minutes
            after the call.
          </p>
        ) : (
          <audio controls src={recordingUrl} className="w-full">
            Your browser doesn&rsquo;t support audio playback.
          </audio>
        )}
      </div>
    </details>
  );
}
