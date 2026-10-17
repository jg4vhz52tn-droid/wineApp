"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import type { StoryCard } from "@/config/learn/stories";
import { cn } from "@/lib/cn";
import { tick } from "@/lib/haptics";

const INK = "#f4ede5";
const BRASS = "#d1ad72";

/** Story-style cards: tap right/left or swipe to move on. */
export function StoryCards({ cards, onFinish }: { cards: StoryCard[]; onFinish?: () => void }) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const reduce = useReducedMotion();
  const card = cards[index];
  const last = index === cards.length - 1;

  function go(step: 1 | -1) {
    const next = index + step;
    if (next < 0) return;
    if (next >= cards.length) {
      onFinish?.();
      return;
    }
    tick("minor");
    setDirection(step);
    setIndex(next);
  }

  return (
    <div className="space-y-3">
      <div
        className="relative aspect-[4/5] overflow-hidden rounded-[1.75rem] select-none"
        style={{
          color: INK,
          background:
            "radial-gradient(120% 70% at 0% 0%, #6e1b3a 0%, transparent 60%), radial-gradient(90% 60% at 100% 100%, #3d1a2d 0%, transparent 70%), #170b11",
        }}
      >
        <div className="absolute inset-x-5 top-5 z-10 flex gap-1.5" aria-hidden>
          {cards.map((_, i) => (
            <span key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-white/15">
              <motion.span
                className="block h-full rounded-full"
                style={{ background: BRASS }}
                initial={false}
                animate={{ width: i <= index ? "100%" : "0%" }}
                transition={{ duration: reduce ? 0 : 0.35 }}
              />
            </span>
          ))}
        </div>

        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={index}
            custom={direction}
            className="absolute inset-0 flex flex-col justify-end gap-4 p-7 pt-14"
            initial={reduce ? false : { opacity: 0, x: direction * 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduce ? undefined : { opacity: 0, x: direction * -60 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.25}
            onDragEnd={(_, info) => {
              if (info.offset.x < -60) go(1);
              else if (info.offset.x > 60) go(-1);
            }}
          >
            <p className="font-display text-[3.4rem] leading-[0.95] text-balance" style={{ color: BRASS }}>
              {card.big}
            </p>
            <p className="font-display text-2xl leading-tight">{card.title}</p>
            <p className="leading-relaxed" style={{ color: `${INK}cc` }}>
              {card.body}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Tap zones like in a story */}
        <button
          type="button"
          aria-label="Vorherige Karte"
          className="absolute inset-y-0 left-0 w-1/3"
          onClick={() => go(-1)}
          disabled={index === 0}
        />
        <button
          type="button"
          aria-label={last ? "Zur Frage" : "Nächste Karte"}
          className="absolute inset-y-0 right-0 w-1/3"
          onClick={() => go(1)}
        />
      </div>

      <div className="flex items-center justify-between text-sm text-muted">
        <span aria-live="polite">
          Karte {index + 1} von {cards.length}
        </span>
        <button
          type="button"
          onClick={() => go(1)}
          className={cn("h-11 px-2 font-medium", last ? "text-accent" : "text-fg")}
        >
          {last ? "Zur Frage ↓" : "Weiter →"}
        </button>
      </div>
    </div>
  );
}
