/** One empty-state shape for the whole app: an icon, a direct
 * statement of what's true right now, a one-line explanation of what
 * happens next, and an optional action. Every route that can be
 * empty (Today with no leads, Today with no phone number yet,
 * Pipeline with no claims) calls this instead of hand-rolling its
 * own centered-text block. */
export function EmptyState({
  icon,
  title,
  subtitle,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="animate-fade-up rounded-xl border border-dashed border-line px-6 py-12 text-center">
      {icon && <div className="mb-3 flex justify-center text-2xl text-ink-muted">{icon}</div>}
      <p className="font-display text-base font-semibold text-ink">{title}</p>
      {subtitle && <p className="mx-auto mt-2 max-w-sm text-sm text-ink-muted">{subtitle}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}
