"use client";

import { motion } from "motion/react";
import { Card, Eyebrow } from "@/components/ui/card";
import { Segmented } from "@/components/ui/segmented";
import type { CellarData, CellarWine } from "@/lib/cellar/types";
import { allocation, euro, movers, percent, portfolioTotals, type AllocationKey } from "@/lib/cellar/value";
import { cn } from "@/lib/cn";
import { tick } from "@/lib/haptics";
import { ValueChart } from "./value-chart";

export function PortfolioHeader({ data, estimated }: { data: CellarData; estimated: boolean }) {
  const t = portfolioTotals(data);
  const up = t.gain >= 0;
  return (
    <Card className="space-y-5">
      <div className="space-y-1">
        <Eyebrow>Kellerwert{estimated ? " · teils geschätzt" : ""}</Eyebrow>
        <p className="font-display text-[3.25rem] leading-none tabular-nums">{euro.format(t.value)}</p>
        <p className={cn("text-sm font-medium tabular-nums", up ? "text-success" : "text-danger")}>
          <span aria-hidden>{up ? "▲" : "▼"} </span>
          {euro.format(Math.abs(t.gain))} ({percent.format(t.gainPct)}) seit dem Kauf
        </p>
      </div>
      <dl className="grid grid-cols-3 gap-2 text-center">
        <Stat label="Flaschen" value={String(t.bottles)} />
        <Stat label="Ø pro Flasche" value={euro.format(t.avg)} />
        <Stat label="Getrunken (Gewinn)" value={euro.format(t.realised)} />
      </dl>
      <ValueChart data={data} />
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-control bg-surface-2/70 px-2 py-2.5">
      <dt className="text-[0.65rem] leading-tight text-muted">{label}</dt>
      <dd className="mt-0.5 font-display text-xl tabular-nums">{value}</dd>
    </div>
  );
}

export function Movers({ data, onOpen }: { data: CellarData; onOpen: (item: CellarWine) => void }) {
  const list = movers(data);
  if (list.length < 2) return null;
  const top = list.slice(0, 3);
  const flop = list.slice(-2).reverse();
  return (
    <Card className="space-y-3">
      <Eyebrow>Gewinner & Verlierer</Eyebrow>
      <ul className="divide-y divide-border">
        {[...top, ...flop.filter((f) => !top.includes(f))].map(({ item, now, change }) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => onOpen(item)}
              className="flex w-full items-center gap-3 py-2.5 text-left"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{item.name || item.producer}</span>
                <span className="block truncate text-xs text-muted">
                  {item.producer} · {item.vintage ?? "o. J."}
                </span>
              </span>
              <span className="text-right">
                <span className="block text-sm tabular-nums">{euro.format(now)}</span>
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
    </Card>
  );
}

const BY_LABEL: Record<AllocationKey, string> = { region: "Region", grape: "Rebsorte", color: "Farbe" };

/** Where the value sits: single-hue bars (magnitude), tap one to filter the list. */
export function Allocation({
  data,
  by,
  onBy,
  filter,
  onFilter,
}: {
  data: CellarData;
  by: AllocationKey;
  onBy: (by: AllocationKey) => void;
  filter: string | null;
  onFilter: (label: string | null) => void;
}) {
  const rows = allocation(data, by);
  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <Eyebrow>Aufteilung</Eyebrow>
        {filter && (
          <button type="button" onClick={() => onFilter(null)} className="text-xs text-accent">
            Filter „{filter}“ entfernen
          </button>
        )}
      </div>
      <Segmented<AllocationKey>
        label="Aufteilen nach"
        value={by}
        onChange={(next) => {
          tick("minor");
          onFilter(null);
          onBy(next);
        }}
        options={(Object.keys(BY_LABEL) as AllocationKey[]).map((k) => ({ value: k, label: BY_LABEL[k] }))}
      />
      <ul className="space-y-1">
        {rows.map((row) => {
          const active = filter === row.label;
          return (
            <li key={row.label}>
              <button
                type="button"
                aria-pressed={active}
                onClick={() => {
                  tick("minor");
                  onFilter(active ? null : row.label);
                }}
                className={cn(
                  "grid w-full grid-cols-[7rem_1fr_auto] items-center gap-3 rounded-control px-2 py-2 text-left text-sm",
                  active && "bg-surface-2",
                  filter && !active && "opacity-50",
                )}
              >
                <span className="truncate">{row.label}</span>
                <span className="h-2 overflow-hidden rounded-full bg-surface-2">
                  <motion.span
                    className="block h-full rounded-full bg-series-1"
                    initial={false}
                    animate={{ width: `${Math.max(2, row.share * 100)}%` }}
                  />
                </span>
                <span className="w-24 text-right text-xs text-muted tabular-nums">
                  {euro.format(row.value)} · {Math.round(row.share * 100)} %
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
