"use client";

import { motion } from "motion/react";
import { useMemo, useRef, useState } from "react";
import { Segmented } from "@/components/ui/segmented";
import { euro, firstPurchase, percent, portfolioSeries } from "@/lib/cellar/value";
import type { CellarData } from "@/lib/cellar/types";
import { tick } from "@/lib/haptics";

type Range = "3m" | "1j" | "alles";
const DAY = 86_400_000;
const W = 340;
const H = 150;
const PAD = { top: 12, bottom: 22, left: 4, right: 4 };
const dateFmt = new Intl.DateTimeFormat("de-DE", { day: "numeric", month: "short", year: "numeric" });
const shortFmt = new Intl.DateTimeFormat("de-DE", { month: "short", year: "2-digit" });
const r1 = (n: number) => Math.round(n * 10) / 10;

/**
 * Portfolio value over time: 2px line with a soft area, the purchase cost as
 * a dashed reference line, and a scrubbable crosshair with a readout.
 * Two fingers (or dragging with the mouse) mark a period and show how the
 * value and the return developed in it.
 */
export function ValueChart({ data }: { data: CellarData }) {
  const [range, setRange] = useState<Range>("alles");
  const [hover, setHover] = useState<number | null>(null);
  const [selection, setSelection] = useState<[number, number] | null>(null);
  const svg = useRef<SVGSVGElement>(null);
  const pointers = useRef(new Map<number, number>());
  const mouseStart = useRef<number | null>(null);

  const series = useMemo(() => {
    const now = data.asOf;
    const from = range === "3m" ? now - 91 * DAY : range === "1j" ? now - 365 * DAY : firstPurchase(data);
    return portfolioSeries(data, from, now, 72);
  }, [data, range]);

  const max = Math.max(...series.map((p) => Math.max(p.value, p.cost)), 1);
  const min = Math.min(...series.map((p) => Math.min(p.value, p.cost)));
  const lo = Math.max(0, min - (max - min) * 0.15);
  const x = (i: number) => r1(PAD.left + (i / (series.length - 1)) * (W - PAD.left - PAD.right));
  const y = (v: number) => r1(PAD.top + (1 - (v - lo) / (max - lo || 1)) * (H - PAD.top - PAD.bottom));

  const line = series.map((p, i) => `${i ? "L" : "M"}${x(i)} ${y(p.value)}`).join("");
  const area = `${line}L${x(series.length - 1)} ${H - PAD.bottom}L${x(0)} ${H - PAD.bottom}Z`;
  const cost = series.map((p, i) => `${i ? "L" : "M"}${x(i)} ${y(p.cost)}`).join("");
  const point = hover === null ? series[series.length - 1] : series[hover];
  const index = hover ?? series.length - 1;

  function indexAt(clientX: number) {
    const rect = svg.current?.getBoundingClientRect();
    if (!rect) return 0;
    const rel = ((clientX - rect.left) / rect.width) * W;
    const i = Math.round(((rel - PAD.left) / (W - PAD.left - PAD.right)) * (series.length - 1));
    return Math.min(series.length - 1, Math.max(0, i));
  }

  function scrub(clientX: number) {
    const next = indexAt(clientX);
    if (next !== hover) {
      if (next % 6 === 0) tick("minor");
      setHover(next);
    }
  }

  function select(a: number, b: number) {
    const next: [number, number] = [Math.min(a, b), Math.max(a, b)];
    if (!selection || next[0] !== selection[0] || next[1] !== selection[1]) {
      if (!selection) tick("medium");
      else if ((next[1] - next[0]) % 6 === 0) tick("minor");
      setSelection(next);
    }
  }

  function onDown(e: React.PointerEvent) {
    pointers.current.set(e.pointerId, e.clientX);
    if (e.pointerType === "mouse") {
      mouseStart.current = indexAt(e.clientX);
      setSelection(null);
      scrub(e.clientX);
      return;
    }
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Not every browser allows capture for every pointer - the chart works without it.
    }
    const xs = [...pointers.current.values()];
    if (xs.length >= 2) {
      setHover(null);
      select(indexAt(xs[0]), indexAt(xs[1]));
    } else {
      setSelection(null);
      scrub(e.clientX);
    }
  }

  function onMove(e: React.PointerEvent) {
    if (pointers.current.has(e.pointerId)) pointers.current.set(e.pointerId, e.clientX);
    const xs = [...pointers.current.values()];
    if (e.pointerType === "mouse" && mouseStart.current !== null && e.buttons === 1) {
      const i = indexAt(e.clientX);
      if (i !== mouseStart.current) {
        setHover(null);
        select(mouseStart.current, i);
        return;
      }
    }
    if (xs.length >= 2) select(indexAt(xs[0]), indexAt(xs[1]));
    else if (!selection) scrub(e.clientX);
  }

  function onUp(e: React.PointerEvent) {
    pointers.current.delete(e.pointerId);
    mouseStart.current = null;
    if (pointers.current.size === 0 && e.pointerType !== "mouse") setHover(null);
  }

  const sel = selection && selection[1] - selection[0] >= 1 ? selection : null;
  const span = sel ? { a: series[sel[0]], b: series[sel[1]] } : null;
  const gain = span ? span.b.value - span.b.cost - (span.a.value - span.a.cost) : 0;
  // Money put in during the period (new bottles) is not a gain: return = value gain / (start value + purchases).
  const bought = span ? Math.max(0, span.b.cost - span.a.cost) : 0;
  const base = span ? span.a.value + bought : 0;

  return (
    <div className="space-y-3">
      {span ? (
        <div className="flex items-end justify-between gap-3" aria-live="polite">
          <div>
            <p className="text-xs text-muted">
              {dateFmt.format(span.a.t)} – {dateFmt.format(span.b.t)}
            </p>
            <p className="font-display text-2xl tabular-nums">
              {span.b.value - span.a.value >= 0 ? "+" : "−"}
              {euro.format(Math.abs(span.b.value - span.a.value))}
            </p>
            <p className="text-xs text-muted tabular-nums">
              {euro.format(span.a.value)} → {euro.format(span.b.value)}
              {bought > 0 && ` · davon ${euro.format(bought)} Zukäufe`}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted">Rendite im Zeitraum</p>
            <p className={`font-display text-2xl tabular-nums ${gain >= 0 ? "text-success" : "text-danger"}`}>
              {base ? percent.format(gain / base) : "–"}
            </p>
            <button type="button" className="text-xs text-accent" onClick={() => setSelection(null)}>
              Auswahl aufheben
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-end justify-between gap-3" aria-live="polite">
          <div>
            <p className="text-xs text-muted">{hover === null ? "Heute" : dateFmt.format(point.t)}</p>
            <p className="font-display text-2xl tabular-nums">{euro.format(point.value)}</p>
          </div>
          <p className="text-right text-xs text-muted">
            Einkaufswert
            <br />
            <span className="text-sm text-fg tabular-nums">{euro.format(point.cost)}</span>
          </p>
        </div>
      )}

      <svg
        ref={svg}
        viewBox={`0 0 ${W} ${H}`}
        className="block w-full touch-pan-y select-none"
        role="img"
        aria-label={`Kellerwert von ${euro.format(series[0].value)} auf ${euro.format(series[series.length - 1].value)}`}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onPointerLeave={(e) => {
          if (e.pointerType === "mouse" && !selection) setHover(null);
        }}
      >
        <defs>
          <linearGradient id="value-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--series-1)" stopOpacity="0.28" />
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
        {sel && (
          <g>
            <rect
              x={x(sel[0])}
              y={PAD.top}
              width={x(sel[1]) - x(sel[0])}
              height={H - PAD.top - PAD.bottom}
              fill="var(--series-1)"
              fillOpacity="0.12"
            />
            {[sel[0], sel[1]].map((i) => (
              <line
                key={i}
                x1={x(i)}
                x2={x(i)}
                y1={PAD.top}
                y2={H - PAD.bottom}
                stroke="var(--series-1)"
                strokeWidth="1.5"
              />
            ))}
          </g>
        )}
        <motion.path initial={false} animate={{ d: area }} fill="url(#value-area)" />
        <motion.path
          initial={false}
          animate={{ d: cost }}
          fill="none"
          stroke="var(--muted)"
          strokeOpacity="0.7"
          strokeWidth="1.5"
          strokeDasharray="4 4"
        />
        <motion.path
          initial={false}
          animate={{ d: line }}
          fill="none"
          stroke="var(--series-1)"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <line
          x1={x(index)}
          x2={x(index)}
          y1={PAD.top}
          y2={H - PAD.bottom}
          stroke="var(--fg)"
          strokeOpacity={hover === null || sel ? 0 : 0.35}
        />
        {(sel ? [sel[0], sel[1]] : [index]).map((i) => (
          <circle
            key={i}
            cx={x(i)}
            cy={y(series[i].value)}
            r="4.5"
            fill="var(--series-1)"
            stroke="var(--surface)"
            strokeWidth="2"
          />
        ))}
        <text x={PAD.left} y={H - 6} fontSize="10" fill="var(--muted)">
          {shortFmt.format(series[0].t)}
        </text>
        <text x={W - PAD.right} y={H - 6} fontSize="10" fill="var(--muted)" textAnchor="end">
          heute
        </text>
      </svg>

      {!sel && <p className="text-xs text-muted">Tipp: Mit zwei Fingern einen Zeitraum markieren.</p>}
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-3 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 rounded-full bg-series-1" aria-hidden /> Wert
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-4 border-t-[1.5px] border-dashed border-muted" aria-hidden /> Bezahlt
          </span>
        </span>
        <div className="w-48 shrink-0">
          <Segmented<Range>
            label="Zeitraum"
            value={range}
            onChange={(r) => {
              tick("minor");
              setHover(null);
              setSelection(null);
              setRange(r);
            }}
            options={[
              { value: "3m", label: "3M" },
              { value: "1j", label: "1J" },
              { value: "alles", label: "Alles" },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
