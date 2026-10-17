"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { cn } from "@/lib/cn";

export type RadarSeries = { name: string; values: number[]; color: string };

const SIZE = 320;
const C = SIZE / 2;
const R = 104;
const MAX = 10;

const round = (n: number) => Math.round(n * 100) / 100;

function point(value: number, index: number, count: number, radius = R) {
  const angle = (index / count) * Math.PI * 2 - Math.PI / 2;
  const r = (value / MAX) * radius;
  return [round(C + r * Math.cos(angle)), round(C + r * Math.sin(angle))] as const;
}

function shape(values: number[]) {
  return values.map((v, i) => `${i ? "L" : "M"}${point(v, i, values.length).join(" ")}`).join("") + "Z";
}

/**
 * Radar chart in the design system: recessive rings, thin 2px outlines with a
 * light fill, 8px markers with a surface ring. Tap an axis for exact values;
 * the table view below gives the same numbers without relying on colour.
 */
export function RadarChart({ axes, series }: { axes: string[]; series: RadarSeries[] }) {
  const [active, setActive] = useState<number | null>(null);
  const [table, setTable] = useState(false);
  const n = axes.length;

  return (
    <div className="space-y-3">
      <ul className="flex flex-wrap gap-x-5 gap-y-1 text-sm" aria-label="Legende">
        {series.map((s) => (
          <li key={s.name} className="flex items-center gap-2">
            <span aria-hidden className="size-3 rounded-full" style={{ background: s.color }} />
            {s.name}
          </li>
        ))}
      </ul>

      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="mx-auto block w-full max-w-[340px]"
        role="img"
        aria-label={`Vergleich: ${series.map((s) => s.name).join(" und ")}`}
      >
        {[2, 4, 6, 8, 10].map((ring) => (
          <path
            key={ring}
            d={shape(Array(n).fill(ring))}
            fill="none"
            stroke="var(--border)"
            strokeWidth={ring === 10 ? 1.2 : 0.8}
          />
        ))}
        {axes.map((label, i) => {
          const [x, y] = point(MAX, i, n);
          const [lx, ly] = point(MAX, i, n, R + 26);
          const isActive = active === i;
          return (
            <g key={label}>
              <line
                x1={C}
                y1={C}
                x2={x}
                y2={y}
                stroke={isActive ? "var(--accent)" : "var(--border)"}
                strokeWidth={isActive ? 1.5 : 0.8}
              />
              <text
                x={lx}
                y={ly}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="12"
                fontWeight={isActive ? 600 : 500}
                fill={isActive ? "var(--fg)" : "var(--muted)"}
              >
                {label}
              </text>
              {/* Generous tap target around the label */}
              <circle
                cx={lx}
                cy={ly}
                r="24"
                fill="transparent"
                className="cursor-pointer"
                role="button"
                tabIndex={0}
                aria-label={`${label}: ${series.map((s) => `${s.name} ${s.values[i]}`).join(", ")}`}
                onClick={() => setActive(isActive ? null : i)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setActive(isActive ? null : i);
                  }
                }}
              />
            </g>
          );
        })}

        {series.map((s) => (
          <g key={s.name}>
            <motion.path
              initial={false}
              animate={{ d: shape(s.values) }}
              transition={{ type: "spring", stiffness: 120, damping: 18 }}
              fill={s.color}
              fillOpacity="0.16"
              stroke={s.color}
              strokeWidth="2"
              strokeLinejoin="round"
            />
            {s.values.map((v, i) => {
              const [x, y] = point(v, i, n);
              return (
                <motion.circle
                  key={i}
                  initial={false}
                  animate={{ cx: x, cy: y }}
                  transition={{ type: "spring", stiffness: 120, damping: 18 }}
                  r={active === i ? 5.5 : 4}
                  fill={s.color}
                  stroke="var(--surface)"
                  strokeWidth="2"
                />
              );
            })}
          </g>
        ))}
      </svg>

      <p className="min-h-6 text-center text-sm" aria-live="polite">
        {active === null ? (
          <span className="text-muted">Tipp auf eine Eigenschaft für die Werte.</span>
        ) : (
          <>
            <strong className="font-semibold">{axes[active]}:</strong>{" "}
            {series.map((s) => `${s.name} ${s.values[active]}`).join(" · ")}
          </>
        )}
      </p>

      <button
        type="button"
        onClick={() => setTable(!table)}
        aria-expanded={table}
        className="mx-auto block h-10 text-sm text-accent underline-offset-4 hover:underline"
      >
        {table ? "Tabelle ausblenden" : "Als Tabelle zeigen"}
      </button>
      {table && (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted">
              <th className="py-1.5 font-medium">Eigenschaft</th>
              {series.map((s) => (
                <th key={s.name} className="py-1.5 text-right font-medium">
                  {s.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {axes.map((label, i) => (
              <tr key={label} className={cn("border-t border-border", active === i && "text-accent")}>
                <td className="py-1.5">{label}</td>
                {series.map((s) => (
                  <td key={s.name} className="py-1.5 text-right tabular-nums">
                    {s.values[i]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
