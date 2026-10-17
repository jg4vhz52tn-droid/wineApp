"use client";

import { useState } from "react";
import { Bottle } from "@/components/tasting/bottle";
import { Chip } from "@/components/ui/chip";
import { Segmented } from "@/components/ui/segmented";
import { bottleShapeFor } from "@/config/bottles";
import type { CellarData, CellarWine } from "@/lib/cellar/types";
import {
  drinkStatus,
  euro,
  isEstimated,
  itemLabelFor,
  percent,
  valueAt,
  type AllocationKey,
  type DrinkStatus,
} from "@/lib/cellar/value";
import { cn } from "@/lib/cn";
import { tick } from "@/lib/haptics";
import { DrinkBadge } from "./drink-badge";

type Sort = "wert" | "gewinn" | "reife";
const STATUS_FILTERS: { value: DrinkStatus | "all"; label: string }[] = [
  { value: "all", label: "Alle" },
  { value: "ready", label: "Jetzt perfekt" },
  { value: "urgent", label: "Dringend" },
  { value: "wait", label: "Noch warten" },
];

export function location(item: CellarWine) {
  const parts = [
    item.shelf && `Regal ${item.shelf}`,
    item.compartment && `Fach ${item.compartment}`,
    item.row && `Reihe ${item.row}`,
  ].filter(Boolean);
  return parts.length ? parts.join(" · ") : "Ohne Lagerplatz";
}

export function CellarList({
  data,
  groupBy,
  groupFilter,
  onOpen,
}: {
  data: CellarData;
  groupBy: AllocationKey;
  groupFilter: string | null;
  onOpen: (item: CellarWine) => void;
}) {
  const [status, setStatus] = useState<DrinkStatus | "all">("all");
  const [sort, setSort] = useState<Sort>("wert");

  const rows = data.items
    .filter((i) => i.quantity > 0)
    .filter((i) => status === "all" || drinkStatus(i) === status)
    .filter((i) => !groupFilter || itemLabelFor(groupBy, i) === groupFilter)
    .map((item) => {
      const now = valueAt(item, data.valuations);
      return { item, now, change: item.purchasePrice ? (now - item.purchasePrice) / item.purchasePrice : 0 };
    })
    .sort((a, b) =>
      sort === "wert"
        ? b.now * b.item.quantity - a.now * a.item.quantity
        : sort === "gewinn"
          ? b.change - a.change
          : (a.item.drinkUntil ?? 9999) - (b.item.drinkUntil ?? 9999),
    );

  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-2xl">Kartei</h2>
        <span className="text-sm text-muted">{rows.length} Weine</span>
      </div>
      <div className="-mx-5 flex [scrollbar-width:none] gap-2 overflow-x-auto px-5 pb-1">
        {STATUS_FILTERS.map((f) => (
          <Chip
            key={f.value}
            selected={status === f.value}
            className="shrink-0"
            onClick={() => {
              tick("minor");
              setStatus(f.value);
            }}
          >
            {f.label}
          </Chip>
        ))}
      </div>
      <Segmented<Sort>
        label="Sortieren"
        value={sort}
        onChange={setSort}
        options={[
          { value: "wert", label: "Wert" },
          { value: "gewinn", label: "Gewinn" },
          { value: "reife", label: "Trinkreife" },
        ]}
      />
      {rows.length === 0 ? (
        <p className="rounded-card border border-dashed border-border p-6 text-center text-sm text-muted">
          Keine Flaschen für diesen Filter.
        </p>
      ) : (
        <ul className="space-y-2">
          {rows.map(({ item, now, change }) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onOpen(item)}
                className="flex w-full items-center gap-3 rounded-card border border-border bg-surface p-3 text-left transition active:scale-[0.99]"
              >
                <Bottle shape={bottleShapeFor(item.color)} className="h-16 w-9 shrink-0" />
                <span className="min-w-0 flex-1 space-y-1">
                  <span className="block truncate font-display text-lg leading-tight">
                    {item.name || item.producer}
                  </span>
                  <span className="block truncate text-xs text-muted">
                    {item.producer} · {item.vintage ?? "o. J."} · {location(item)}
                  </span>
                  <DrinkBadge status={drinkStatus(item)} />
                </span>
                <span className="shrink-0 text-right">
                  <span className="block font-display text-xl tabular-nums">× {item.quantity}</span>
                  <span className="block text-xs tabular-nums">
                    {euro.format(now)}
                    {isEstimated(item, data.valuations) && <span className="text-muted">*</span>}
                  </span>
                  <span
                    className={cn(
                      "block text-xs font-medium tabular-nums",
                      change >= 0 ? "text-success" : "text-danger",
                    )}
                  >
                    {change >= 0 ? "▲" : "▼"} {percent.format(change)}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-muted">
        * geschätzter Wert – tippe eine Flasche an, um den echten Wert einzutragen.
      </p>
    </section>
  );
}
