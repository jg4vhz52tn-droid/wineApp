import { useId } from "react";

export type BottleLabel = { producer: string; name: string; vintage?: string | number };

/**
 * Slim flute (Riesling bottle) in dark glass with a paper label.
 * Drawn on a 200x360 canvas so the cloth in VeiledBottle lines up with it.
 */
export function Bottle({ label, className }: { label?: BottleLabel | null; className?: string }) {
  const id = useId();
  return (
    <svg viewBox="0 0 200 360" className={className} aria-hidden>
      <defs>
        <linearGradient id={`${id}-glass`} x1="0" x2="1">
          <stop offset="0" stopColor="#101a12" />
          <stop offset="0.28" stopColor="#2f4430" />
          <stop offset="0.4" stopColor="#4d6a49" />
          <stop offset="0.55" stopColor="#22331f" />
          <stop offset="1" stopColor="#0c140d" />
        </linearGradient>
        <linearGradient id={`${id}-capsule`} x1="0" x2="1">
          <stop offset="0" stopColor="#7a5a2c" />
          <stop offset="0.4" stopColor="#e2c48e" />
          <stop offset="1" stopColor="#6b4c22" />
        </linearGradient>
        <radialGradient id={`${id}-shadow`}>
          <stop offset="0" stopColor="#000" stopOpacity="0.45" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
      </defs>

      <ellipse cx="100" cy="354" rx="62" ry="6" fill={`url(#${id}-shadow)`} />
      <path
        d="M90 8h20v66c0 26 34 52 34 92v178a10 10 0 0 1-10 10H66a10 10 0 0 1-10-10V166c0-40 34-66 34-92z"
        fill={`url(#${id}-glass)`}
      />
      {/* Highlight running down the glass */}
      <path
        d="M95 30v48c0 22-22 44-26 74v176"
        stroke="#fff"
        strokeOpacity="0.16"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      <rect x="88" y="4" width="24" height="34" rx="3" fill={`url(#${id}-capsule)`} />

      {label && (
        <g>
          <rect x="62" y="206" width="76" height="92" rx="4" fill="#f4ede5" />
          <rect
            x="66"
            y="210"
            width="68"
            height="84"
            rx="2"
            fill="none"
            stroke="#b08a4a"
            strokeOpacity="0.6"
          />
          <text
            x="100"
            y="230"
            textAnchor="middle"
            fontSize="7"
            letterSpacing="1.2"
            fill="#6c5660"
            fontFamily="var(--font-sans-face), sans-serif"
          >
            {label.producer.toUpperCase()}
          </text>
          <foreignObject x="68" y="236" width="64" height="42">
            <p
              style={{
                fontFamily: "var(--font-serif-face), serif",
                fontSize: "13px",
                lineHeight: 1.05,
                color: "#2a1520",
                textAlign: "center",
                margin: 0,
              }}
            >
              {label.name}
            </p>
          </foreignObject>
          {label.vintage && (
            <text
              x="100"
              y="288"
              textAnchor="middle"
              fontSize="8"
              fill="#6c5660"
              fontFamily="var(--font-sans-face), sans-serif"
            >
              {label.vintage}
            </text>
          )}
        </g>
      )}
    </svg>
  );
}
