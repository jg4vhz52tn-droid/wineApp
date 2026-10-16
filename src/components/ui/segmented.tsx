"use client";

import { cn } from "@/lib/cn";

type Option<T extends string> = { value: T; label: string };

export function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex rounded-control bg-surface-2 p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "h-10 flex-1 rounded-[calc(var(--radius-control)-0.25rem)] px-3 text-sm font-medium transition",
            value === option.value ? "bg-surface text-fg shadow-sm" : "text-muted",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
