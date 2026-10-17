import { useId } from "react";
import type { BottleShape } from "@/config/bottles";

export type BottleLabel = { producer: string; name: string; vintage?: string | number };

type Geometry = {
  outline: string;
  capsule: { x: number; width: number };
  label: { x: number; y: number; width: number; height: number; rx: number };
  highlight: string;
  glass: [string, string, string, string, string];
  shadowRx: number;
};

// All shapes share a 200x360 canvas with the base at y=354.
export const BOTTLES: Record<BottleShape, Geometry> = {
  // Slim "Schlegelflasche" - Riesling and other aromatic whites.
  flute: {
    outline: "M90 8h20v66c0 26 34 52 34 92v178a10 10 0 0 1-10 10H66a10 10 0 0 1-10-10V166c0-40 34-66 34-92z",
    capsule: { x: 88, width: 24 },
    label: { x: 62, y: 206, width: 76, height: 92, rx: 4 },
    highlight: "M95 30v48c0 22-22 44-26 74v176",
    glass: ["#101a12", "#2f4430", "#4d6a49", "#22331f", "#0c140d"],
    shadowRx: 62,
  },
  // Sloping shoulders - Pinot, Chardonnay.
  burgundy: {
    outline:
      "M88 8h24v80c0 42 36 62 36 112v144a10 10 0 0 1-10 10H62a10 10 0 0 1-10-10V200c0-50 36-70 36-112z",
    capsule: { x: 86, width: 28 },
    label: { x: 58, y: 228, width: 84, height: 86, rx: 4 },
    highlight: "M94 30v56c0 30-24 52-28 96v150",
    glass: ["#1a170b", "#3d3818", "#5e5728", "#2c2810", "#110f06"],
    shadowRx: 66,
  },
  // High, straight shoulders - Bordeaux-style reds.
  bordeaux: {
    outline: "M89 8h22v90c0 18 35 20 35 42v204a10 10 0 0 1-10 10H64a10 10 0 0 1-10-10V140c0-22 35-24 35-42z",
    capsule: { x: 87, width: 26 },
    label: { x: 60, y: 196, width: 80, height: 96, rx: 4 },
    highlight: "M94 30v66c0 14-26 20-26 44v190",
    glass: ["#0a0f0b", "#1c271d", "#2f402f", "#141c14", "#070a07"],
    shadowRx: 62,
  },
  // Flat, round "Bocksbeutel" on a short foot - Franken.
  bocksbeutel: {
    outline:
      "M90 8h20v106c0 8 6 12 16 16C156 142 178 176 178 218C178 262 156 298 130 314L134 344a10 10 0 0 1-10 10H76a10 10 0 0 1-10-10L70 314C44 298 22 262 22 218C22 176 44 142 74 130c10-4 16-8 16-16z",
    capsule: { x: 88, width: 24 },
    label: { x: 56, y: 184, width: 88, height: 74, rx: 10 },
    highlight: "M95 30v80c0 12-20 22-38 38-14 14-22 40-22 70",
    glass: ["#0f1a10", "#2c442c", "#4c6c48", "#1f331f", "#0b140b"],
    shadowRx: 60,
  },
};

/** The bottle as SVG content (no outer <svg>) so it can be layered. */
export function BottleArt({ shape, label }: { shape: BottleShape; label?: BottleLabel | null }) {
  const id = useId();
  const g = BOTTLES[shape];
  const l = g.label;
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-glass`} x1="0" x2="1">
          {g.glass.map((color, i) => (
            <stop key={i} offset={[0, 0.28, 0.4, 0.55, 1][i]} stopColor={color} />
          ))}
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

      <ellipse cx="100" cy="354" rx={g.shadowRx} ry="6" fill={`url(#${id}-shadow)`} />
      <path d={g.outline} fill={`url(#${id}-glass)`} />
      <path
        d={g.highlight}
        stroke="#fff"
        strokeOpacity="0.16"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      <rect x={g.capsule.x} y="4" width={g.capsule.width} height="34" rx="3" fill={`url(#${id}-capsule)`} />

      {label && (
        <g>
          <rect x={l.x} y={l.y} width={l.width} height={l.height} rx={l.rx} fill="#f4ede5" />
          <rect
            x={l.x + 4}
            y={l.y + 4}
            width={l.width - 8}
            height={l.height - 8}
            rx={Math.max(2, l.rx - 3)}
            fill="none"
            stroke="#b08a4a"
            strokeOpacity="0.6"
          />
          <text
            x="100"
            y={l.y + 22}
            textAnchor="middle"
            fontSize="7"
            letterSpacing="1.2"
            fill="#6c5660"
            fontFamily="var(--font-sans-face), sans-serif"
          >
            {label.producer.toUpperCase()}
          </text>
          <foreignObject x={l.x + 6} y={l.y + 28} width={l.width - 12} height={l.height - 44}>
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
              y={l.y + l.height - 10}
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
    </g>
  );
}

/** Standalone bottle. */
export function Bottle({
  shape = "flute",
  label,
  className,
}: {
  shape?: BottleShape;
  label?: BottleLabel | null;
  className?: string;
}) {
  return (
    <svg viewBox="0 0 200 360" className={className} aria-hidden>
      <BottleArt shape={shape} label={label} />
    </svg>
  );
}
