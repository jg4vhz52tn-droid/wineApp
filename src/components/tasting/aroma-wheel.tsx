"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { AROMA_FAMILIES, AROMA_COLOR } from "@/config/aromas";
import { cn } from "@/lib/cn";

const SEGMENT = 360 / AROMA_FAMILIES.length;
const INNER = 60;
const OUTER = 140;
const DOTS = 152;

// Rounded so server and browser produce identical markup (their trig
// functions can differ in the last digit, which breaks hydration).
const round = (n: number) => Math.round(n * 100) / 100;

function polar(radius: number, angle: number) {
  const rad = (angle * Math.PI) / 180;
  return [round(radius * Math.sin(rad)), round(-radius * Math.cos(rad))] as const;
}

function sector(r0: number, r1: number, a0: number, a1: number) {
  const [x0, y0] = polar(r1, a0);
  const [x1, y1] = polar(r1, a1);
  const [x2, y2] = polar(r0, a1);
  const [x3, y3] = polar(r0, a0);
  return `M${x0} ${y0}A${r1} ${r1} 0 0 1 ${x1} ${y1}L${x2} ${y2}A${r0} ${r0} 0 0 0 ${x3} ${y3}Z`;
}

const DARK_TEXT = "#1a0f12";

/**
 * Aroma wheel: tap a family on the wheel, then pick its aromas below.
 * Picked aromas light up as dots on the outer ring of their family.
 */
export function AromaWheel({ value, onChange }: { value: string[]; onChange: (aromas: string[]) => void }) {
  const [focus, setFocus] = useState(0);
  const family = AROMA_FAMILIES[focus];
  const picked = new Set(value);

  const toggle = (aroma: string) =>
    onChange(picked.has(aroma) ? value.filter((a) => a !== aroma) : [...value, aroma]);

  return (
    <div className="space-y-4">
      <svg
        viewBox="-170 -170 340 340"
        className="mx-auto block w-full max-w-[340px] touch-manipulation"
        role="group"
        aria-label="Aromarad"
      >
        {AROMA_FAMILIES.map((f, index) => {
          const a0 = index * SEGMENT + 0.8;
          const a1 = (index + 1) * SEGMENT - 0.8;
          const mid = (a0 + a1) / 2;
          const focused = index === focus;
          const [dx, dy] = polar(focused ? 7 : 0, mid);
          const [lx, ly] = polar((INNER + OUTER) / 2, mid);
          const flip = mid > 180;
          const count = f.aromas.filter((aroma) => picked.has(aroma)).length;

          return (
            <motion.g
              key={f.id}
              role="button"
              tabIndex={0}
              aria-pressed={focused}
              aria-label={`${f.name}${count ? `, ${count} gewählt` : ""}`}
              className="cursor-pointer outline-none [&:focus-visible>path:first-child]:stroke-accent"
              animate={{ x: dx, y: dy }}
              transition={{ type: "spring", stiffness: 420, damping: 28 }}
              onClick={() => setFocus(index)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setFocus(index);
                }
              }}
            >
              <path
                d={sector(INNER, OUTER, a0, a1)}
                fill="var(--surface-2)"
                stroke="var(--bg)"
                strokeWidth="2"
              />
              <path
                d={sector(INNER, OUTER, a0, a1)}
                fill={f.color}
                fillOpacity={focused ? 1 : count ? 0.42 : 0.16}
                style={{ transition: "fill-opacity 200ms" }}
              />
              <text
                x={lx}
                y={ly}
                transform={`rotate(${flip ? mid + 90 : mid - 90} ${lx} ${ly})`}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="11"
                fontWeight={focused ? 600 : 500}
                fill={focused ? DARK_TEXT : "var(--fg)"}
                fillOpacity={focused ? 1 : 0.85}
                style={{ pointerEvents: "none" }}
              >
                {f.name}
              </text>
              {f.aromas.map((aroma, slot) => {
                const angle = a0 + ((slot + 1) * (a1 - a0)) / (f.aromas.length + 1);
                const [cx, cy] = polar(DOTS, angle);
                return (
                  <circle
                    key={aroma}
                    cx={cx}
                    cy={cy}
                    r={picked.has(aroma) ? 4.5 : 2.5}
                    fill={picked.has(aroma) ? f.color : "var(--border)"}
                    style={{ transition: "r 200ms, fill 200ms" }}
                  />
                );
              })}
            </motion.g>
          );
        })}

        <circle r={INNER - 6} fill="var(--surface)" stroke="var(--border)" />
        <text
          y="-4"
          textAnchor="middle"
          fontSize="17"
          fill="var(--fg)"
          className="font-display"
          style={{ pointerEvents: "none" }}
        >
          {family.name}
        </text>
        <text y="16" textAnchor="middle" fontSize="10" fill="var(--muted)" style={{ pointerEvents: "none" }}>
          {value.length ? `${value.length} Aromen gewählt` : "Familie antippen"}
        </text>
      </svg>

      <div className="grid grid-cols-2 gap-2">
        {family.aromas.map((aroma) => {
          const on = picked.has(aroma);
          return (
            <button
              key={aroma}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(aroma)}
              className={cn(
                "flex h-14 min-w-0 items-center gap-2.5 rounded-control border px-3.5 text-left text-[0.9rem] leading-tight font-medium transition active:scale-[0.97]",
                on ? "border-transparent" : "border-border bg-surface",
              )}
              style={on ? { background: family.color, color: DARK_TEXT } : undefined}
            >
              <span
                aria-hidden
                className="size-3 shrink-0 rounded-full"
                style={{ background: on ? DARK_TEXT : family.color, opacity: on ? 0.75 : 1 }}
              />
              {aroma}
            </button>
          );
        })}
      </div>

      {value.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label="Gewählte Aromen">
          {value.map((aroma) => (
            <li key={aroma}>
              <button
                type="button"
                onClick={() => toggle(aroma)}
                aria-label={`${aroma} entfernen`}
                className="inline-flex h-9 items-center gap-2 rounded-full bg-surface-2 pr-3 pl-2.5 text-sm"
              >
                <span
                  aria-hidden
                  className="size-2.5 rounded-full"
                  style={{ background: AROMA_COLOR.get(aroma) }}
                />
                {aroma}
                <span aria-hidden className="text-muted">
                  ×
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
