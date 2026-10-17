"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Card, Eyebrow } from "@/components/ui/card";
import { Segmented } from "@/components/ui/segmented";
import { TickDial } from "@/components/ui/tick-dial";
import { MONTHS, PROCESS, phaseFor, type WineStyle } from "@/config/learn/winemaking";
import { cn } from "@/lib/cn";
import { tick } from "@/lib/haptics";

export function VineYear() {
  const [month, setMonth] = useState(9);
  const phase = phaseFor(month);
  return (
    <section className="space-y-3">
      <h2 className="text-2xl">Das Weinjahr</h2>
      <p className="text-muted">Wisch durch die Monate – was passiert draußen, was im Keller?</p>
      <TickDial
        label="Monat"
        value={month}
        onChange={setMonth}
        min={1}
        max={12}
        step={1}
        majorEvery={3}
        format={(m) => MONTHS[m - 1]}
        describe={() => phase.phase}
      />
      <AnimatePresence mode="wait">
        <motion.div
          key={phase.phase}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
          className="grid gap-3"
        >
          <Card className="space-y-1">
            <Eyebrow>Im Weinberg</Eyebrow>
            <p className="leading-relaxed">{phase.vineyard}</p>
          </Card>
          <Card className="space-y-1">
            <Eyebrow>Im Keller</Eyebrow>
            <p className="leading-relaxed">{phase.cellar}</p>
          </Card>
        </motion.div>
      </AnimatePresence>
    </section>
  );
}

export function WineProcess() {
  const [style, setStyle] = useState<WineStyle>("rot");
  const [step, setStep] = useState(0);
  const steps = PROCESS[style];
  const current = steps[Math.min(step, steps.length - 1)];

  return (
    <section className="space-y-4">
      <h2 className="text-2xl">Weiß, Rosé, Rot</h2>
      <p className="text-muted">
        Der Unterschied liegt vor allem darin, wie lange Saft und Schalen zusammenbleiben.
      </p>
      <Segmented<WineStyle>
        label="Weinart"
        value={style}
        onChange={(next) => {
          tick("minor");
          setStyle(next);
          setStep(0);
        }}
        options={[
          { value: "weiss", label: "Weißwein" },
          { value: "rose", label: "Rosé" },
          { value: "rot", label: "Rotwein" },
        ]}
      />

      <Card className="flex items-center gap-5">
        <Glass color={current.color} />
        <div className="min-w-0 flex-1 space-y-1" aria-live="polite">
          <Eyebrow>
            Schritt {Math.min(step, steps.length - 1) + 1} von {steps.length}
          </Eyebrow>
          <p className="font-display text-2xl leading-tight">{current.title}</p>
          <p className="text-sm leading-relaxed">{current.text}</p>
        </div>
      </Card>

      <ol className="flex gap-1.5" aria-label="Schritte">
        {steps.map((s, i) => (
          <li key={s.title} className="flex-1">
            <button
              type="button"
              onClick={() => {
                tick("minor");
                setStep(i);
              }}
              aria-label={s.title}
              aria-current={i === step ? "step" : undefined}
              className="flex h-11 w-full items-center"
            >
              <span
                className={cn(
                  "h-1.5 w-full rounded-full transition",
                  i <= step ? "bg-accent" : "bg-surface-2",
                )}
              />
            </button>
          </li>
        ))}
      </ol>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={step === 0}
          onClick={() => setStep((s) => s - 1)}
          className="h-12 rounded-control bg-surface-2 text-sm font-medium disabled:opacity-40"
        >
          ← Zurück
        </button>
        <button
          type="button"
          disabled={step >= steps.length - 1}
          onClick={() => {
            tick("minor");
            setStep((s) => s + 1);
          }}
          className="h-12 rounded-control bg-accent text-sm font-medium text-accent-fg disabled:opacity-40"
        >
          Nächster Schritt →
        </button>
      </div>
    </section>
  );
}

function Glass({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 60 90" className="h-24 w-16 shrink-0" aria-hidden>
      <defs>
        <clipPath id="process-bowl">
          <path d="M12 6h36l-2 22a16 16 0 0 1-32 0z" />
        </clipPath>
      </defs>
      <g clipPath="url(#process-bowl)">
        <motion.rect
          x="0"
          y="14"
          width="60"
          height="40"
          initial={false}
          animate={{ fill: color }}
          transition={{ duration: 0.8 }}
        />
        <rect x="0" y="14" width="60" height="3" fill="#fff" opacity="0.25" />
      </g>
      <path
        d="M12 6h36l-2 22a16 16 0 0 1-32 0zM30 44v34M18 84h24"
        fill="none"
        stroke="var(--muted)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
