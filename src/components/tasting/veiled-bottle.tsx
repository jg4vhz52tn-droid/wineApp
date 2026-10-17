"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useId, useRef } from "react";
import type { BottleShape } from "@/config/bottles";
import { tick } from "@/lib/haptics";
import { BottleArt, type BottleLabel } from "./bottle";

export type RevealedBottle = { shape: BottleShape; label: BottleLabel };

/**
 * A bottle in a black velvet tasting bag, closed with a brass drawstring and
 * a tag with the glass number - like at a real blind tasting.
 *
 * On reveal the bag is lifted straight up along the bottle (which appears
 * from the bottom), and once it clears the top it tips backwards and falls
 * away out of view.
 */
export function VeiledBottle({
  revealed,
  glass,
  bottle,
  className,
}: {
  revealed: boolean;
  glass: number;
  bottle?: RevealedBottle | null;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (revealed) tick("major");
  }, [revealed]);

  const lift = {
    // tug down - lift along the bottle - tip back and away
    y: ["0%", "1.2%", "-100%", "-128%"],
    scaleX: [1, 1.01, 0.97, 0.72],
    scaleY: [1, 0.985, 1.01, 0.8],
    rotateX: [0, 0, -6, -68],
    rotate: [0, 0, 0, -6],
    opacity: [1, 1, 1, 0],
  };
  const cover = {
    y: ["-45%", "0%"],
    scaleX: [0.92, 1],
    scaleY: [1, 1],
    rotateX: [-25, 0],
    rotate: [0, 0],
    opacity: [0, 1],
  };

  return (
    <div className={`relative aspect-[200/360] ${className ?? ""}`} style={{ perspective: 900 }}>
      <motion.div
        aria-hidden
        className="absolute inset-[-20%] rounded-full"
        style={{
          background:
            "radial-gradient(closest-side, color-mix(in oklab, var(--accent) 35%, transparent), transparent)",
        }}
        initial={false}
        animate={{ opacity: revealed ? 0.55 : 0.12, scale: revealed ? 1 : 0.8 }}
        transition={{ duration: reduce ? 0 : 1.2, delay: revealed && !reduce ? 0.6 : 0 }}
      />

      <svg viewBox="0 0 200 360" className="absolute inset-0 h-full w-full" aria-hidden>
        <BottleArt shape={bottle?.shape ?? "flute"} label={bottle?.label} />
      </svg>

      <motion.div
        className="absolute inset-0"
        style={{ transformOrigin: "50% 0%" }}
        initial={false}
        animate={revealed ? lift : cover}
        transition={
          reduce
            ? { duration: 0 }
            : revealed
              ? {
                  duration: 1.9,
                  times: [0, 0.1, 0.6, 1],
                  ease: ["easeOut", [0.45, 0, 0.25, 1], [0.4, 0, 0.7, 1]],
                }
              : { duration: 0.8, ease: [0.2, 0, 0, 1] }
        }
      >
        <VelvetBag glass={glass} />
      </motion.div>

      <span className="sr-only" aria-live="polite">
        {revealed && bottle
          ? `Aufgedeckt: ${bottle.label.producer}, ${bottle.label.name} ${bottle.label.vintage ?? ""}`
          : `Glas ${glass}, verhüllt`}
      </span>
    </div>
  );
}

// Sleeve that fits over both bottle shapes: gathered above the drawstring,
// full width over the body, soft rounded bottom.
const BAG =
  "M84 74L83 12Q86 -3 92 0Q96 -9 100 -2Q104 -9 108 0Q114 -3 117 12L116 74" +
  "C118 98 153 126 155 182L155 334Q155 357 133 358L67 358Q45 357 45 334L45 182C47 126 82 98 84 74Z";

