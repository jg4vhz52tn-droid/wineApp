"use client";

import { motion, useReducedMotion } from "motion/react";

/**
 * Covers its children until `revealed` - then the curtain drops.
 * Used for the hidden bottle on every guest's phone.
 */
export function Curtain({ revealed, children }: { revealed: boolean; children: React.ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <div className="relative overflow-hidden rounded-card">
      {children}
      <motion.div
        aria-hidden={revealed}
        className="absolute inset-0 flex items-end justify-center pb-6"
        style={{
          background:
            "repeating-linear-gradient(90deg, rgb(0 0 0 / 0.22) 0 2px, transparent 2px 22px, rgb(255 255 255 / 0.06) 22px 24px, transparent 24px 44px), linear-gradient(180deg, var(--curtain), color-mix(in oklab, var(--curtain), black 35%))",
          transformOrigin: "top",
        }}
        initial={false}
        animate={
          revealed
            ? {
                y: "105%",
                scaleY: reduce ? 1 : 0.92,
                transition: { duration: reduce ? 0 : 0.9, ease: [0.65, 0, 0.35, 1] },
              }
            : { y: 0, scaleY: 1, transition: { duration: reduce ? 0 : 0.5, ease: [0.16, 1, 0.3, 1] } }
        }
      >
        <div className="absolute inset-x-0 top-0 h-3 bg-accent/80" />
        <span className="font-display text-lg text-wine-fg/90">Verhüllt</span>
      </motion.div>
    </div>
  );
}
