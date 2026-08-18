import { forwardRef } from "react";

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  /** Cards that link/navigate get a subtle lift on hover — signals
   * "this is clickable" without a jarring shadow appearing from
   * nowhere. Static content cards stay flat. */
  interactive?: boolean;
  padding?: "none" | "sm" | "md";
};

const PADDING_CLASSES = { none: "", sm: "p-3", md: "p-4" };

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { interactive = false, padding = "md", className = "", children, ...props },
  ref
) {
  return (
    <div
      ref={ref}
      className={`rounded-xl border border-line bg-paper-raised ${PADDING_CLASSES[padding]} ${
        interactive
          ? "shadow-[var(--shadow-resting)] transition-[transform,box-shadow,border-color] duration-150 hover:-translate-y-0.5 hover:border-line hover:shadow-[var(--shadow-raised)]"
          : ""
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
});
