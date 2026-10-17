"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Card, Eyebrow } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { TickDial } from "@/components/ui/tick-dial";
import { DECANT_CASES, GLASSES, SERVING_RANGES, servingNote } from "@/config/learn/serving";
import { cn } from "@/lib/cn";
import { tick } from "@/lib/haptics";

export function TemperatureGuide() {
  const [temp, setTemp] = useState(9);
  const fits = SERVING_RANGES.filter((r) => temp >= r.from && temp <= r.to);
  const note = servingNote(temp);
  return (
    <section className="space-y-3">
      <h2 className="text-2xl">Die richtige Temperatur</h2>
      <p className="text-muted">Wisch auf eine Temperatur – was schmeckt jetzt am besten?</p>
      <TickDial
        label="Temperatur (°C)"
        value={temp}
        onChange={setTemp}
        min={4}
        max={22}
        step={1}
        majorEvery={4}
        mediumEvery={2}
        format={(t) => `${t}°`}
        describe={(t) => (t < 11 ? "kühl" : t < 16 ? "temperiert" : t <= 18 ? "Rotwein-Zone" : "zu warm")}
      />
      <Card className="space-y-3" aria-live="polite">
        {fits.length ? (
          fits.map((r) => (
            <div key={r.style}>
              <p className="font-display text-xl leading-tight">{r.style}</p>
              <p className="text-sm text-muted">
                {r.from}–{r.to} °C · {r.example}
              </p>
            </div>
          ))
        ) : (
          <p className="text-muted">Bei {temp} °C fühlt sich kein Wein richtig wohl.</p>
        )}
        {note && <p className="rounded-control bg-surface-2/70 p-3 text-sm">{note}</p>}
        <p className="border-t border-border pt-3 text-sm text-muted">
          Faustregel: Weißwein 10 Minuten vor dem Servieren aus dem Kühlschrank, Rotwein 15 Minuten hinein.
        </p>
      </Card>
    </section>
  );
}

function GlassShape({ id }: { id: string }) {
  const bowls: Record<string, string> = {
    universal: "M22 8h36l-2 28a16 16 0 0 1-32 0z",
    burgunder: "M26 8h28c10 10 14 20 12 32a26 26 0 0 1-52 0c-2-12 2-22 12-32z",
    bordeaux: "M24 4h32l2 34a18 18 0 0 1-36 0z",
    sekt: "M30 4h20l2 40a12 12 0 0 1-24 0z",
  };
  return (
    <svg viewBox="0 0 80 110" className="h-24 w-20" aria-hidden>
      <path
        d={bowls[id]}
        fill="var(--wine)"
        fillOpacity="0.12"
        stroke="var(--fg)"
        strokeOpacity="0.6"
        strokeWidth="1.5"
      />
      <path
        d="M40 62v38M28 104h24"
        stroke="var(--fg)"
        strokeOpacity="0.6"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function GlassGuide() {
  const [active, setActive] = useState("universal");
  const glass = GLASSES.find((g) => g.id === active)!;
  return (
    <section className="space-y-3">
      <h2 className="text-2xl">Welches Glas?</h2>
      <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label="Glasform">
        {GLASSES.map((g) => (
          <button
            key={g.id}
            type="button"
            role="radio"
            aria-checked={g.id === active}
            onClick={() => {
              tick("minor");
              setActive(g.id);
            }}
            className={cn(
              "flex flex-col items-center rounded-control py-2 text-[0.7rem] leading-tight transition",
              g.id === active ? "bg-surface-2 ring-2 ring-accent" : "",
            )}
          >
            <GlassShape id={g.id} />
            {g.name}
          </button>
        ))}
      </div>
      <Card className="space-y-1" aria-live="polite">
        <Eyebrow>{glass.for}</Eyebrow>
        <p className="font-display text-xl">{glass.name}</p>
        <p className="text-sm leading-relaxed">{glass.text}</p>
      </Card>
    </section>
  );
}

const ANSWER_LABEL = { ja: "Ja, dekantieren", nein: "Nein, nicht nötig", vorsichtig: "Ja, aber vorsichtig" };

export function DecantGuide() {
  const [picked, setPicked] = useState<Record<number, string>>({});
  return (
    <section className="space-y-3">
      <h2 className="text-2xl">Dekantieren – ja oder nein?</h2>
      <p className="text-muted">Was meinst du? Tipp eine Antwort.</p>
      <div className="space-y-2">
        {DECANT_CASES.map((c, i) => (
          <Card key={c.question} className="space-y-3">
            <p className="font-medium">{c.question}</p>
            <div className="flex flex-wrap gap-2">
              {(["ja", "vorsichtig", "nein"] as const).map((a) => (
                <Chip
                  key={a}
                  selected={picked[i] === a}
                  onClick={() => {
                    tick(a === c.answer ? "medium" : "minor");
                    setPicked((p) => ({ ...p, [i]: a }));
                  }}
                >
                  {ANSWER_LABEL[a]}
                </Chip>
              ))}
            </div>
            <AnimatePresence>
              {picked[i] && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="overflow-hidden text-sm leading-relaxed"
                  aria-live="polite"
                >
                  <strong className={picked[i] === c.answer ? "text-success" : "text-danger"}>
                    {picked[i] === c.answer ? "Richtig. " : `Eher: ${ANSWER_LABEL[c.answer]}. `}
                  </strong>
                  {c.why}
                </motion.p>
              )}
            </AnimatePresence>
          </Card>
        ))}
      </div>
    </section>
  );
}
