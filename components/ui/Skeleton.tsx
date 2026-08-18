/** A single pulsing placeholder block. Route loading.tsx files
 * compose a few of these at different heights to sketch the shape of
 * the content that's about to arrive — never a generic spinner, so
 * the layout doesn't jump when real content lands. */
export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-line/50 ${className}`} />;
}

export function SkeletonStack({ heights }: { heights: string[] }) {
  return (
    <div className="space-y-4">
      {heights.map((h, i) => (
        <Skeleton key={i} className={h} />
      ))}
    </div>
  );
}
