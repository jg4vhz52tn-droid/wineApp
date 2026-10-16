import { cn } from "@/lib/cn";

type Variant = "primary" | "wine" | "secondary" | "ghost";
type Size = "md" | "lg";

const variants: Record<Variant, string> = {
  primary: "bg-accent text-accent-fg hover:brightness-105",
  wine: "bg-wine text-wine-fg hover:brightness-110",
  secondary: "bg-surface-2 text-fg hover:brightness-110",
  ghost: "bg-transparent text-fg hover:bg-surface-2",
};

// Minimum 48px touch targets; "lg" for the main action on a screen.
const sizes: Record<Size, string> = {
  md: "h-12 px-5 text-[0.95rem]",
  lg: "h-14 px-6 text-base",
};

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  block?: boolean;
  loading?: boolean;
};

export function buttonClasses(
  { variant = "primary", size = "md", block = false } = {} as Omit<ButtonProps, "loading">,
) {
  return cn(
    "inline-flex select-none items-center justify-center gap-2 rounded-control font-medium transition",
    "active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
    variants[variant],
    sizes[size],
    block && "w-full",
  );
}

export function Button({
  variant,
  size,
  block,
  loading,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(buttonClasses({ variant, size, block }), className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && (
        <span
          className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent"
          aria-hidden
        />
      )}
      {children}
    </button>
  );
}
