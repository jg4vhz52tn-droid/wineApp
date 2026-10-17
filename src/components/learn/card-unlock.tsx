"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect } from "react";
import { buttonClasses } from "@/components/ui/button";
import { LEARN_MODULES, type LearnModule } from "@/config/learn/modules";
import { tick } from "@/lib/haptics";
import { CollectibleCard } from "./collectible-card";

/** Full-screen moment when a collectible card is unlocked: the card flips in, foil glints. */
export function CardUnlock({ item, onClose }: { item: LearnModule | null; onClose: () => void }) {
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!item) return;
    tick("major");
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [item, onClose]);

  return (
    <AnimatePresence>
      {item && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Sammelkarte freigeschaltet"
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-8 bg-black/70 px-8 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.p
            className="text-xs font-medium tracking-[0.22em] text-[#d1ad72] uppercase"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduce ? 0 : 0.7 }}
          >
            Sammelkarte freigeschaltet
          </motion.p>

          <div style={{ perspective: 1000 }} className="w-56">
            <motion.div
              className="relative"
              initial={reduce ? false : { rotateY: 180, scale: 0.6, y: 40 }}
              animate={{ rotateY: 0, scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 120, damping: 14, delay: 0.1 }}
            >
              <CollectibleCard item={item} number={LEARN_MODULES.indexOf(item) + 1} />
              {!reduce && (
                <motion.div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 overflow-hidden rounded-[1.1rem]"
                  initial={{ opacity: 1 }}
                  animate={{ opacity: 0 }}
                  transition={{ delay: 1.9, duration: 0.3 }}
                >
                  <motion.div
                    className="absolute inset-y-0 w-1/2"
                    style={{
                      background:
                        "linear-gradient(100deg, transparent, rgb(255 236 200 / 0.35), transparent)",
                    }}
                    initial={{ x: "-120%" }}
                    animate={{ x: "260%" }}
                    transition={{ delay: 0.8, duration: 1, ease: "easeInOut" }}
                  />
                </motion.div>
              )}
            </motion.div>
          </div>

          <motion.div
            className="grid w-full max-w-xs gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: reduce ? 0 : 1 }}
          >
            <button type="button" onClick={onClose} className={buttonClasses({ size: "lg", block: true })}>
              Weiter
            </button>
            <Link
              href="/lernen/sammlung"
              className={buttonClasses({ variant: "ghost", block: true })}
              style={{ color: "#f4ede5" }}
            >
              Zur Sammlung
            </Link>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
