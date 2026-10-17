"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, Eyebrow } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import { tick } from "@/lib/haptics";

export type GameRound = {
  prompt: string;
  /** Revealed one by one on request - fewer hints used, more points. */
  hints?: string[];
  options: string[];
  answer: number;
  explain: string;
};

/**
 * Small multiple-choice game: a few rounds, instant feedback, a score at the
 * end. Used for "Welche Rebsorte bin ich?", the aroma sorter and the fault
 * detective.
 */
export function ChoiceGame({ title, rounds }: { title: string; rounds: GameRound[] }) {
  const [round, setRound] = useState(0);
  const [hintsShown, setHintsShown] = useState(1);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const done = round >= rounds.length;
  const current = rounds[round];
  const maxHints = current?.hints?.length ?? 0;
  const pointsFor = (hints: number) => (maxHints ? Math.max(1, maxHints - hints + 1) : 1);
  const maxScore = rounds.reduce((sum, r) => sum + (r.hints?.length ?? 1), 0);

  function pick(index: number) {
    if (picked !== null) return;
    setPicked(index);
    if (index === current.answer) {
      tick("medium");
      setScore((s) => s + pointsFor(hintsShown));
    } else {
      tick("minor");
    }
  }

  function next() {
    setPicked(null);
    setHintsShown(1);
    setRound((r) => r + 1);
  }

  function restart() {
    setRound(0);
    setScore(0);
    setPicked(null);
    setHintsShown(1);
  }

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <Eyebrow>{title}</Eyebrow>
        <span className="text-sm text-muted tabular-nums">
          {done ? "Fertig" : `${round + 1} / ${rounds.length}`} · {score} Pkt.
        </span>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {done ? (
          <motion.div
            key="done"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <p className="font-display text-3xl leading-tight">
              {score} von {maxScore} Punkten
            </p>
            <p className="text-muted">
              {score >= maxScore * 0.8
                ? "Stark – du bist bereit für den nächsten Abend."
                : score >= maxScore * 0.5
                  ? "Gut! Noch eine Runde, und es sitzt."
                  : "Übung macht den Sommelier – einfach nochmal."}
            </p>
            <Button variant="secondary" onClick={restart}>
              Nochmal spielen
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key={round}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.25 }}
            className="space-y-4"
          >
            <p className="font-display text-2xl leading-tight">{current.prompt}</p>

            {current.hints && (
              <ol className="space-y-2">
                {current.hints
                  .slice(0, picked !== null ? current.hints.length : hintsShown)
                  .map((hint, i) => (
                    <motion.li
                      key={hint}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex gap-3 rounded-control bg-surface-2/70 px-4 py-3 text-[0.95rem]"
                    >
                      <span className="font-display text-lg leading-none text-accent">{i + 1}</span>
                      {hint}
                    </motion.li>
                  ))}
              </ol>
            )}
            {current.hints && picked === null && hintsShown < maxHints && (
              <button
                type="button"
                onClick={() => {
                  tick("minor");
                  setHintsShown((h) => h + 1);
                }}
                className="h-10 text-sm font-medium text-accent"
              >
                Noch ein Hinweis ({pointsFor(hintsShown + 1)} Pkt. möglich)
              </button>
            )}

            <div className="grid grid-cols-2 gap-2">
              {current.options.map((option, index) => {
                const state =
                  picked === null
                    ? "idle"
                    : index === current.answer
                      ? "right"
                      : index === picked
                        ? "wrong"
                        : "idle";
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => pick(index)}
                    disabled={picked !== null && state === "idle"}
                    className={cn(
                      "min-h-14 rounded-control border px-3 py-2 text-[0.92rem] leading-tight font-medium transition",
                      state === "right" && "border-transparent bg-success text-[#0f1f15]",
                      state === "wrong" && "border-danger/60 bg-danger/10",
                      state === "idle" && "border-border bg-surface-2/60 disabled:opacity-40",
                    )}
                  >
                    {option}
                  </button>
                );
              })}
            </div>

            {picked !== null && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-3"
                aria-live="polite"
              >
                <p className="text-sm leading-relaxed">
                  <strong>{picked === current.answer ? "Richtig! " : "Leider nein. "}</strong>
                  {current.explain}
                </p>
                <Button block onClick={next}>
                  {round + 1 < rounds.length ? "Nächste Runde" : "Ergebnis"}
                </Button>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
