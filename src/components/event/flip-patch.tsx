"use client";

import {
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useTransform,
} from "motion/react";
import { useRef } from "react";
import { cn } from "@/lib/cn";
import { tick } from "@/lib/haptics";

/**
 * A medal you can turn over: drag sideways and it spins in 3D with momentum,
 * then settles on the front or the back. A tap turns it over, too.
 */
export function FlipPatch({
  front,
  back,
  label,
  className,
}: {
  front: React.ReactNode;
  back: React.ReactNode;
  label: string;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const rotate = useMotionValue(0);
  const drag = useRef<{
    x: number;
    start: number;
    moved: boolean;
    lastX: number;
    lastT: number;
    v: number;
  } | null>(null);
  const side = useRef(0);

  // A moving glare sells the metal/embroidery when it turns.
  const glare = useTransform(rotate, (r) => `${50 + Math.sin((r * Math.PI) / 180) * 70}%`);
  const tilt = useTransform(rotate, (r) => Math.abs(Math.sin((r * Math.PI) / 180)));
  const shadowScale = useTransform(tilt, [0, 1], [1, 0.55]);

  useMotionValueEvent(rotate, "change", (r) => {
    const next = Math.round(r / 180);
    if (next !== side.current) {
      side.current = next;
      tick("medium");
    }
  });

  function settle(target: number, velocity = 0) {
    animate(
      rotate,
      target,
      reduce ? { duration: 0 } : { type: "spring", stiffness: 140, damping: 16, velocity },
    );
  }

  function onDown(e: React.PointerEvent) {
    drag.current = {
      x: e.clientX,
      start: rotate.get(),
      moved: false,
      lastX: e.clientX,
      lastT: e.timeStamp,
      v: 0,
    };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // fine without capture
    }
  }

  function onMove(e: React.PointerEvent) {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    if (!d.moved && Math.abs(dx) < 6) return;
    d.moved = true;
    const dt = Math.max(1, e.timeStamp - d.lastT);
    d.v = ((e.clientX - d.lastX) / dt) * 1000 * 0.9; // deg per second
    d.lastX = e.clientX;
    d.lastT = e.timeStamp;
    rotate.set(d.start + dx * 0.9);
  }

  function onUp() {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    const current = rotate.get();
    if (!d.moved) {
      tick("minor");
      settle(Math.round(current / 180) * 180 + 180);
      return;
    }
    // Throw it: the faster the flick, the more it spins before it settles.
    const projected = current + d.v * 0.35;
    settle(Math.round(projected / 180) * 180, d.v);
  }

  return (
    <div className={cn("relative select-none", className)} style={{ perspective: 1100 }}>
      <motion.div
        aria-hidden
        className="absolute inset-x-[18%] -bottom-3 h-4 rounded-[50%] bg-black/30 blur-md"
        style={{ scaleX: shadowScale }}
      />
      <motion.button
        type="button"
        aria-label={`${label}. Antippen oder zur Seite ziehen zum Umdrehen.`}
        className="relative block aspect-[240/292] w-full cursor-grab touch-pan-y outline-none active:cursor-grabbing"
        style={{ rotateY: rotate, transformStyle: "preserve-3d" }}
        initial={reduce ? false : { scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 15, stiffness: 170 }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
            e.preventDefault();
            settle(Math.round(rotate.get() / 180) * 180 + (e.key === "ArrowRight" ? 180 : -180));
          }
        }}
        onClick={(e) => {
          // Keyboard "Enter"/"Space" (pointer taps are handled in onUp).
          if (e.detail === 0) settle(Math.round(rotate.get() / 180) * 180 + 180);
        }}
      >
        <Face glare={glare}>{front}</Face>
        <Face glare={glare} back>
          {back}
        </Face>
      </motion.button>
    </div>
  );
}

function Face({
  children,
  back = false,
  glare,
}: {
  children: React.ReactNode;
  back?: boolean;
  glare: ReturnType<typeof useTransform<number, string>>;
}) {
  return (
    <span
      className="absolute inset-0 block"
      style={{
        backfaceVisibility: "hidden",
        WebkitBackfaceVisibility: "hidden",
        transform: back ? "rotateY(180deg)" : undefined,
        filter: "drop-shadow(0 8px 10px rgb(0 0 0 / 0.35))",
      }}
    >
      {children}
      <motion.span
        aria-hidden
        className="pointer-events-none absolute inset-0 block mix-blend-soft-light"
        style={{
          clipPath: "polygon(8% 4%, 92% 4%, 92% 52%, 50% 96%, 8% 52%)",
          backgroundImage:
            "linear-gradient(105deg, transparent 35%, rgb(255 240 210 / 0.55) 50%, transparent 65%)",
          backgroundSize: "250% 100%",
          backgroundPositionX: glare,
        }}
      />
    </span>
  );
}
