type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-accent text-white hover:bg-accent-hover",
  secondary: "bg-ink text-white hover:bg-ink/90",
  ghost: "bg-transparent text-accent-hover hover:underline",
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: "px-3 py-2 text-sm",
  md: "px-4 py-2.5 text-sm",
};

const BASE =
  "inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate/40 focus-visible:ring-offset-2 focus-visible:ring-offset-paper";

/** Builds the same visual classes the <Button> below uses. Exported
 * so the handful of places that need a Link styled as a button
 * (Next.js's <Link> isn't a <button>, and shouldn't pretend to be
 * one at the DOM level) can stay a real anchor while looking
 * identical to every other button in the app. */
export function buttonClasses({
  variant = "primary",
  size = "md",
  fullWidth = false,
}: {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
} = {}): string {
  return `${BASE} ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${fullWidth ? "w-full" : ""}`;
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
};

/** Every <button> that looks like a button in the app goes through
 * here: primary = the one action you want taken, secondary = a
 * confident non-selling alternative, ghost = a text link with button
 * semantics. For link-styled buttons, use buttonClasses() on a
 * Next.js <Link> instead. */
export function Button({ variant = "primary", size = "md", fullWidth = false, className = "", type = "button", ...props }: ButtonProps) {
  return <button type={type} className={`${buttonClasses({ variant, size, fullWidth })} ${className}`} {...props} />;
}
