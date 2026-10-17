"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Card, Eyebrow } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { DISHES, PLATE_TRAITS, RULES, suggestWine, type PlateTrait } from "@/config/learn/pairing";
import { cn } from "@/lib/cn";
import { tick } from "@/lib/haptics";

export function DishPicker() {
  const [index, setIndex] = useState(2);
  const d = DISHES[index];
  return (
    <section className="space-y-3">
      <h2 className="text-2xl">Was gibt’s heute?</h2>
      <div className="-mx-5 flex [scrollbar-width:none] gap-2 overflow-x-auto px-5 pb-1">
        {DISHES.map((dish, i) => (
          <Chip
            key={dish.dish}
            selected={i === index}
            className="shrink-0"
            onClick={() => {
              tick("minor");
              setIndex(i);
            }}
          >
            {dish.dish}
          </Chip>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={d.dish}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="space-y-2" aria-live="polite">
            <Eyebrow>{d.dish}</Eyebrow>
            <p className="font-display text-2xl leading-tight">{d.wine}</p>
            <p className="text-sm leading-relaxed text-muted">{d.why}</p>
          </Card>
        </motion.div>
      </AnimatePresence>
    </section>
  );
}

export function PairingRules() {
  const [open, setOpen] = useState(0);
  return (
    <section className="space-y-3">
      <h2 className="text-2xl">Fünf Regeln</h2>
      <ul className="space-y-2">
        {RULES.map((rule, i) => (
          <li key={rule.title}>
            <button
              type="button"
              aria-expanded={open === i}
              onClick={() => {
                tick("minor");
                setOpen(open === i ? -1 : i);
              }}
              className="w-full rounded-card border border-border bg-surface p-4 text-left"
            >
              <span className="flex items-center justify-between gap-3">
                <span className="font-display text-xl">{rule.title}</span>
                <span className={cn("text-muted transition", open === i && "rotate-45")} aria-hidden>
                  +
                </span>
              </span>
              <AnimatePresence initial={false}>
                {open === i && (
                  <motion.span
                    className="block overflow-hidden text-sm leading-relaxed text-muted"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                  >
                    <span className="block pt-2">{rule.text}</span>
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function PlateMixer() {
  const [traits, setTraits] = useState<PlateTrait[]>(["fett"]);
  const suggestion = suggestWine(traits);
  return (
    <Card className="space-y-4">
      <Eyebrow>Teller-Mixer</Eyebrow>
      <p className="font-display text-2xl leading-tight">Was ist auf dem Teller?</p>
      <div className="flex flex-wrap gap-2">
        {PLATE_TRAITS.map((t) => (
          <Chip
            key={t.id}
            selected={traits.includes(t.id)}
            onClick={() => {
              tick("minor");
              setTraits((list) => (list.includes(t.id) ? list.filter((x) => x !== t.id) : [...list, t.id]));
            }}
          >
            {t.label}
          </Chip>
        ))}
      </div>
      <div className="space-y-2 rounded-control bg-surface-2/70 p-4" aria-live="polite">
        {suggestion ? (
          <>
            <p className="text-sm text-muted">Der Wein braucht:</p>
            <ul className="space-y-1 text-sm">
              {PLATE_TRAITS.filter((t) => traits.includes(t.id)).map((t) => (
                <li key={t.id}>
                  <span className="text-muted">{t.label} → </span>
                  {t.advice}
                </li>
              ))}
            </ul>
            <p className="pt-1 font-display text-xl leading-snug">{suggestion}</p>
          </>
        ) : (
          <p className="text-sm text-muted">Tipp an, was das Gericht ausmacht.</p>
        )}
      </div>
    </Card>
  );
}
