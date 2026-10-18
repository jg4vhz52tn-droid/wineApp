"use client";

import { motion } from "motion/react";
import { useMemo, useRef, useState } from "react";
import type { CellarWine, Valuation } from "@/lib/cellar/types";
import { euroCents, percent, valueAt } from "@/lib/cellar/value";
import { tick } from "@/lib/haptics";

const W = 320;
const H = 120;
const PAD = { top: 10, bottom: 20, left: 4, right: 4 };
const STEPS = 48;
const DAY = 86_400_000;
const dateFmt = new Intl.DateTimeFormat("de-DE", { day: "numeric", month: "short", year: "numeric" });
const shortFmt = new Intl.DateTimeFormat("de-DE", { month: "short", year: "2-digit" });
const r1 = (n: number) => Math.round(n * 10) / 10;

/**
 * Value of one bottle since purchase: line drawn in on open, dashed purchase
 * price, dots where a value was entered, and a finger-scrub readout.
 */
export function ItemChart({
  item,
  valuations,
  asOf,
  market = [],
}: {
  item: CellarWine;
  valuations: Valuation[];
  asOf: number;
  /** Cheapest shop price per lookup (Fundstellen). */
  market?: { t: number; price: number }[];
}) {
  const svg = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<number | null>(null);

  const { points, marks } = useMemo(() => {
    const from = new Date(`${item.purchasedOn}T12:00:00`).getTime();
    const to = Math.max(asOf, from + DAY);
    const points = Array.from({ length: STEPS + 1 }, (_, i) => {
      const t = from + ((to - from) * i) / STEPS;
      return { t, value: valueAt(item, valuations, t) };
    });
    const marks = valuations
      .filter((v) => v.itemId === item.id)
      .map((v) => ({ t: new Date(`${v.date}T12:00:00`).getTime(), value: v.value }))
      .filter((m) => m.t >= from && m.t <= to);
    return { points, marks, from, to };
  }, [item, valuations, asOf]);
  const shops = market.filter((m) => m.t >= points[0].t - DAY && m.t <= points[points.length - 1].t + DAY);

  const paid = item.purchasePrice;
  const values = [
    ...points.map((p) => p.value),
    ...shops.map((m) => m.price),
    ...(paid !== null ? [paid] : []),
  ];
  const max = Math.max(...values);
  const min = Math.min(...values);
  const lo = Math.max(0, min - (max - min || max * 0.1) * 0.3);
  const hi = max + (max - min || max * 0.1) * 0.15;
  const from = points[0].t;
  const to = points[points.length - 1].t;
  const x = (t: number) => r1(PAD.left + ((t - from) / (to - from)) * (W - PAD.left - PAD.right));
  const y = (v: number) => r1(PAD.top + (1 - (v - lo) / (hi - lo || 1)) * (H - PAD.top - PAD.bottom));
  const line = points.map((p, i) => `${i ? "L" : "M"}${x(p.t)} ${y(p.value)}`).join("");
  const area = `${line}L${x(to)} ${H - PAD.bottom}L${x(from)} ${H - PAD.bottom}Z`;
  const point = points[hover ?? points.length - 1];
  const change = paid ? (point.value - paid) / paid : null;

  function scrub(clientX: number) {
    const rect = svg.current?.getBoundingClientRect();
    if (!rect) return;
    const rel = ((clientX - rect.left) / rect.width) * W;
    const i = Math.round(((rel - PAD.left) / (W - PAD.left - PAD.right)) * STEPS);
    const next = Math.min(STEPS, Math.max(0, i));
    if (next !== hover) {
      if (next % 8 === 0) tick("minor");
      setHover(next);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-end justify-between" aria-live="polite">
        <div>
          <p className="text-xs text-muted">{hover === null ? "Heute" : dateFmt.format(point.t)}</p>
          <p className="font-display text-xl tabular-nums">{euroCents.format(point.value)}</p>
        </div>
        {change !== null && (
          <p className={`text-sm font-medium tabular-nums ${change >= 0 ? "text-success" : "text-danger"}`}>
            {change >= 0 ? "▲" : "▼"} {percent.format(change)} seit Kauf
          </p>
        )}
      </div>
      <svg
        ref={svg}
        viewBox={`0 0 ${W} ${H}`}
        className="block w-full touch-pan-y select-none"
        role="img"
        aria-label={`Wert pro Flasche von ${euroCents.format(points[0].value)} auf ${euroCents.format(points[STEPS].value)}`}
        onPointerDown={(e) => scrub(e.clientX)}
        onPointerMove={(e) => scrub(e.clientX)}
        onPointerLeave={() => setHover(null)}
        onPointerUp={(e) => e.pointerType !== "mouse" && setHover(null)}
      >
        <defs>
          <linearGradient id={`item-area-${item.id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--series-1)" stopOpacity="0.25" />
            <stop offset="1" stopColor="var(--series-1)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <line
          x1={PAD.left}
          x2={W - PAD.right}
          y1={H - PAD.bottom}
          y2={H - PAD.bottom}
          stroke="var(--border)"
        />
        {paid !== null && (
          <line
            x1={PAD.left}
            x2={W - PAD.right}
            y1={y(paid)}
            y2={y(paid)}
            stroke="var(--muted)"
            strokeOpacity="0.7"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
        )}
        <motion.path
          d={area}
          fill={`url(#item-area-${item.id})`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.5 }}
        />
        <motion.path
          d={line}
          fill="none"
          stroke="var(--series-1)"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        />
        {marks.map((m) => (
          <circle
            key={m.t}
            cx={x(m.t)}
            cy={y(m.value)}
            r="3.5"
            fill="var(--surface)"
            stroke="var(--series-1)"
            strokeWidth="1.5"
          />
        ))}
        {shops.length > 1 && (
          <path
            d={shops.map((m, i) => `${i ? "L" : "M"}${x(m.t)} ${y(m.price)}`).join("")}
            fill="none"
            stroke="var(--series-2)"
            strokeWidth="1.5"
            strokeOpacity="0.8"
          />
        )}
        {shops.map((m) => (
          <rect
            key={`shop-${m.t}`}
            x={x(m.t) - 3.5}
            y={y(m.price) - 3.5}
            width="7"
            height="7"
            transform={`rotate(45 ${x(m.t)} ${y(m.price)})`}
            fill="var(--series-2)"
            stroke="var(--surface)"
            strokeWidth="1.5"
          />
        ))}
        <line
          x1={x(point.t)}
          x2={x(point.t)}
          y1={PAD.top}
          y2={H - PAD.bottom}
          stroke="var(--fg)"
          strokeOpacity={hover === null ? 0 : 0.35}
        />
        <circle
          cx={x(point.t)}
          cy={y(point.value)}
          r="4.5"
          fill="var(--series-1)"
          stroke="var(--surface)"
          strokeWidth="2"
        />
        <text x={PAD.left} y={H - 5} fontSize="10" fill="var(--muted)">
          Kauf {shortFmt.format(from)}
        </text>
        <text x={W - PAD.right} y={H - 5} fontSize="10" fill="var(--muted)" textAnchor="end">
          heute
        </text>
      </svg>
      <p className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded-full bg-series-1" aria-hidden /> Wert pro Flasche
        </span>
        {paid !== null && (
          <span className="flex items-center gap-1.5">
            <span className="w-4 border-t-[1.5px] border-dashed border-muted" aria-hidden /> Bezahlt
          </span>
        )}
        {marks.length > 0 && (
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full border-[1.5px] border-series-1" aria-hidden /> eingetragen
          </span>
        )}
        {shops.length > 0 && (
          <span className="flex items-center gap-1.5">
            <span className="size-2 rotate-45 bg-series-2" aria-hidden /> günstigster Händlerpreis
          </span>
        )}
      </p>
    </div>
  );
}
