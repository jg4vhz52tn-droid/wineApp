import { cn } from "@/lib/cn";

type ChipProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { selected?: boolean };

/** Toggle chip - for aromas, grape varieties etc. instead of typing. */
export function Chip({ selected = false, className, ...props }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        "inline-flex h-11 items-center rounded-full border px-4 text-sm font-medium transition active:scale-95",
        selected
          ? "border-accent bg-accent text-accent-fg"
          : "border-border bg-surface text-fg hover:border-accent/60",
        className,
      )}
      {...props}
    />
  );
}

export function Pill({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium text-muted",
        className,
      )}
      {...props}
    />
  );
}
