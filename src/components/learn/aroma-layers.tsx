"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { TickDial } from "@/components/ui/tick-dial";
import { AGING_AROMAS, describeAge, LAYERS } from "@/config/learn/aromas-learn";

/** The three aroma layers - and a bottle-age dial that shows how they shift. */
export function AromaLayers() {
  const [years, setYears] = useState(1);

  return (
    <div className="space-y-6">
      <div className="grid gap-3">
        {LAYERS.map((layer, index) => (
          <Card key={layer.id} className="flex gap-4">
            <span
              className="flex size-11 shrink-0 items-center justify-center rounded-full font-display text-xl text-[#1a0f12]"
              style={{ background: layer.color }}
              aria-hidden
            >
              {index + 1}
            </span>
            <div className="space-y-1">
              <p className="font-display text-2xl leading-tight">
                {layer.title} <span className="font-sans text-sm text-muted">– {layer.from}</span>
              </p>
              <p className="leading-relaxed">{layer.text}</p>
            </div>
          </Card>
        ))}
      </div>

      <section className="space-y-3">
        <h2 className="text-2xl">Dreh an der Zeit</h2>
        <p className="text-muted">
          Ein Riesling mit etwas Hefelager – wisch durch die Jahre und schau, welche Aromen kommen und gehen.
        </p>
        <TickDial
          label="Alter der Flasche (Jahre)"
          value={years}
          onChange={setYears}
          min={0}
          max={20}
          step={1}
          majorEvery={5}
          describe={describeAge}
        />
        <Card className="space-y-4">
          {LAYERS.map((layer) => (
            <div key={layer.id} className="space-y-2">
              <p className="flex items-center gap-2 text-sm font-medium">
                <span aria-hidden className="size-2.5 rounded-full" style={{ background: layer.color }} />
                {layer.title}
              </p>
              <ul className="flex flex-wrap gap-2">
                {AGING_AROMAS.filter((a) => a.layer === layer.id).map((aroma) => {
                  const w = aroma.weight(years);
                  return (
                    <motion.li
                      key={aroma.name}
                      initial={false}
                      animate={{ opacity: 0.18 + w * 0.82, scale: 0.86 + w * 0.18 }}
                      transition={{ type: "spring", stiffness: 200, damping: 22 }}
                      className="rounded-full border border-border bg-surface-2 px-3 py-1.5 text-sm"
                      style={{ borderColor: w > 0.6 ? layer.color : undefined }}
                      aria-label={`${aroma.name}: ${w > 0.6 ? "deutlich" : w > 0.25 ? "dezent" : "kaum"}`}
                    >
                      {aroma.name}
                    </motion.li>
                  );
                })}
              </ul>
            </div>
          ))}
        </Card>
      </section>
    </div>
  );
}