function VelvetBag({ glass }: { glass: number }) {
  const id = useId();
  const url = (name: string) => `url(#${id}-${name})`;
  return (
    <svg viewBox="0 0 200 360" className="h-full w-full overflow-visible" aria-hidden>
      <defs>
        <linearGradient id={`${id}-round`} x1="0" x2="1">
          <stop offset="0" stopColor="#262226" />
          <stop offset="0.1" stopColor="#0a090a" />
          <stop offset="0.33" stopColor="#1a181a" />
          <stop offset="0.42" stopColor="#262326" />
          <stop offset="0.56" stopColor="#0d0c0d" />
          <stop offset="0.9" stopColor="#060506" />
          <stop offset="1" stopColor="#201d20" />
        </linearGradient>
        <linearGradient id={`${id}-fall`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#000" stopOpacity="0.1" />
          <stop offset="0.5" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.45" />
        </linearGradient>
        <linearGradient id={`${id}-cord`} x1="0" x2="1">
          <stop offset="0" stopColor="#7a5a26" />
          <stop offset="0.45" stopColor="#efd6a2" />
          <stop offset="1" stopColor="#6b4c1c" />
        </linearGradient>
        {/* Velvet pile: very fine grain */}
        <filter id={`${id}-grain`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="2" seed="4" result="noise" />
          <feColorMatrix in="noise" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.09 0" />
        </filter>
        <filter id={`${id}-blur`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.5" />
        </filter>
        <clipPath id={`${id}-clip`}>
          <path d={BAG} />
        </clipPath>
        <radialGradient id={`${id}-shadow`}>
          <stop offset="0" stopColor="#000" stopOpacity="0.55" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
      </defs>

      <ellipse cx="100" cy="356" rx="70" ry="7" fill={url("shadow")} />
      <path d={BAG} fill={url("round")} />

      <g clipPath={url("clip")}>
        <rect width="200" height="360" fill={url("fall")} />
        <rect width="200" height="360" filter={url("grain")} />
        <g fill="none" strokeLinecap="round" filter={url("blur")}>
          {/* Gathered fabric above the drawstring */}
          <g stroke="#3a353a" strokeOpacity="0.7" strokeWidth="2">
            <path d="M90 4C91 36 93 58 96 74" />
            <path d="M100 2V74" />
            <path d="M110 4C109 36 107 58 104 74" />
          </g>
          {/* Folds fanning out from the drawstring over the shoulder */}
          <g stroke="#000" strokeOpacity="0.8" strokeWidth="5">
            <path d="M92 82C80 110 62 140 58 190C55 240 57 300 55 352" />
            <path d="M108 82C120 110 138 140 142 190C145 240 143 300 145 352" />
            <path d="M100 96C101 170 99 260 101 354" />
          </g>
          <g stroke="#433d43" strokeOpacity="0.55" strokeWidth="4">
            <path d="M96 84C88 116 76 146 74 196C72 250 74 300 72 354" />
            <path d="M104 84C112 116 124 146 126 196C128 250 126 300 128 354" />
          </g>
          {/* Velvet glows along its silhouette */}
          <path d={BAG} stroke="#4a434a" strokeOpacity="0.6" strokeWidth="6" />
        </g>
      </g>

      {/* Brass drawstring with bow and tails */}
      <g fill="none" stroke={url("cord")} strokeLinecap="round">
        <path d="M82 74Q100 82 118 74" strokeWidth="4" />
        <path d="M100 79C92 70 84 70 86 78C88 84 96 82 100 79Z" strokeWidth="2.5" />
        <path d="M100 79C108 70 116 70 114 78C112 84 104 82 100 79Z" strokeWidth="2.5" />
        <path d="M99 80C96 92 92 104 90 118" strokeWidth="2.5" />
        <path d="M101 80C104 90 108 98 112 108" strokeWidth="2.5" />
      </g>
      <circle cx="90" cy="120" r="2.6" fill={url("cord")} />

      {/* Tag with the glass number */}
      <g transform="rotate(10 113 118)">
        <line x1="112" y1="108" x2="113" y2="114" stroke={url("cord")} strokeWidth="1.2" />
        <rect x="100" y="114" width="26" height="33" rx="4" fill="#f4ede5" />
        <circle cx="113" cy="120" r="1.8" fill="#120c10" />
        <text
          x="113"
          y="140"
          textAnchor="middle"
          fontSize="15"
          fill="#2a1520"
          fontFamily="var(--font-serif-face), serif"
        >
          {glass}
        </text>
      </g>
    </svg>
  );
}
