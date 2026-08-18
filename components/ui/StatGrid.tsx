export type StatItem = {
  label: string;
  value: string;
  /** Rare — only for a number that's genuinely good news (e.g. zero
   * claims needing attention). Not a general-purpose color prop. */
  tone?: "confirm";
};

/** The stat-strip pattern used at the top of both Today and
 * Pipeline: a row of equal-width numbers with labels beneath, evenly
 * divided. Desktop gets hairline dividers between cells; mobile
 * wraps into a 2-column grid with its own cell borders instead, since
 * a single divider line doesn't read once cells stack. */
export function StatGrid({ items }: { items: StatItem[] }) {
  const mobileCols = items.length <= 3 ? items.length : 2;

  return (
    <div
      className="grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:flex sm:gap-0 sm:divide-x sm:divide-line sm:bg-paper-raised"
      style={{ gridTemplateColumns: `repeat(${mobileCols}, 1fr)` }}
    >
      {items.map((item) => (
        <div key={item.label} className="bg-paper-raised px-4 py-3 text-center sm:flex-1">
          <p
            className={`font-display text-xl font-semibold ${item.tone === "confirm" ? "text-confirm" : "text-ink"}`}
          >
            {item.value}
          </p>
          <p className="mt-0.5 text-xs text-ink-muted">{item.label}</p>
        </div>
      ))}
    </div>
  );
}
