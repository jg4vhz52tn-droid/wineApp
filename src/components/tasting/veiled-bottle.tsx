"use client";

import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { useEffect, useId } from "react";
import type { BottleShape } from "@/config/bottles";
import { tick } from "@/lib/haptics";
import { BottleArt, BOTTLES, type BottleLabel } from "./bottle";

export type RevealedBottle = { shape: BottleShape; label: BottleLabel };

// Where the cloth's hem sits: 0 = fully covered, LIFT = pulled off over the top.
const LIFT = -410;

/**
 * A bottle under a fitted black cloth, tied at the neck with a brass ribbon
 * and a tag with the glass number. On reveal the cloth is pulled up and back
 * over the bottle: its hem travels upwards (showing the wine-red lining as it
 * rolls back), and below the hem the real bottle appears.
 *
 * While the glass is still blind, pass no `bottle` - every glass then looks
 * the same under the cloth, so the shape gives nothing away (in the app the
 * wine data only reaches the phone after the reveal anyway).
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
  const id = useId();
  const reduce = useReducedMotion();
  const hem = useMotionValue(revealed ? LIFT : 0);
  const clothScale = useTransform(hem, [0, LIFT], [1, 0.94]);
  const clothShade = useTransform(hem, [0, LIFT * 0.4, LIFT], [0, 0.25, 0.6]);
  // Lining and hem shadow only exist while the cloth is moving.
  const edgeOpacity = useTransform(hem, [0, -28, LIFT + 40, LIFT], [0, 1, 1, 0]);

  useEffect(() => {
    if (reduce) {
      hem.set(revealed ? LIFT : 0);
      return;
    }
    if (revealed) tick("major");
    const controls = revealed
      ? // A short tug down, then one smooth pull up and back.
        animate(hem, [hem.get(), 8, LIFT], { duration: 1.6, times: [0, 0.14, 1], ease: [0.65, 0, 0.3, 1] })
      : animate(hem, 0, { duration: 0.9, ease: [0.3, 0, 0.2, 1] });
    return () => controls.stop();
  }, [revealed, reduce, hem]);

  // The real bottle is only ever visible below the hem, so it can sit under
  // the cloth the whole time - covered, it is completely hidden.
  const shape = bottle?.shape ?? "flute";
  const outline = BOTTLES[shape].outline;

  return (
    <div className={`relative aspect-[200/360] ${className ?? ""}`}>
      <motion.div
        aria-hidden
        className="absolute inset-[-20%] rounded-full"
        style={{
          background:
            "radial-gradient(closest-side, color-mix(in oklab, var(--accent) 35%, transparent), transparent)",
        }}
        initial={false}
        animate={{ opacity: revealed ? 0.55 : 0.12, scale: revealed ? 1 : 0.8 }}
        transition={{ duration: reduce ? 0 : 1.2, delay: revealed && !reduce ? 0.5 : 0 }}
      />

      <svg viewBox="0 0 200 360" className="relative h-full w-full overflow-visible" aria-hidden>
        <defs>
          {/* Area below the hem: the bottle shows */}
          <mask id={`${id}-below`} maskUnits="userSpaceOnUse" x="-60" y="-500" width="320" height="1000">
            <motion.path d={edgeBelow} fill="#fff" style={{ y: hem }} />
          </mask>
          {/* Area above the hem: the cloth shows */}
          <mask id={`${id}-above`} maskUnits="userSpaceOnUse" x="-60" y="-500" width="320" height="1000">
            <motion.path d={edgeAbove} fill="#fff" style={{ y: hem }} />
          </mask>
          <clipPath id={`${id}-cloth`}>
            <path d={CLOTH} />
          </clipPath>
          <clipPath id={`${id}-bottle`}>
            <path d={outline} />
          </clipPath>
          <filter id={`${id}-soft`} x="-20%" y="-50%" width="140%" height="200%">
            <feGaussianBlur stdDeviation="4" />
          </filter>
        </defs>

        <g mask={`url(#${id}-below)`}>
          <BottleArt shape={shape} label={bottle?.label} />
          {/* Shadow the cloth casts on the glass right below its hem */}
          <g clipPath={`url(#${id}-bottle)`}>
            <motion.path
              d={edgeLine}
              stroke="#000"
              strokeOpacity="0.55"
              strokeWidth="26"
              fill="none"
              filter={`url(#${id}-soft)`}
              style={{ y: hem, opacity: edgeOpacity }}
            />
          </g>
        </g>

        <motion.g mask={`url(#${id}-above)`} style={{ scaleX: clothScale, originX: "100px", originY: "0px" }}>
          <Cloth glass={glass} />
          <g clipPath={`url(#${id}-cloth)`}>
            {/* Wine-red lining showing where the cloth rolls back */}
            <motion.path
              d={edgeLine}
              stroke="var(--curtain)"
              strokeWidth="26"
              fill="none"
              style={{ y: hem, opacity: edgeOpacity }}
            />
            {/* Light catching the fold where the cloth turns over */}
            <g transform="translate(0 -12)">
              <motion.path
                d={edgeLine}
                stroke="#fff"
                strokeOpacity="0.22"
                strokeWidth="1.5"
                fill="none"
                style={{ y: hem, opacity: edgeOpacity }}
              />
            </g>
            {/* Fabric gets darker as it turns away from the light */}
            <motion.rect x="0" y="0" width="200" height="360" fill="#000" style={{ opacity: clothShade }} />
          </g>
        </motion.g>
      </svg>

      <span className="sr-only" aria-live="polite">
        {revealed && bottle
          ? `Aufgedeckt: ${bottle.label.producer}, ${bottle.label.name} ${bottle.label.vintage ?? ""}`
          : `Glas ${glass}, verhüllt`}
      </span>
    </div>
  );
}

