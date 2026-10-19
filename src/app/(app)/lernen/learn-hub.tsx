"use client";

import { GlassIcon } from "@/components/ui/icons";
import Link from "next/link";
import { motion } from "motion/react";
import { CollectibleCard } from "@/components/learn/collectible-card";
import { Motif } from "@/components/learn/motif";
import { Card } from "@/components/ui/card";
import { LEARN_MODULES } from "@/config/learn/modules";
import { cn } from "@/lib/cn";
import { useLearnProgress } from "@/lib/learn-progress";

export function LearnHub() {
  const { completed } = useLearnProgress();
  const done = completed.length;
  const total = LEARN_MODULES.length;

  return (
    <div className="space-y-6">
      <Link href="/lernen/sammlung" className="block">
        <Card className="flex items-center gap-5">
          <ProgressRing value={done / total} />
          <div className="min-w-0 flex-1">
            <p className="font-display text-2xl leading-tight">
              {done} von {total} Karten
            </p>
            <p className="text-sm text-muted">{done === total ? "Komplett – Respekt!" : "Zur Sammlung →"}</p>
          </div>
          <div className="flex -space-x-6">
            {LEARN_MODULES.slice(0, 3).map((item, index) => (
              <CollectibleCard
                key={item.id}
                item={item}
                number={index + 1}
                locked={!completed.includes(item.id)}
                className="w-12 rotate-[-6deg] p-1.5 [&_p]:hidden [&_span]:hidden"
              />
            ))}
          </div>
        </Card>
      </Link>

      <Link
        href="/keller/verkosten"
        className="flex items-center gap-4 rounded-card border border-accent/40 p-4"
        style={{ background: "linear-gradient(150deg, var(--curtain), var(--surface) 75%)" }}
      >
        <span className="flex size-12 shrink-0 items-center justify-center rounded-control bg-wine text-[#d1ad72]">
          <GlassIcon className="size-7" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-display text-xl leading-tight">Verkoste deine eigene Flasche</span>
          <span className="block text-sm text-muted">
            Geführt Schritt für Schritt: sehen, riechen, schmecken – und vergleichen, was Kenner finden.
          </span>
        </span>
        <span className="text-accent">→</span>
      </Link>

      <ul className="grid grid-cols-2 gap-3">
        {LEARN_MODULES.map((item) => {
          const isDone = completed.includes(item.id);
          return (
            <li key={item.id}>
              <Link
                href={`/lernen/${item.id}`}
                className="group flex h-full flex-col gap-3 rounded-card border border-border bg-surface p-4 transition active:scale-[0.98]"
              >
                <div className="flex items-start justify-between">
                  <span className="flex size-12 items-center justify-center rounded-control bg-wine text-[#d1ad72]">
                    <Motif motif={item.motif} className="size-8" />
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[0.7rem] font-medium",
                      isDone ? "bg-success/15 text-success" : "bg-surface-2 text-muted",
                    )}
                  >
                    {isDone ? "✓ Erledigt" : `${item.minutes} Min.`}
                  </span>
                </div>
                <p className="font-display text-xl leading-tight">{item.title}</p>
                <p className="text-[0.8rem] leading-snug text-muted">{item.teaser}</p>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ProgressRing({ value }: { value: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 64 64" className="size-16 shrink-0 -rotate-90" aria-hidden>
      <circle cx="32" cy="32" r={r} fill="none" stroke="var(--surface-2)" strokeWidth="6" />
      <motion.circle
        cx="32"
        cy="32"
        r={r}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={c.toFixed(2)}
        initial={false}
        animate={{ strokeDashoffset: Number((c * (1 - value)).toFixed(2)) }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      />
    </svg>
  );
}
