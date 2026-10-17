"use client";

import { motion, useReducedMotion } from "motion/react";
import { useId } from "react";
import { Bottle, type BottleLabel } from "./bottle";

/**
 * A bottle under a black cloth, tied at the neck with a brass ribbon and a tag
 * with the glass number. On reveal the cloth is pulled away upwards and the
 * label appears. Used on every guest's phone during the live tasting.
 */
export function VeiledBottle({
  revealed,
  glass,
  label,
  className,
}: {
  revealed: boolean;
  glass: number;
  label?: BottleLabel | null;
  className?: string;
}) {
  const reduce = useReducedMotion();

  return (
    <div className={`relative aspect-[200/360] ${className ?? ""}`}>
      {/* Soft spotlight that warms up when the bottle is revealed */}
      <motion.div
        aria-hidden
        className="absolute inset-[-20%] rounded-full"
        style={{
          background:
            "radial-gradient(closest-side, color-mix(in oklab, var(--accent) 35%, transparent), transparent)",
        }}
        initial={false}
        animate={{ opacity: revealed ? 0.55 : 0.12, scale: revealed ? 1 : 0.8 }}
        transition={{ duration: reduce ? 0 : 0.9 }}
      />

      <motion.div
        className="absolute inset-0"
        initial={false}
        animate={{ opacity: revealed ? 1 : 0, scale: revealed ? 1 : 0.97 }}
        transition={{ duration: reduce ? 0 : 0.5, delay: revealed && !reduce ? 0.35 : 0 }}
      >
        <Bottle label={revealed ? label : null} className="h-full w-full" />
      </motion.div>

      <motion.div
        className="absolute inset-0"
        style={{ transformOrigin: "50% 4%" }}
        initial={false}
        animate={
          revealed
            ? {
                y: reduce ? "-110%" : ["0%", "4%", "-120%"],
                rotate: reduce ? 0 : [0, 0, -9],
                opacity: [1, 1, 0],
              }
            : { y: "0%", rotate: 0, opacity: 1 }
        }
        transition={
          revealed
            ? { duration: reduce ? 0 : 1.15, times: [0, 0.16, 1], ease: [0.65, 0, 0.35, 1] }
            : { duration: reduce ? 0 : 0.6, ease: [0.16, 1, 0.3, 1] }
        }
      >
        {/* A barely-there sway so the cloth feels like fabric, not a shape */}
        <motion.div
          className="h-full w-full"
          style={{ transformOrigin: "50% 4%" }}
          animate={reduce || revealed ? { rotate: 0 } : { rotate: [-0.7, 0.7] }}
          transition={{ duration: 3.4, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
        >
          <Cloth glass={glass} />
        </motion.div>
      </motion.div>

      <span className="sr-only" aria-live="polite">
        {revealed && label
          ? `Aufgedeckt: ${label.producer}, ${label.name} ${label.vintage ?? ""}`
          : `Glas ${glass}, verhüllt`}
      </span>
    </div>
  );
}

const CLOTH =
  "M100 8C109 8 114 15 114 27L116 92C117 118 141 140 147 176C153 216 161 280 174 340" +
  "Q162 349 149 342Q136 354 122 345Q110 356 98 346Q85 356 73 345Q61 354 49 342Q38 349 26 340" +
  "C39 280 47 216 53 176C59 140 83 118 84 92L86 27C86 15 91 8 100 8Z";

function Cloth({ glass }: { glass: number }) {
  const id = useId();
  return (
    <svg viewBox="0 0 200 360" className="h-full w-full" aria-hidden>
      <defs>
        <linearGradient id={`${id}-base`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#241a20" />
          <stop offset="0.5" stopColor="#120c10" />
          <stop offset="1" stopColor="#060406" />
        </linearGradient>
        <linearGradient id={`${id}-sheen`} x1="0" x2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.3" stopColor="#fff" stopOpacity="0.11" />
          <stop offset="0.42" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.7" stopColor="#fff" stopOpacity="0.05" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${id}-brass`} x1="0" x2="1">
          <stop offset="0" stopColor="#8a6a32" />
          <stop offset="0.45" stopColor="#ecd3a0" />
          <stop offset="1" stopColor="#7d5a22" />
        </linearGradient>
        <radialGradient id={`${id}-shadow`}>
          <stop offset="0" stopColor="#000" stopOpacity="0.5" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
        <clipPath id={`${id}-clip`}>
          <path d={CLOTH} />
        </clipPath>
      </defs>

      <ellipse cx="100" cy="350" rx="84" ry="8" fill={`url(#${id}-shadow)`} />
      <path d={CLOTH} fill={`url(#${id}-base)`} />
      <path d={CLOTH} fill={`url(#${id}-sheen)`} />

      {/* Folds: light ridges and dark valleys falling from the shoulder */}
      <g clipPath={`url(#${id}-clip)`} fill="none" strokeLinecap="round">
        <g stroke="#fff" strokeOpacity="0.07" strokeWidth="6">
          <path d="M94 130C88 200 76 270 70 350" />
          <path d="M112 140C118 210 128 280 136 352" />
          <path d="M101 190C101 250 102 300 100 350" />
        </g>
        <g stroke="#000" strokeOpacity="0.55" strokeWidth="5">
          <path d="M86 150C74 220 60 290 50 345" />
          <path d="M118 165C130 225 146 290 155 345" />
          <path d="M108 200C112 260 116 300 118 350" />
          <path d="M92 210C88 270 84 310 82 350" />
        </g>
      </g>

      {/* Brass ribbon tied around the neck */}
      <rect x="83" y="92" width="34" height="8" rx="4" fill={`url(#${id}-brass)`} />
      <path
        d="M100 99C96 112 90 124 86 138"
        stroke={`url(#${id}-brass)`}
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M101 99C104 110 106 118 110 128"
        stroke={`url(#${id}-brass)`}
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />

      {/* Tag with the glass number */}
      <g transform="rotate(9 112 140)">
        <rect x="100" y="128" width="26" height="32" rx="4" fill="#f4ede5" />
        <circle cx="113" cy="134" r="2" fill="#120c10" />
        <text
          x="113"
          y="154"
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