// The hem as a gentle wave across the canvas at y=366 (just below the base).
const BASE = 366;
const wave = (y: number, dir: 1 | -1) =>
  dir === 1
    ? `Q17 ${y - 7} 45 ${y}Q72 ${y + 7} 100 ${y}Q127 ${y - 7} 155 ${y}Q182 ${y + 7} 210 ${y}`
    : `Q182 ${y + 7} 155 ${y}Q127 ${y - 7} 100 ${y}Q72 ${y + 7} 45 ${y}Q17 ${y - 7} -10 ${y}`;
const edgeLine = `M-10 ${BASE}${wave(BASE, 1)}`;
const edgeBelow = `M-10 ${BASE}${wave(BASE, 1)}V900H-10Z`;
const edgeAbove = `M-10 -500H210V${BASE}${wave(BASE, -1)}Z`;

// Fitted cloth around the standard flute, with a slight flare at the hem.
const CLOTH =
  "M100 1C110 1 116 7 116 19L116 74C116 101 149 124 149 168L150 328Q152 341 162 351" +
  "Q147 358 132 351Q118 359 104 352Q90 359 76 351Q61 358 38 351Q48 341 50 328L51 168" +
  "C51 124 84 101 84 74L84 19C84 7 90 1 100 1Z";

function Cloth({ glass }: { glass: number }) {
  const id = useId();
  return (
    <g>
      <defs>
        {/* Round body: dark edges, soft highlight left of centre */}
        <linearGradient id={`${id}-round`} x1="0" x2="1">
          <stop offset="0.2" stopColor="#040404" />
          <stop offset="0.36" stopColor="#141314" />
          <stop offset="0.44" stopColor="#242224" />
          <stop offset="0.6" stopColor="#0c0b0c" />
          <stop offset="0.8" stopColor="#030303" />
        </linearGradient>
        <linearGradient id={`${id}-fall`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.45" />
        </linearGradient>
        <linearGradient id={`${id}-brass`} x1="0" x2="1">
          <stop offset="0" stopColor="#8a6a32" />
          <stop offset="0.45" stopColor="#ecd3a0" />
          <stop offset="1" stopColor="#7d5a22" />
        </linearGradient>
        <clipPath id={`${id}-clip`}>
          <path d={CLOTH} />
        </clipPath>
      </defs>

      <path d={CLOTH} fill={`url(#${id}-round)`} />
      <path d={CLOTH} fill={`url(#${id}-fall)`} />

      <g clipPath={`url(#${id}-clip)`} fill="none" strokeLinecap="round">
        {/* Gathered fabric above the ribbon */}
        <g stroke="#fff" strokeOpacity="0.08" strokeWidth="1.5">
          <path d="M93 30C94 50 95 64 97 78" />
          <path d="M106 28C105 48 104 64 103 78" />
        </g>
        {/* Folds fanning out over the shoulder and down the body */}
        <g stroke="#fff" strokeOpacity="0.07" strokeWidth="4">
          <path d="M96 92C88 130 74 160 72 200C70 260 72 310 68 352" />
          <path d="M108 94C116 130 128 165 130 210C132 270 132 310 136 352" />
        </g>
        <g stroke="#000" strokeOpacity="0.6" strokeWidth="3">
          <path d="M92 94C80 128 62 150 60 190C58 250 58 310 54 350" />
          <path d="M112 96C124 130 140 152 142 196C144 256 144 310 148 350" />
          <path d="M101 120C101 200 102 280 100 352" />
          <path d="M86 300C84 320 80 338 76 351" />
          <path d="M118 300C120 322 124 338 130 351" />
        </g>
      </g>

      {/* Brass ribbon tied around the neck */}
      <rect x="81" y="80" width="38" height="8" rx="4" fill={`url(#${id}-brass)`} />
      <path
        d="M100 87C96 100 90 112 86 126"
        stroke={`url(#${id}-brass)`}
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M101 87C104 98 106 106 110 116"
        stroke={`url(#${id}-brass)`}
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />

      {/* Tag with the glass number */}
      <g transform="rotate(9 112 128)">
        <rect x="100" y="116" width="26" height="32" rx="4" fill="#f4ede5" />
        <circle cx="113" cy="122" r="2" fill="#120c10" />
        <text
          x="113"
          y="142"
          textAnchor="middle"
          fontSize="15"
          fill="#2a1520"
          fontFamily="var(--font-serif-face), serif"
        >
          {glass}
        </text>
      </g>
    </g>
  );
}
