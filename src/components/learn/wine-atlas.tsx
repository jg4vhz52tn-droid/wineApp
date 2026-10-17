"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Card, Eyebrow } from "@/components/ui/card";
import { Pill } from "@/components/ui/chip";
import { Segmented } from "@/components/ui/segmented";
import { GERMANY, REGIONS } from "@/config/learn/atlas";
import { cn } from "@/lib/cn";
import { tick } from "@/lib/haptics";

// Simple equirectangular projection, squashed by cos(latitude).
const LNG0 = 5.6;
const LAT0 = 55.2;
const SCALE = 46;
const COS = Math.cos((51 * Math.PI) / 180);
const project = (lat: number, lng: number) =>
  [Math.round((lng - LNG0) * SCALE * COS * 10) / 10, Math.round((LAT0 - lat) * SCALE * 10) / 10] as const;

const OUTLINE =
  GERMANY.map(([lat, lng], i) => `${i ? "L" : "M"}${project(lat, lng).join(" ")}`).join("") + "Z";
const WIDTH = Math.round((15.4 - LNG0) * SCALE * COS);
const HEIGHT = Math.round((LAT0 - 47.1) * SCALE);
const radius = (ha: number) => Math.round((3.5 + Math.sqrt(ha) * 0.065) * 10) / 10;
const format = new Intl.NumberFormat("de-DE");

export function WineAtlas() {
  const [active, setActive] = useState("mosel");
  const [view, setView] = useState<"karte" | "liste">("karte");
  const region = REGIONS.find((r) => r.id === active)!;
  const byArea = [...REGIONS].sort((a, b) => b.hectares - a.hectares);
  const maxArea = byArea[0].hectares;

  function choose(id: string) {
    tick("minor");
    setActive(id);
  }

  return (
    <div className="space-y-4">
      <Segmented<"karte" | "liste">
        label="Ansicht"
        value={view}
        onChange={setView}
        options={[
          { value: "karte", label: "Karte" },
          { value: "liste", label: "Nach Größe" },
        ]}
      />

      {view === "karte" ? (
        <Card className="p-3">
          <svg
            viewBox={`-6 -6 ${WIDTH + 12} ${HEIGHT + 12}`}
            className="mx-auto block w-full max-w-[360px]"
            role="group"
            aria-label="Karte der deutschen Anbaugebiete (stilisiert)"
          >
            <path
              d={OUTLINE}
              fill="var(--surface-2)"
              stroke="var(--border)"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            {/* Rhine as a hint of orientation */}
            <path
              d={[
                [47.6, 7.6],
                [48.6, 7.85],
                [49.4, 8.45],
                [50.0, 8.25],
                [50.0, 7.9],
                [50.35, 7.6],
                [50.9, 6.95],
                [51.85, 6.1],
              ]
                .map(([lat, lng], i) => `${i ? "L" : "M"}${project(lat, lng).join(" ")}`)
                .join("")}
              fill="none"
              stroke="#6aa0c8"
              strokeOpacity="0.55"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            {REGIONS.map((r) => {
              const [x, y] = project(r.lat, r.lng);
              const isActive = r.id === active;
              return (
                <g
                  key={r.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`${r.name}, etwa ${format.format(r.hectares)} Hektar`}
                  aria-pressed={isActive}
                  className="cursor-pointer outline-none"
                  onClick={() => choose(r.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      choose(r.id);
                    }
                  }}
                >
                  <circle cx={x} cy={y} r="18" fill="transparent" />
                  <motion.circle
                    cx={x}
                    cy={y}
                    initial={false}
                    animate={{ r: radius(r.hectares) * (isActive ? 1.15 : 1) }}
                    fill="var(--wine)"
                    fillOpacity={isActive ? 0.95 : 0.55}
                    stroke={isActive ? "var(--accent)" : "var(--surface)"}
                    strokeWidth="2"
                  />
                  {isActive && (
                    <text
                      x={x}
                      y={y - radius(r.hectares) - 6}
                      textAnchor="middle"
                      fontSize="11"
                      fontWeight="600"
                      fill="var(--fg)"
                    >
                      {r.name}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
          <p className="mt-1 text-center text-xs text-muted">Stilisierte Karte · Kreisgröße = Rebfläche</p>
        </Card>
      ) : (
        <Card>
          <ol className="space-y-1.5">
            {byArea.map((r, index) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => choose(r.id)}
                  className={cn(
                    "grid w-full grid-cols-[1.5rem_8.5rem_1fr] items-center gap-2 rounded-control px-2 py-1.5 text-left text-sm",
                    r.id === active && "bg-surface-2",
                  )}
                >
                  <span className="text-muted tabular-nums">{index + 1}</span>
                  <span className="truncate font-medium">{r.name}</span>
                  <span className="flex items-center gap-2">
                    <span
                      className="h-2 rounded-full bg-wine"
                      style={{ width: `${Math.max(3, (r.hectares / maxArea) * 100)}%` }}
                    />
                    <span className="shrink-0 text-xs text-muted tabular-nums">
                      {format.format(r.hectares)} ha
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </Card>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={region.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="space-y-3" aria-live="polite">
            <div className="flex items-baseline justify-between gap-3">
              <p className="font-display text-3xl leading-tight">{region.name}</p>
              <span className="shrink-0 text-sm text-muted tabular-nums">
                ≈ {format.format(region.hectares)} ha
              </span>
            </div>
            <p className="leading-relaxed">{region.character}</p>
            <div className="grid gap-2 text-sm">
              <p>
                <span className="text-muted">Rebsorten: </span>
                {region.grapes.join(", ")}
              </p>
              <p>
                <span className="text-muted">Böden: </span>
                {region.soils}
              </p>
            </div>
            <div className="space-y-1.5">
              <Eyebrow>Bekannte Lagen</Eyebrow>
              <div className="flex flex-wrap gap-2">
                {region.sites.map((site) => (
                  <Pill key={site}>{site}</Pill>
                ))}
              </div>
            </div>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
