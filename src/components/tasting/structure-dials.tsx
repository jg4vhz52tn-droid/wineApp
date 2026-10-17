"use client";

import { useState } from "react";
import { TickDial } from "@/components/ui/tick-dial";
import { STRUCTURE_SCALES, describeStructure, type StructureKey } from "@/config/tasting";
import { cn } from "@/lib/cn";
import type { Structure } from "@/lib/events/types";

const fmt = (n: number) => n.toLocaleString("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/**
 * Struktur in one block: tabs for the dimensions on top (with the current
 * value), one iOS-timer-like dial below. Untouched dimensions stay empty so
 * they don't count as a guess.
 */
export function StructureDials({
  dimensions,
  value,
  onChange,
}: {
  dimensions: StructureKey[];
  value: Structure;
  onChange: (value: Structure) => void;
}) {
  const [active, setActive] = useState<StructureKey>(dimensions[0]);
  const current = value[active];

  return (
    <div className="space-y-3">
      <div
        role="tablist"
        aria-label="Struktur"
        className="grid gap-1.5"
        style={{ gridTemplateColumns: `repeat(${dimensions.length}, minmax(0, 1fr))` }}
      >
        {dimensions.map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={active === key}
            onClick={() => setActive(key)}
            className={cn(
              "flex h-14 flex-col items-center justify-center rounded-control text-xs font-medium transition",
              active === key ? "bg-accent text-accent-fg" : "bg-surface-2 text-muted",
            )}
          >
            {STRUCTURE_SCALES[key].label}
            <span className="font-display text-lg leading-none">
              {value[key] === undefined ? "–" : fmt(value[key]!)}
            </span>
          </button>
        ))}
      </div>
      <TickDial
        key={active}
        label={STRUCTURE_SCALES[active].label}
        value={current ?? 5}
        onChange={(next) => onChange({ ...value, [active]: Math.round(next * 10) / 10 })}
        min={0}
        max={10}
        step={0.1}
        majorEvery={1}
        mediumEvery={0.5}
        describe={(n) => (current === undefined ? "Wischen zum Einschätzen" : describeStructure(active, n))}
      />
    </div>
  );
}
