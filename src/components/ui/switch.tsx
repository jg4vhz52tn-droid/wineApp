"use client";

import { cn } from "@/lib/cn";
import { tick } from "@/lib/haptics";

/** On/off row with a title and a short explanation - e.g. "Finde den Piraten". */
export function SwitchRow({
  label,
  description,
  checked,
  onChange,
  className,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => {
        tick("minor");
        onChange(!checked);
      }}
      className={cn(
        "flex w-full items-center gap-4 rounded-control bg-surface-2/70 p-4 text-left",
        className,
      )}
    >
      <span className="min-w-0 flex-1">
        <span className="block font-medium">{label}</span>
        {description && <span className="mt-0.5 block text-sm text-muted">{description}</span>}
      </span>
      <span
        aria-hidden
        className={cn(
          "relative h-7 w-12 shrink-0 rounded-full transition-colors",
          checked ? "bg-accent" : "bg-border",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-6 rounded-full bg-white shadow transition-[left]",
            checked ? "left-[1.375rem]" : "left-0.5",
          )}
        />
      </span>
    </button>
  );
}
