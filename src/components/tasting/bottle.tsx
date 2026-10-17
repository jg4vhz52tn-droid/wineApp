import { useId } from "react";
import type { BottleShape } from "@/config/bottles";

export type BottleLabel = { producer: string; name: string; vintage?: string | number };

type Geometry = {
  outline: string;
  /** Neck from the lip down to where the shoulder starts. */
  neck: { x: number; width: number; bottom: number };
  label: { x: number; y: number; width: number; height: number };
  /** Sharp highlight down the left side and the soft broad one next to it. */
  specular: string;
  sheen: string;
  rim: string;
  glass: { dark: string; mid: string; light: string };
};

// Both shapes share a 200x360 canvas with the base at y=352.
export const BOTTLES: Record<BottleShape, Geometry> = {
  // Slim "Schlegelflasche" - Riesling and most German whites.
  flute: {
    outline: "M90 6h20v74c0 30 33 52 33 94v168c0 6-4 10-10 10H67c-6 0-10-4-10-10V174c0-42 33-64 33-94z",
    neck: { x: 90, width: 20, bottom: 80 },
    label: { x: 62, y: 214, width: 76, height: 98 },
    specular: "M94 52c0 34-26 58-29 118v166",
    sheen: "M80 182v150",
    rim: "M136 190v146",
    glass: { dark: "#0a140c", mid: "#24391f", light: "#4f6d43" },
  },
  // Sloping shoulders - Pinot Noir, Lemberger and other reds.
  burgundy: {
    outline: "M89 6h22v84c0 44 37 64 37 114v138c0 6-4 10-10 10H62c-6 0-10-4-10-10V204c0-50 37-70 37-114z",
    neck: { x: 89, width: 22, bottom: 90 },
    label: { x: 59, y: 236, width: 82, height: 84 },
    specular: "M93 60c0 40-28 62-31 128v148",
    sheen: "M76 210v124",
    rim: "M141 220v116",
    glass: { dark: "#0f0d06", mid: "#2e2a12", light: "#5a5226" },
  },
};

/** The bottle as SVG content (no outer <svg>) so it can be layered. */
export function BottleArt({ shape, label }: { shape: BottleShape; label?: BottleLabel | null }) {
  const id = useId();
  const g = BOTTLES[shape];
  const l = g.label;
  const url = (name: string) => `url(#${id}-${name})`;

  return (
    <g>
      <defs>
        {/* Round glass: dark at both edges, lighter left of centre */}
        <linearGradient id={`${id}-glass`} x1="0" x2="1">
          <stop offset="0" stopColor={g.glass.dark} />
          <stop offset="0.22" stopColor={g.glass.mid} />
          <stop offset="0.34" stopColor={g.glass.light} />
          <stop offset="0.5" stopColor={g.glass.mid} />
          <stop offset="0.82" stopColor={g.glass.dark} />
          <stop offset="1" stopColor={g.glass.mid} />
        </linearGradient>
        <linearGradient id={`${id}-depth`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#000" stopOpacity="0.15" />
          <stop offset="0.6" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.35" />
        </linearGradient>
        <linearGradient id={`${id}-foil`} x1="0" x2="1">
          <stop offset="0" stopColor="#5e4318" />
          <stop offset="0.32" stopColor="#e9cf97" />
          <stop offset="0.5" stopColor="#b48b48" />
          <stop offset="1" stopColor="#4f3812" />
        </linearGradient>
        {/* Paper wrapped around a cylinder */}
        <linearGradient id={`${id}-paper`} x1="0" x2="1">
          <stop offset="0" stopColor="#cfc3b2" />
          <stop offset="0.3" stopColor="#f7f1e8" />
          <stop offset="0.7" stopColor="#efe7db" />
          <stop offset="1" stopColor="#c4b7a5" />
        </linearGradient>
        <radialGradient id={`${id}-shadow`}>
          <stop offset="0" stopColor="#000" stopOpacity="0.55" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
        <clipPath id={`${id}-clip`}>
          <path d={g.outline} />
        </clipPath>
      </defs>

      <ellipse cx="100" cy="353" rx="60" ry="6" fill={url("shadow")} />

      <path d={g.outline} fill={url("glass")} />
      <g clipPath={url("clip")}>
        <rect x="0" y="0" width="200" height="360" fill={url("depth")} />
        {/* Glass thickness at the base */}
        <ellipse cx="100" cy="348" rx="46" ry="7" fill="#000" fillOpacity="0.35" />
        <g fill="none" strokeLinecap="round">
          <path d={g.sheen} stroke="#fff" strokeOpacity="0.07" strokeWidth="14" />
          <path d={g.specular} stroke="#fff" strokeOpacity="0.5" strokeWidth="2" />
          <path d={g.rim} stroke="#e9c48a" strokeOpacity="0.16" strokeWidth="3" />
        </g>
      </g>

      {/* Lip ring and foil capsule */}
      <rect x={g.neck.x - 1.5} y="36" width={g.neck.width + 3} height="5" rx="2" fill={url("foil")} />
      <rect x={g.neck.x - 1} y="2" width={g.neck.width + 2} height="36" rx="3" fill={url("foil")} />
      <g stroke="#000" strokeOpacity="0.18">
        <line x1={g.neck.x} x2={g.neck.x + g.neck.width} y1="10" y2="10" />
        <line x1={g.neck.x} x2={g.neck.x + g.neck.width} y1="31" y2="31" />
      </g>
      {/* Neck collar label */}
      <rect
        x={g.neck.x - 0.5}
        y={g.neck.bottom - 26}
        width={g.neck.width + 1}
        height="11"
        fill={url("paper")}
      />

      {label && (
        <g>
          <rect x={l.x + 1} y={l.y + 2} width={l.width} height={l.height} fill="#000" opacity="0.25" />
          <rect x={l.x} y={l.y} width={l.width} height={l.height} fill={url("paper")} />
          <rect
            x={l.x + 4}
            y={l.y + 4}
            width={l.width - 8}
            height={l.height - 8}
            fill="none"
            stroke="#a8823f"
            strokeOpacity="0.55"
          />
          <text
            x="100"
            y={l.y + 22}
            textAnchor="middle"
            fontSize="6.5"
            letterSpacing="1.3"
            fill="#6c5660"
            fontFamily="var(--font-sans-face), sans-serif"
          >
            {label.producer.toUpperCase()}
          </text>
          <foreignObject x={l.x + 5} y={l.y + 28} width={l.width - 10} height={l.height - 46}>
            <p
              lang="de"
              style={{
                fontFamily: "var(--font-serif-face), serif",
                fontSize: "11px",
                lineHeight: 1.1,
                hyphens: "auto",
                overflowWrap: "break-word",
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
              y={l.y + l.height - 11}
              textAnchor="middle"
              fontSize="8"
              letterSpacing="1"
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
