"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Card, Eyebrow } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import { tick } from "@/lib/haptics";

// A made-up producer on a typical Mosel label - every part is tappable.
type Spot = { id: string; label: string; text: string };

const SPOTS: Spot[] = [
  {
    id: "producer",
    label: "Erzeuger",
    text: "Wer den Wein gemacht hat. Ein guter Erzeuger ist oft der verlässlichste Hinweis auf Qualität.",
  },
  {
    id: "vintage",
    label: "Jahrgang",
    text: "Das Jahr der Lese. Er verrät das Alter – und mit etwas Erfahrung auch, wie das Wetter war.",
  },
  {
    id: "site",
    label: "Ort & Lage",
    text: "„Wehlener Sonnenuhr“: Ort Wehlen, Lage Sonnenuhr. Je kleiner die Herkunft, desto höher der Anspruch.",
  },
  { id: "grape", label: "Rebsorte", text: "Steht sie drauf, stammt der Wein (fast) ganz aus dieser Sorte." },
  {
    id: "pradikat",
    label: "Prädikat",
    text: "Spätlese sagt, wie reif die Trauben bei der Lese waren – nicht, wie süß der Wein ist.",
  },
  {
    id: "taste",
    label: "Geschmack",
    text: "„Trocken“ beschreibt den Restzucker. Ohne Angabe ist eine Spätlese meist fruchtsüß.",
  },
  { id: "region", label: "Anbaugebiet", text: "Eines der 13 deutschen Anbaugebiete – hier die Mosel." },
  {
    id: "alcohol",
    label: "Alkohol",
    text: "12,5 % vol bei einer Mosel-Spätlese deutet auf einen trockenen Wein. 7–8 % hieße: deutlich süß.",
  },
  {
    id: "ap",
    label: "A.P.Nr.",
    text: "Die amtliche Prüfnummer: Der Wein wurde analysiert und verkostet. Die letzten Ziffern verraten das Prüfjahr.",
  },
  {
    id: "estate",
    label: "Gutsabfüllung",
    text: "Trauben, Ausbau und Abfüllung aus einer Hand – vom Weingut selbst.",
  },
];

const BOX: Record<string, { x: number; y: number; w: number; h: number }> = {
  producer: { x: 30, y: 20, w: 200, h: 26 },
  vintage: { x: 95, y: 56, w: 70, h: 30 },
  site: { x: 30, y: 92, w: 200, h: 44 },
  grape: { x: 60, y: 140, w: 140, h: 22 },
  pradikat: { x: 60, y: 164, w: 70, h: 22 },
  taste: { x: 132, y: 164, w: 70, h: 22 },
  region: { x: 30, y: 196, w: 200, h: 18 },
  alcohol: { x: 30, y: 224, w: 70, h: 18 },
  ap: { x: 104, y: 224, w: 126, h: 18 },
  estate: { x: 30, y: 246, w: 200, h: 18 },
};

export function LabelExplorer() {
  const [active, setActive] = useState<string>("site");
  const [seen, setSeen] = useState<Set<string>>(new Set(["site"]));
  const spot = SPOTS.find((s) => s.id === active)!;

  function open(id: string) {
    tick("minor");
    setActive(id);
    setSeen((s) => new Set(s).add(id));
  }

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between">
        <Eyebrow>Etikett zum Antippen</Eyebrow>
        <span className="text-sm text-muted tabular-nums">
          {seen.size}/{SPOTS.length} entdeckt
        </span>
      </div>

      <svg
        viewBox="0 0 260 280"
        className="mx-auto block w-full max-w-[320px]"
        role="group"
        aria-label="Weinetikett"
      >
        <rect x="10" y="6" width="240" height="268" rx="6" fill="#f4ede5" />
        <rect
          x="18"
          y="14"
          width="224"
          height="252"
          rx="3"
          fill="none"
          stroke="#a8823f"
          strokeOpacity="0.6"
        />
        <g fontFamily="var(--font-sans-face), sans-serif" fill="#2a1520" textAnchor="middle">
          <text x="130" y="38" fontSize="10" letterSpacing="2.4">
            WEINGUT AM FLUSSUFER
          </text>
          <text x="130" y="80" fontSize="22" fontFamily="var(--font-serif-face), serif">
            2021
          </text>
          <text x="130" y="110" fontSize="19" fontFamily="var(--font-serif-face), serif">
            Wehlener
          </text>
          <text x="130" y="130" fontSize="19" fontFamily="var(--font-serif-face), serif">
            Sonnenuhr
          </text>
          <text x="130" y="156" fontSize="11" letterSpacing="1.5">
            RIESLING
          </text>
          <text x="95" y="180" fontSize="10">
            Spätlese
          </text>
          <text x="167" y="180" fontSize="10">
            trocken
          </text>
          <text x="130" y="209" fontSize="8.5" letterSpacing="1" fill="#6c5660">
            PRÄDIKATSWEIN · MOSEL
          </text>
          <text x="65" y="237" fontSize="8" fill="#6c5660">
            12,5 % vol
          </text>
          <text x="167" y="237" fontSize="7.5" fill="#6c5660">
            A.P.Nr. 2 576 123 08 22
          </text>
          <text x="130" y="259" fontSize="7.5" fill="#6c5660">
            Gutsabfüllung · 0,75 l · enthält Sulfite
          </text>
        </g>
        {SPOTS.map((s) => {
          const b = BOX[s.id];
          const isActive = s.id === active;
          return (
            <g key={s.id}>
              <rect
                x={b.x}
                y={b.y}
                width={b.w}
                height={b.h}
                rx="4"
                fill={isActive ? "var(--accent)" : "transparent"}
                fillOpacity={isActive ? 0.18 : 0}
                stroke={isActive ? "var(--accent)" : seen.has(s.id) ? "transparent" : "#a8823f"}
                strokeDasharray={isActive ? undefined : "3 3"}
                strokeOpacity={isActive ? 1 : 0.5}
                className="cursor-pointer"
                role="button"
                tabIndex={0}
                aria-label={s.label}
                aria-pressed={isActive}
                onClick={() => open(s.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    open(s.id);
                  }
                }}
              />
            </g>
          );
        })}
      </svg>

      <AnimatePresence mode="wait">
        <motion.div
          key={spot.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
          className="min-h-24 rounded-control bg-surface-2/70 p-4"
          aria-live="polite"
        >
          <p className="font-display text-xl">{spot.label}</p>
          <p className="mt-1 text-sm leading-relaxed">{spot.text}</p>
        </motion.div>
      </AnimatePresence>

      <div className="flex flex-wrap gap-1.5">
        {SPOTS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => open(s.id)}
            className={cn(
              "h-9 rounded-full px-3 text-xs font-medium transition",
              s.id === active
                ? "bg-accent text-accent-fg"
                : seen.has(s.id)
                  ? "bg-surface-2 text-fg"
                  : "bg-surface-2 text-muted",
            )}
          >
            {seen.has(s.id) && s.id !== active ? "✓ " : ""}
            {s.label}
          </button>
        ))}
      </div>
    </Card>
  );
}
