"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import { tick } from "@/lib/haptics";
import { BADGE_ICON, type Badge, type NewBadge, type Sense } from "@/lib/senses";

const RING_COLORS: Record<Sense["key"], string> = {
  eye: "var(--series-1)",
  nose: "var(--series-2)",
  palate: "var(--accent)",
};
const SENSE_ICON: Record<Sense["key"], string> = { eye: "👁️", nose: "👃", palate: "👅" };

/** Three rings like Apple's activity rings - one per sense. */
export function SensesCard({ senses }: { senses: Sense[] }) {
  const [open, setOpen] = useState<Sense["key"] | null>(null);
  const active = senses.find((s) => s.key === open);
  return (
    <Card className="space-y-4">
      <div>
        <h2 className="text-xl">Deine Sinne</h2>
        <p className="text-sm text-muted">Wachsen mit jeder geführten Verkostung und jedem Lagenabend.</p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {senses.map((s) => (
          <button
            key={s.key}
            type="button"
            aria-expanded={open === s.key}
            onClick={() => {
              tick("minor");
              setOpen(open === s.key ? null : s.key);
            }}
            className={cn(
              "space-y-1.5 rounded-control py-2 text-center transition",
              open === s.key && "bg-surface-2/70",
            )}
          >
            <Ring progress={s.progress} color={RING_COLORS[s.key]} icon={SENSE_ICON[s.key]} />
            <span className="block text-sm font-medium">{s.label}</span>
            <span className="block text-xs text-muted">
              Stufe {s.level} · {s.name}
            </span>
          </button>
        ))}
      </div>
      <AnimatePresence initial={false}>
        {active && (
          <motion.p
            key={active.key}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden text-sm"
          >
            <span className="block rounded-control bg-surface-2/60 px-4 py-3">
              <b className="font-medium">{active.label}:</b> {active.xp} Punkte
              {active.next !== null
                ? ` – noch ${active.next - active.xp} bis Stufe ${active.level + 1}.`
                : " – höchste Stufe!"}{" "}
              <span className="text-muted">Wächst durch: {active.how}.</span>
            </span>
          </motion.p>
        )}
      </AnimatePresence>
    </Card>
  );
}

function Ring({ progress, color, icon }: { progress: number; color: string; icon: string }) {
  const r = 30;
  const c = 2 * Math.PI * r;
  return (
    <span className="relative mx-auto block size-20" aria-hidden>
      <svg viewBox="0 0 72 72" className="size-full -rotate-90">
        <circle cx="36" cy="36" r={r} fill="none" stroke="var(--surface-2)" strokeWidth="8" />
        <motion.circle
          cx="36"
          cy="36"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - Math.max(0.02, progress)) }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-2xl">{icon}</span>
    </span>
  );
}

/** A round medal - brass when earned, a quiet outline while still to come. */
export function Medal({
  icon,
  earned,
  className,
}: {
  icon: string | null;
  earned: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "relative inline-flex aspect-square items-center justify-center rounded-full text-2xl",
        earned
          ? "shadow-[inset_0_-3px_6px_rgb(0_0_0/0.25),0_4px_10px_-4px_rgb(0_0_0/0.4)]"
          : "border-2 border-dashed border-border opacity-50 grayscale",
        className,
      )}
      style={
        earned
          ? { background: "radial-gradient(circle at 35% 30%, #f3dda4, #c99d55 55%, #8c6630)" }
          : undefined
      }
    >
      <span className={earned ? "drop-shadow" : ""}>{BADGE_ICON[icon ?? ""] ?? "★"}</span>
    </span>
  );
}

export function BadgeShelf({ badges }: { badges: Badge[] }) {
  const [open, setOpen] = useState<string | null>(null);
  const earned = badges.filter((b) => b.awardedAt).length;
  const active = badges.find((b) => b.code === open);
  return (
    <Card className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-xl">Badges</h2>
        <span className="text-sm text-muted tabular-nums">
          {earned} von {badges.length}
        </span>
      </div>
      <ul className="grid grid-cols-4 gap-3">
        {badges.map((b) => (
          <li key={b.code}>
            <button
              type="button"
              onClick={() => setOpen(open === b.code ? null : b.code)}
              className="block w-full space-y-1 text-center"
              aria-label={`${b.title}${b.awardedAt ? " (erreicht)" : ""}`}
            >
              <Medal icon={b.icon} earned={!!b.awardedAt} className="w-full" />
              <span
                className={cn("block truncate text-[0.7rem]", b.awardedAt ? "font-medium" : "text-muted")}
              >
                {b.title}
              </span>
            </button>
          </li>
        ))}
      </ul>
      {active && (
        <p className="rounded-control bg-surface-2/60 px-4 py-3 text-sm">
          <b className="font-medium">{active.title}:</b> {active.description}{" "}
          <span className="text-muted">
            {active.awardedAt
              ? `Erreicht am ${new Date(active.awardedAt).toLocaleDateString("de-DE")}.`
              : "Noch nicht erreicht."}
          </span>
        </p>
      )}
    </Card>
  );
}

/** "Neues Badge!" - pops in after a tasting or an evening. */
export function NewBadges({ badges }: { badges: NewBadge[] }) {
  if (!badges.length) return null;
  return (
    <div className="space-y-2" role="status">
      {badges.map((b, i) => (
        <motion.div
          key={b.code}
          initial={{ scale: 0.6, opacity: 0, rotate: -10 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ type: "spring", damping: 12, stiffness: 180, delay: 0.3 + i * 0.25 }}
          onAnimationComplete={() => tick("major")}
          className="flex items-center gap-4 rounded-[1.5rem] border border-accent/50 bg-accent/10 p-3"
        >
          <Medal icon={b.icon} earned className="size-14 shrink-0" />
          <span>
            <span className="block text-xs font-medium tracking-[0.14em] text-accent uppercase">
              Neues Badge
            </span>
            <span className="block font-display text-xl">{b.title}</span>
            <span className="block text-sm text-muted">{b.description}</span>
          </span>
        </motion.div>
      ))}
    </div>
  );
}
