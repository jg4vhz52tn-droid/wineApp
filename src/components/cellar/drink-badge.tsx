import { DRINK_STATUS_LABEL, type DrinkStatus } from "@/lib/cellar/value";
import { cn } from "@/lib/cn";

const STYLE: Record<DrinkStatus, string> = {
  wait: "bg-surface-2 text-muted",
  ready: "bg-success/15 text-success",
  urgent: "bg-warning/20 text-warning",
  unknown: "bg-surface-2 text-muted",
};
const ICON: Record<DrinkStatus, string> = { wait: "◷", ready: "●", urgent: "!", unknown: "?" };

/** Drink-window traffic light - always with icon and text, never colour alone. */
export function DrinkBadge({ status, className }: { status: DrinkStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.7rem] font-medium",
        STYLE[status],
        className,
      )}
    >
      <span aria-hidden>{ICON[status]}</span>
      {DRINK_STATUS_LABEL[status]}
    </span>
  );
}
