"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { Card, Eyebrow } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { tick } from "@/lib/haptics";

type Option = { label: string; points: number; tip?: string };
type Question = { id: string; question: string; options: Option[] };

const QUESTIONS: Question[] = [
  {
    id: "place",
    question: "Wo liegen deine Flaschen?",
    options: [
      { label: "Keller", points: 3 },
      { label: "Weinkühlschrank", points: 3 },
      {
        label: "Schrank im Flur",
        points: 2,
        tip: "Ein Schrank ist okay – am besten an einer Innenwand, weg von der Heizung.",
      },
      {
        label: "Küche",
        points: 0,
        tip: "Die Küche ist der schlechteste Ort: Wärme, Dampf und ständige Schwankungen.",
      },
    ],
  },
  {
    id: "light",
    question: "Wie hell ist es dort?",
    options: [
      { label: "Dunkel", points: 2 },
      {
        label: "Gedämpft",
        points: 1,
        tip: "Leg die Flaschen in den Karton oder deck sie ab – Licht altert Wein.",
      },
      {
        label: "Tageslicht",
        points: 0,
        tip: "Raus aus dem Tageslicht! UV-Licht schadet besonders in klaren Flaschen.",
      },
    ],
  },
  {
    id: "temp",
    question: "Schwankt die Temperatur?",
    options: [
      { label: "Kaum", points: 3 },
      { label: "Mit den Jahreszeiten", points: 2 },
      {
        label: "Stark, täglich",
        points: 0,
        tip: "Starke Schwankungen sind das Hauptproblem – such dir den gleichmäßigsten Ort.",
      },
    ],
  },
  {
    id: "lying",
    question: "Wie liegen Flaschen mit Naturkorken?",
    options: [
      { label: "Liegend", points: 2 },
      { label: "Stehend", points: 0, tip: "Korkflaschen hinlegen, damit der Korken nicht austrocknet." },
      { label: "Nur Schraubverschluss", points: 2 },
    ],
  },
  {
    id: "neighbours",
    question: "Was steht in der Nähe?",
    options: [
      { label: "Nichts Besonderes", points: 1 },
      {
        label: "Waschmaschine, Heizung, Farben",
        points: 0,
        tip: "Vibrationen, Wärme und Gerüche mag Wein nicht – lieber umziehen.",
      },
    ],
  },
];

const MAX = QUESTIONS.reduce((sum, q) => sum + Math.max(...q.options.map((o) => o.points)), 0);

/** "Wie gut lagerst du?" - five taps, a score and the most useful tip. */
export function CellarCheck() {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const answered = Object.keys(answers).length;
  const complete = answered === QUESTIONS.length;
  const score = QUESTIONS.reduce((sum, q) => sum + (q.options[answers[q.id]]?.points ?? 0), 0);
  const tips = QUESTIONS.map((q) => q.options[answers[q.id]]?.tip).filter(Boolean) as string[];

  return (
    <Card className="space-y-5">
      <Eyebrow>Keller-Check</Eyebrow>
      <p className="font-display text-2xl leading-tight">Wie gut lagerst du?</p>
      {QUESTIONS.map((q) => (
        <div key={q.id} className="space-y-2">
          <p className="text-sm font-medium">{q.question}</p>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={q.question}>
            {q.options.map((option, index) => (
              <Chip
                key={option.label}
                role="radio"
                aria-checked={answers[q.id] === index}
                selected={answers[q.id] === index}
                onClick={() => {
                  tick("minor");
                  setAnswers((a) => ({ ...a, [q.id]: index }));
                }}
              >
                {option.label}
              </Chip>
            ))}
          </div>
        </div>
      ))}

      {complete && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3 rounded-control bg-surface-2/70 p-4"
          aria-live="polite"
        >
          <div className="flex items-baseline justify-between">
            <p className="font-display text-2xl">
              {score >= MAX - 1 ? "Profi-Keller" : score >= MAX * 0.6 ? "Ganz ordentlich" : "Da geht mehr"}
            </p>
            <p className="font-display text-3xl text-accent tabular-nums">
              {score}/{MAX}
            </p>
          </div>
          <p className="text-sm leading-relaxed">
            {tips[0] ?? "Deine Flaschen haben es gut. Jetzt nur noch das Trinkfenster im Blick behalten."}
          </p>
        </motion.div>
      )}
    </Card>
  );
}
