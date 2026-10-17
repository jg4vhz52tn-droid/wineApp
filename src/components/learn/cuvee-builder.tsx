"use client";

import { useState } from "react";
import { Card, Eyebrow } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { Slider } from "@/components/ui/slider";
import {
  BLEND_GRAPES,
  BLEND_PRESETS,
  BLEND_TRAITS,
  describeBlend,
  type BlendTrait,
} from "@/config/learn/cuvee";
import { tick } from "@/lib/haptics";
import { RadarChart } from "./radar-chart";

const START = BLEND_PRESETS[0].parts;

export function CuveeBuilder() {
  const [parts, setParts] = useState<Record<string, number>>(() =>
    Object.fromEntries(BLEND_GRAPES.map((g) => [g.id, START[g.id] ?? 0])),
  );
  const [preset, setPreset] = useState<string | null>(BLEND_PRESETS[0].name);

  const total = Object.values(parts).reduce((a, b) => a + b, 0);
  const share = (id: string) => (total ? parts[id] / total : 0);
  const profile = Object.fromEntries(
    BLEND_TRAITS.map((t) => [
      t.key,
      Math.round(BLEND_GRAPES.reduce((sum, g) => sum + share(g.id) * g.traits[t.key], 0) * 10) / 10,
    ]),
  ) as Record<BlendTrait, number>;

  function applyPreset(name: string) {
    const p = BLEND_PRESETS.find((x) => x.name === name)!;
    tick("medium");
    setPreset(name);
    setParts(Object.fromEntries(BLEND_GRAPES.map((g) => [g.id, p.parts[g.id] ?? 0])));
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm font-medium">Klassiker laden</p>
        <div className="flex flex-wrap gap-2">
          {BLEND_PRESETS.map((p) => (
            <Chip key={p.name} selected={preset === p.name} onClick={() => applyPreset(p.name)}>
              {p.name}
            </Chip>
          ))}
        </div>
        {preset && (
          <p className="text-sm text-muted">{BLEND_PRESETS.find((p) => p.name === preset)!.region}</p>
        )}
      </div>

      <Card className="space-y-2">
        <Eyebrow>Deine Cuvée</Eyebrow>
        <p className="font-display text-2xl leading-tight">
          {total ? describeBlend(profile) : "Schieb einen Regler hoch"}
        </p>
        {total > 0 && (
          <RadarChart
            axes={BLEND_TRAITS.map((t) => t.label)}
            series={[
              { name: "Cuvée", values: BLEND_TRAITS.map((t) => profile[t.key]), color: "var(--series-1)" },
            ]}
          />
        )}
      </Card>

      <Card className="space-y-5">
        <Eyebrow>Anteile</Eyebrow>
        {BLEND_GRAPES.map((g) => (
          <div key={g.id}>
            <Slider
              label={g.name}
              value={parts[g.id]}
              min={0}
              max={100}
              step={5}
              format={() => `${Math.round(share(g.id) * 100)} %`}
              onChange={(value) => {
                if (value % 25 === 0) tick("minor");
                setPreset(null);
                setParts((p) => ({ ...p, [g.id]: value }));
              }}
            />
            <p className="-mt-1 text-xs text-muted">{g.role}</p>
          </div>
        ))}
        <p className="text-xs text-muted">
          Die Regler sind Gewichte – die Prozente rechnen sich automatisch auf 100 % um.
        </p>
      </Card>
    </div>
  );
}
