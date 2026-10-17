"use client";

import { motion } from "motion/react";
import { CountUp } from "@/components/tasting/count-up";
import { Avatar } from "@/components/ui/avatar";
import type { BoardRow } from "@/lib/events/derive";
import { cn } from "@/lib/cn";

/** Live leaderboard on every phone - rows glide into their new place. */
export function Leaderboard({
  rows,
  me,
  title = "Zwischenstand",
}: {
  rows: BoardRow[];
  me?: string;
  title?: string;
}) {
  if (rows.length === 0) return null;
  return (
    <section className="space-y-3" aria-live="polite">
      <h2 className="text-2xl">{title}</h2>
      <ol className="space-y-2">
        {rows.map((row) => (
          <motion.li
            key={row.participant.id}
            layout
            transition={{ type: "spring", damping: 28, stiffness: 260 }}
            className={cn(
              "flex items-center gap-3 rounded-control px-3 py-2.5",
              row.rank === 1 ? "bg-accent text-accent-fg" : "bg-surface-2",
              row.participant.id === me && row.rank !== 1 && "ring-2 ring-accent/60",
            )}
          >
            <span className="w-6 text-center font-display text-xl">{row.rank}</span>
            <Avatar name={row.participant.name} className="size-9" />
            <span className="min-w-0 flex-1 truncate font-medium">
              {row.participant.id === me ? "Du" : row.participant.name}
            </span>
            {row.delta > 0 && (
              <span
                className={cn("text-xs font-medium", row.rank === 1 ? "text-accent-fg/80" : "text-success")}
              >
                +{row.delta}
              </span>
            )}
            <span className="w-14 text-right font-display text-2xl tabular-nums">
              <CountUp value={row.total} />
            </span>
          </motion.li>
        ))}
      </ol>
    </section>
  );
}
