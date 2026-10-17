"use client";

import { motion, useReducedMotion } from "motion/react";
import { useId } from "react";

const BRASS = "#d1ad72";
const INK = "#f4ede5";
const dateFmt = new Intl.DateTimeFormat("de-DE", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Europe/Berlin",
});

/**
 * The evening as an embroidered patch: photo in the middle, title stitched
 * along the top, date along the bottom, the winner on a brass ribbon.
 */
export function EventPatch({
  title,
  startsAt,
  winner,
  photoUrl,
  className,
  animate = true,
}: {
  title: string;
  startsAt: string | null;
  winner: string | null;
  photoUrl: string | null;
  className?: string;
  animate?: boolean;
}) {
  const id = useId().replace(/:/g, "");
  const reduce = useReducedMotion();
  const label = title.toUpperCase();
  const titleSize = label.length > 26 ? 12 : label.length > 18 ? 14.5 : 17;
  const date = startsAt ? dateFmt.format(new Date(startsAt)) : "";

  return (
    <motion.svg
      viewBox="0 0 260 260"
      className={className}
      role="img"
      aria-label={`Abend-Patch: ${title}${date ? `, ${date}` : ""}${winner ? `, Gewinner ${winner}` : ""}`}
      initial={animate && !reduce ? { scale: 0.6, rotate: -12, opacity: 0 } : false}
      animate={{ scale: 1, rotate: 0, opacity: 1 }}
      transition={{ type: "spring", damping: 14, stiffness: 160 }}
    >
      <defs>
        <radialGradient id={`${id}-bg`} cx="35%" cy="30%" r="80%">
          <stop offset="0" stopColor="#7a2142" />
          <stop offset="0.6" stopColor="#3d1226" />
          <stop offset="1" stopColor="#1c0910" />
        </radialGradient>
        {/* woven texture */}
        <pattern
          id={`${id}-weave`}
          width="4"
          height="4"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <rect width="4" height="4" fill="transparent" />
          <rect width="2" height="4" fill="rgb(255 255 255 / 0.035)" />
        </pattern>
        <clipPath id={`${id}-photo`}>
          <circle cx="130" cy="122" r="66" />
        </clipPath>
        <path id={`${id}-top`} d="M 36 132 A 94 94 0 0 1 224 132" />
        <path id={`${id}-bottom`} d="M 36 128 A 94 94 0 0 0 224 128" />
        <filter id={`${id}-shadow`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#000" floodOpacity="0.45" />
        </filter>
      </defs>

      <g filter={`url(#${id}-shadow)`}>
        <circle cx="130" cy="130" r="124" fill={`url(#${id}-bg)`} />
        <circle cx="130" cy="130" r="124" fill={`url(#${id}-weave)`} />
        {/* merrowed edge + stitching */}
        <circle cx="130" cy="130" r="122" fill="none" stroke={BRASS} strokeOpacity="0.55" strokeWidth="3" />
        <circle
          cx="130"
          cy="130"
          r="114"
          fill="none"
          stroke={BRASS}
          strokeWidth="1.6"
          strokeDasharray="3.2 3.4"
        />
      </g>

      {photoUrl ? (
        <image
          href={photoUrl}
          x="64"
          y="56"
          width="132"
          height="132"
          preserveAspectRatio="xMidYMid slice"
          clipPath={`url(#${id}-photo)`}
        />
      ) : (
        <g>
          <circle cx="130" cy="122" r="66" fill="#170b11" />
          {/* a glass as placeholder */}
          <path
            d="M112 92h36l-3.5 26a14.5 14.5 0 0 1-29 0L112 92Z M130 133v24 M118 160h24"
            fill="none"
            stroke={BRASS}
            strokeOpacity="0.7"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      )}
      <circle cx="130" cy="122" r="66" fill="none" stroke={BRASS} strokeWidth="3" />
      <circle
        cx="130"
        cy="122"
        r="70.5"
        fill="none"
        stroke={BRASS}
        strokeOpacity="0.5"
        strokeWidth="1"
        strokeDasharray="2 3"
      />

      <text fill={INK} fontSize={titleSize} letterSpacing="2.2" fontFamily="var(--font-display), serif">
        <textPath href={`#${id}-top`} startOffset="50%" textAnchor="middle">
          {label}
        </textPath>
      </text>
      {date && (
        <text
          fill={BRASS}
          fontSize="10.5"
          letterSpacing="1.6"
          fontFamily="var(--font-body), sans-serif"
          fontWeight="600"
        >
          <textPath href={`#${id}-bottom`} startOffset="50%" textAnchor="middle">
            {date.toUpperCase()}
          </textPath>
        </text>
      )}
      <text x="22" y="135" fill={BRASS} fontSize="11" textAnchor="middle">
        ✦
      </text>
      <text x="238" y="135" fill={BRASS} fontSize="11" textAnchor="middle">
        ✦
      </text>

      {winner && (
        <g>
          {/* ribbon with notched ends */}
          <path d="M58 178h20v24H58l7-12Z M202 178h-20v24h20l-7-12Z" fill="#9c7c45" />
          <rect x="72" y="172" width="116" height="26" rx="2" fill={BRASS} />
          <text
            x="130"
            y="190"
            textAnchor="middle"
            fill="#1a0f12"
            fontSize={winner.length > 10 ? 11.5 : 13.5}
            fontWeight="700"
            fontFamily="var(--font-body), sans-serif"
          >
            ♛ {winner.length > 14 ? `${winner.slice(0, 13)}…` : winner}
          </text>
        </g>
      )}
    </motion.svg>
  );
}
