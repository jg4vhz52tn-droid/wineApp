"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { Card, Eyebrow } from "@/components/ui/card";
import { MODULE_BY_ID, type ModuleId } from "@/config/learn/modules";
import { cn } from "@/lib/cn";
import { tick } from "@/lib/haptics";
import { completeModule, useLearnProgress } from "@/lib/learn-progress";
import { CardUnlock } from "./card-unlock";

export type QuizQuestion = {
  question: string;
  options: string[];
  /** Index into options. */
  answer: number;
  explanation: string;
};

/** One question at the end of a module. Getting it right completes the module. */
export function Quiz({ moduleId, quiz }: { moduleId: ModuleId; quiz: QuizQuestion }) {
  const { completed } = useLearnProgress();
  const [picked, setPicked] = useState<number | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const done = completed.includes(moduleId);
  const correct = picked === quiz.answer;

  function pick(index: number) {
    if (picked === quiz.answer) return;
    setPicked(index);
    if (index === quiz.answer) {
      tick("major");
      if (completeModule(moduleId)) setTimeout(() => setUnlocked(true), 700);
    } else {
      tick("minor");
    }
  }

  return (
    <Card className="space-y-4">
      <Eyebrow>{done && picked === null ? "Schon geschafft – nochmal?" : "Kurze Frage"}</Eyebrow>
      <p className="font-display text-2xl leading-tight">{quiz.question}</p>
      <div className="grid gap-2">
        {quiz.options.map((option, index) => {
          const state =
            picked === null
              ? "idle"
              : index === quiz.answer && correct
                ? "right"
                : index === picked
                  ? "wrong"
                  : "idle";
          return (
            <motion.button
              key={option}
              type="button"
              onClick={() => pick(index)}
              animate={state === "wrong" ? { x: [0, -6, 6, -4, 0] } : { x: 0 }}
              transition={{ duration: 0.35 }}
              className={cn(
                "min-h-14 rounded-control border px-4 py-3 text-left text-[0.95rem] font-medium transition",
                state === "right" && "border-transparent bg-success text-[#0f1f15]",
                state === "wrong" && "border-danger/60 bg-danger/10",
                state === "idle" && "border-border bg-surface-2/60 hover:border-accent/60",
              )}
            >
              {option}
            </motion.button>
          );
        })}
      </div>
      <div aria-live="polite">
        {picked !== null && (
          <p className={cn("text-sm leading-relaxed", correct ? "text-fg" : "text-muted")}>
            {correct ? quiz.explanation : "Nicht ganz – probier’s nochmal."}
          </p>
        )}
      </div>
      <CardUnlock item={unlocked ? MODULE_BY_ID[moduleId] : null} onClose={() => setUnlocked(false)} />
    </Card>
  );
}
