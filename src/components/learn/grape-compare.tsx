"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Chip, Pill } from "@/components/ui/chip";
import { GRAPE_TRAITS, GRAPES, type GrapeProfile } from "@/config/learn/grapes";
import { tick } from "@/lib/haptics";
import { RadarChart } from "./radar-chart";

export function GrapeCompare() {
  const [a, setA] = useState("riesling");
  const [b, setB] = useState("grauburgunder");
  const grapeA = GRAPES.find((g) => g.id === a)!;
  const grapeB = GRAPES.find((g) => g.id === b)!;

  return (
    <div className="space-y-6">
      <Picker label="Sorte 1" color="var(--series-1)" value={a} other={b} onChange={setA} />
      <Picker label="Sorte 2" color="var(--series-2)" value={b} other={a} onChange={setB} />

      <Card>
        <RadarChart
          axes={GRAPE_TRAITS.map((t) => t.label)}
          series={[
            {
              name: grapeA.name,
              values: GRAPE_TRAITS.map((t) => grapeA.traits[t.key]),
              color: "var(--series-1)",
            },
            {
              name: grapeB.name,
              values: GRAPE_TRAITS.map((t) => grapeB.traits[t.key]),
              color: "var(--series-2)",
            },
          ]}
        />
      </Card>

      <div className="grid gap-3">
        <Profile grape={grapeA} color="var(--series-1)" />
        <Profile grape={grapeB} color="var(--series-2)" />
      </div>
    </div>
  );
}

function Picker({
  label,
  color,
  value,
  other,
  onChange,
}: {
  label: string;
  color: string;
  value: string;
  other: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="flex items-center gap-2 text-sm font-medium">
        <span aria-hidden className="size-3 rounded-full" style={{ background: color }} />
        {label}
      </p>
      <div
        className="-mx-5 flex [scrollbar-width:none] gap-2 overflow-x-auto px-5 pb-1"
        role="radiogroup"
        aria-label={label}
      >
        {GRAPES.map((g) => (
          <Chip
            key={g.id}
            role="radio"
            aria-checked={g.id === value}
            selected={g.id === value}
            disabled={g.id === other}
            className="shrink-0 disabled:opacity-35"
            onClick={() => {
              tick("minor");
              onChange(g.id);
            }}
          >
            {g.name}
          </Chip>
        ))}
      </div>
    </div>
  );
}

function Profile({ grape, color }: { grape: GrapeProfile; color: string }) {
  return (
    <Card className="space-y-3" style={{ borderTop: `3px solid ${color}` }}>
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-display text-2xl">{grape.name}</p>
        <span className="text-xs text-muted">{grape.color === "red" ? "Rot" : "Weiß"}</span>
      </div>
      <p className="leading-relaxed">{grape.note}</p>
      <p className="text-sm text-muted">{grape.home}</p>
      <div className="flex flex-wrap gap-2">
        {grape.aromas.map((aroma) => (
          <Pill key={aroma}>{aroma}</Pill>
        ))}
      </div>
    </Card>
  );
}
