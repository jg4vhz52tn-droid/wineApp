"use client";

import { motion, useReducedMotion } from "motion/react";
import { useId } from "react";

// Three drafts for the evening patch. Same input, very different feel.

export type PatchProps = {
  title: string;
  startsAt: string | null;
  winner: string | null;
  photoUrl: string | null;
  className?: string;
};

const BRASS = "#d1ad72";
const BRASS_DARK = "#9c7c45";
const INK = "#f4ede5";
const WINE_INK = "#2a0d18";
const TZ = "Europe/Berlin";
const longDate = new Intl.DateTimeFormat("de-DE", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: TZ,
});
const dotDate = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: TZ,
});

const useIds = () => useId().replace(/:/g, "");
const fmtLong = (iso: string | null) => (iso ? longDate.format(new Date(iso)) : "");
const fmtDots = (iso: string | null) => (iso ? dotDate.format(new Date(iso)).replace(/\./g, " · ") : "");
const short = (name: string, max: number) => (name.length > max ? `${name.slice(0, max - 1)}…` : name);

/** Pops in like a sticker being pressed on. */
function Pop({
  children,
  className,
  label,
  viewBox,
}: {
  children: React.ReactNode;
  className?: string;
  label: string;
  viewBox: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.svg
      viewBox={viewBox}
      className={className}
      role="img"
      aria-label={label}
      initial={reduce ? false : { scale: 0.7, rotate: -8, opacity: 0 }}
      animate={{ scale: 1, rotate: 0, opacity: 1 }}
      transition={{ type: "spring", damping: 15, stiffness: 170 }}
    >
      {children}
    </motion.svg>
  );
}

const describe = ({ title, startsAt, winner }: PatchProps) =>
  `Abend-Patch: ${title}${startsAt ? `, ${fmtLong(startsAt)}` : ""}${winner ? `, beste Nase ${winner}` : ""}`;

function GlassMark({ x, y, s = 1, color = BRASS }: { x: number; y: number; s?: number; color?: string }) {
  return (
    <path
      transform={`translate(${x} ${y}) scale(${s})`}
      d="M-14 -24h28l-3 22a11 11 0 0 1-22 0L-14 -24Z M0 9v18 M-10 28h20"
      fill="none"
      stroke={color}
      strokeOpacity="0.75"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}

// --- A · Wappen -----------------------------------------------------------------

/** Embroidered club crest: arched photo window, brass ribbon with the title, winner stitched below. */
export function PatchCrest(props: PatchProps) {
  const { title, startsAt, winner, photoUrl, className } = props;
  const id = useIds();
  const shield = "M20 30Q20 14 36 14H204Q220 14 220 30V148C220 208 174 250 120 278C66 250 20 208 20 148Z";
  const stitch = "M31 36Q31 25 42 25H198Q209 25 209 36V148C209 201 167 238 120 264C73 238 31 201 31 148Z";
  const window = "M64 166V118A56 56 0 0 1 176 118V166Z";
  const titleSize = title.length > 24 ? 13 : title.length > 16 ? 15.5 : 18;

  return (
    <Pop className={className} label={describe(props)} viewBox="0 0 240 292">
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0" stopColor="#5e1832" />
          <stop offset="1" stopColor="#24091a" />
        </linearGradient>
        <pattern
          id={`${id}-twill`}
          width="5"
          height="5"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(35)"
        >
          <rect width="2.4" height="5" fill="rgb(255 255 255 / 0.045)" />
        </pattern>
        <clipPath id={`${id}-win`}>
          <path d={window} />
        </clipPath>
        <filter id={`${id}-sh`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="7" stdDeviation="7" floodOpacity="0.4" />
        </filter>
      </defs>

      <g filter={`url(#${id}-sh)`}>
        <path d={shield} fill={`url(#${id}-bg)`} />
        <path d={shield} fill={`url(#${id}-twill)`} />
        <path d={shield} fill="none" stroke={BRASS} strokeWidth="6" strokeLinejoin="round" />
      </g>
      <path
        d={stitch}
        fill="none"
        stroke={BRASS}
        strokeOpacity="0.8"
        strokeWidth="1.4"
        strokeDasharray="3 3.2"
      />

      <text
        x="120"
        y="48"
        textAnchor="middle"
        fill={BRASS}
        fontSize="9.5"
        letterSpacing="4"
        fontWeight="600"
        fontFamily="var(--font-body), sans-serif"
      >
        LAGENABEND
      </text>

      {photoUrl ? (
        <image
          href={photoUrl}
          x="64"
          y="62"
          width="112"
          height="104"
          preserveAspectRatio="xMidYMid slice"
          clipPath={`url(#${id}-win)`}
        />
      ) : (
        <g>
          <path d={window} fill="#14060c" />
          <GlassMark x={120} y={114} />
        </g>
      )}
      <path d={window} fill="none" stroke={BRASS} strokeWidth="3" />

      {/* ribbon: folded ends behind, band in front */}
      <path d="M24 164H52V194H24L33 179Z M216 164H188V194H216L207 179Z" fill={BRASS_DARK} />
      <path d="M52 194L60 202V194Z M188 194L180 202V194Z" fill="#6f5530" />
      <rect x="44" y="158" width="152" height="36" rx="2" fill={BRASS} />
      <text
        x="120"
        y={181 + titleSize * 0.05}
        textAnchor="middle"
        fill={WINE_INK}
        fontSize={titleSize}
        fontFamily="var(--font-display), serif"
        {...(title.length > 22 ? { textLength: 140, lengthAdjust: "spacingAndGlyphs" } : {})}
      >
        {title}
      </text>

      {winner && (
        <text
          x="120"
          y="222"
          textAnchor="middle"
          fill={INK}
          fontSize="15"
          fontWeight="600"
          fontFamily="var(--font-body), sans-serif"
        >
          <tspan fill={BRASS}>♛ </tspan>
          {short(winner, 14)}
        </text>
      )}
      <text
        x="120"
        y={winner ? 241 : 228}
        textAnchor="middle"
        fill={BRASS}
        fontSize="9.5"
        letterSpacing="2.5"
        fontFamily="var(--font-body), sans-serif"
      >
        {fmtDots(startsAt)}
      </text>
    </Pop>
  );
}

// --- B · Sticker ----------------------------------------------------------------

/** Die-cut memory sticker: the photo is the star, title like a caption, a gold seal for the winner. */
export function PatchSticker(props: PatchProps) {
  const { title, startsAt, winner, photoUrl, className } = props;
  const id = useIds();
  const seal = Array.from({ length: 48 }, (_, i) => {
    const a = (i / 48) * Math.PI * 2;
    const r = i % 2 ? 31 : 34;
    return `${(190 + Math.cos(a) * r).toFixed(1)},${(192 + Math.sin(a) * r).toFixed(1)}`;
  }).join(" ");
  const titleSize = title.length > 24 ? 15 : title.length > 16 ? 18 : 21;

  return (
    <Pop className={className} label={describe(props)} viewBox="-10 -6 260 316">
      <defs>
        <clipPath id={`${id}-photo`}>
          <rect x="22" y="22" width="196" height="178" rx="12" />
        </clipPath>
        <linearGradient id={`${id}-gold`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f2dda6" />
          <stop offset="0.45" stopColor="#c99d55" />
          <stop offset="1" stopColor="#8c6630" />
        </linearGradient>
        <linearGradient id={`${id}-shade`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.55" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.35" />
        </linearGradient>
        <path id={`${id}-ring`} d="M166 192A24 24 0 0 1 214 192" />
        <filter id={`${id}-sh`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="8" stdDeviation="8" floodOpacity="0.35" />
        </filter>
      </defs>

      <g transform="rotate(-3 120 150)">
        <rect x="10" y="10" width="220" height="280" rx="22" fill="#fbf7f1" filter={`url(#${id}-sh)`} />
        {photoUrl ? (
          <image
            href={photoUrl}
            x="22"
            y="22"
            width="196"
            height="178"
            preserveAspectRatio="xMidYMid slice"
            clipPath={`url(#${id}-photo)`}
          />
        ) : (
          <g clipPath={`url(#${id}-photo)`}>
            <rect x="22" y="22" width="196" height="178" fill="#2a1418" />
            <GlassMark x={120} y={108} s={1.3} />
          </g>
        )}
        <rect x="22" y="22" width="196" height="178" rx="12" fill={`url(#${id}-shade)`} />

        <text
          x="24"
          y="236"
          fill="#2a1418"
          fontSize={titleSize}
          fontFamily="var(--font-display), serif"
          {...(title.length > 20 ? { textLength: 192, lengthAdjust: "spacingAndGlyphs" } : {})}
        >
          {title}
        </text>
        <text
          x="24"
          y="258"
          fill="#8a776c"
          fontSize="10.5"
          letterSpacing="1.2"
          fontFamily="var(--font-body), sans-serif"
        >
          LAGENABEND · {fmtDots(startsAt).replace(/ · /g, ".")}
        </text>
        <text
          x="216"
          y="278"
          textAnchor="end"
          fill="#b9a99c"
          fontSize="9"
          fontFamily="var(--font-body), sans-serif"
        >
          ✦
        </text>

        {winner && (
          <g>
            <polygon
              points={seal}
              fill={`url(#${id}-gold)`}
              stroke="#fbf7f1"
              strokeWidth="3"
              strokeLinejoin="round"
            />
            <circle
              cx="190"
              cy="192"
              r="25"
              fill="none"
              stroke="#7a5626"
              strokeOpacity="0.45"
              strokeDasharray="1.6 2"
            />
            <text
              fill="#5a3c14"
              fontSize="6.5"
              letterSpacing="1.6"
              fontWeight="700"
              fontFamily="var(--font-body), sans-serif"
            >
              <textPath href={`#${id}-ring`} startOffset="50%" textAnchor="middle">
                BESTE NASE
              </textPath>
            </text>
            <text x="190" y="196" textAnchor="middle" fill="#5a3c14" fontSize="12">
              ♛
            </text>
            <text
              x="190"
              y="208"
              textAnchor="middle"
              fill="#3e2a0e"
              fontSize={winner.length > 7 ? 7 : 8.5}
              fontWeight="700"
              fontFamily="var(--font-body), sans-serif"
            >
              {short(winner, 10).toUpperCase()}
            </text>
          </g>
        )}
      </g>
    </Pop>
  );
}

// --- C · Kapsel -----------------------------------------------------------------

/** The top of a bottle capsule: crimped wine-red foil, embossed ring with title and date, photo in the middle. */
export function PatchCapsule(props: PatchProps) {
  const { title, startsAt, winner, photoUrl, className } = props;
  const id = useIds();
  const crimp = Array.from({ length: 72 }, (_, i) => {
    const a = (i / 72) * Math.PI * 2;
    const r = i % 2 ? 119 : 124;
    return `${(130 + Math.cos(a) * r).toFixed(1)},${(130 + Math.sin(a) * r).toFixed(1)}`;
  }).join(" ");
  const label = title.toUpperCase();
  const titleSize = label.length > 26 ? 11.5 : label.length > 18 ? 13.5 : 16;
  const bottom = [winner ? `♛ ${short(winner, 14).toUpperCase()}` : null, fmtDots(startsAt)]
    .filter(Boolean)
    .join("   ·   ");

  return (
    <Pop className={className} label={describe(props)} viewBox="0 0 260 260">
      <defs>
        <radialGradient id={`${id}-foil`} cx="38%" cy="32%" r="75%">
          <stop offset="0" stopColor="#b83a62" />
          <stop offset="0.45" stopColor="#7a1838" />
          <stop offset="1" stopColor="#3a0a1a" />
        </radialGradient>
        <linearGradient id={`${id}-sheen`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0.25" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.42" stopColor="#fff" stopOpacity="0.22" />
          <stop offset="0.55" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <clipPath id={`${id}-photo`}>
          <circle cx="130" cy="130" r="54" />
        </clipPath>
        <path id={`${id}-top`} d="M48 130A82 82 0 0 1 212 130" />
        <path id={`${id}-bottom`} d="M40 130A90 90 0 0 0 220 130" />
        <filter id={`${id}-sh`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="6" floodOpacity="0.45" />
        </filter>
      </defs>

      <g filter={`url(#${id}-sh)`}>
        <polygon points={crimp} fill={`url(#${id}-foil)`} />
      </g>
      {/* brushed foil rings */}
      {[112, 104, 96, 70, 64].map((r) => (
        <circle key={r} cx="130" cy="130" r={r} fill="none" stroke="#fff" strokeOpacity="0.06" />
      ))}
      <polygon points={crimp} fill={`url(#${id}-sheen)`} />
      {/* embossed ring */}
      <circle cx="130" cy="130" r="108" fill="none" stroke={BRASS} strokeOpacity="0.75" strokeWidth="1.6" />
      <circle cx="130" cy="130" r="66" fill="none" stroke={BRASS} strokeOpacity="0.75" strokeWidth="1.6" />

      <text
        fill={INK}
        fontSize={titleSize}
        letterSpacing="2"
        fontFamily="var(--font-display), serif"
        style={{ textShadow: "0 1px 0 rgb(0 0 0 / 0.4)" }}
      >
        <textPath href={`#${id}-top`} startOffset="50%" textAnchor="middle">
          {label}
        </textPath>
      </text>
      <text
        fill={BRASS}
        fontSize="10"
        letterSpacing="1.4"
        fontWeight="600"
        fontFamily="var(--font-body), sans-serif"
      >
        <textPath href={`#${id}-bottom`} startOffset="50%" textAnchor="middle">
          {bottom}
        </textPath>
      </text>

      {photoUrl ? (
        <image
          href={photoUrl}
          x="76"
          y="76"
          width="108"
          height="108"
          preserveAspectRatio="xMidYMid slice"
          clipPath={`url(#${id}-photo)`}
        />
      ) : (
        <g>
          <circle cx="130" cy="130" r="54" fill="#1c0710" />
          <GlassMark x={130} y={128} />
        </g>
      )}
      <circle cx="130" cy="130" r="54" fill="none" stroke="#1c0710" strokeOpacity="0.6" strokeWidth="4" />
      <circle cx="130" cy="130" r="57" fill="none" stroke={BRASS} strokeWidth="2" />
    </Pop>
  );
}

/** A warm sample photo (drawn, no real people) to judge the drafts. */
export const SAMPLE_PHOTO = `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 360">
<defs><radialGradient id="l" cx="62%" cy="38%" r="70%"><stop offset="0" stop-color="#c98a45"/><stop offset=".45" stop-color="#5a2a1c"/><stop offset="1" stop-color="#1a0b0a"/></radialGradient>
<linearGradient id="t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3b2016"/><stop offset="1" stop-color="#160a08"/></linearGradient></defs>
<rect width="400" height="360" fill="url(#l)"/>
<g fill="#ffd9a0" opacity=".35"><circle cx="300" cy="80" r="26"/><circle cx="350" cy="140" r="14"/><circle cx="250" cy="40" r="10"/><circle cx="60" cy="70" r="18"/></g>
<rect y="250" width="400" height="110" fill="url(#t)"/>
<path d="M170 250V140c0-22 10-34 10-58V40h20v42c0 24 10 36 10 58v110Z" fill="#1d2a14"/>
<rect x="176" y="150" width="28" height="44" rx="2" fill="#efe3c8"/><rect x="180" y="30" width="20" height="18" fill="#7a1838"/>
<g fill="none" stroke="#f1e6d4" stroke-opacity=".75" stroke-width="3"><path d="M90 170h44l-4 34a18 18 0 0 1-36 0Z"/><path d="M112 222v28M98 252h28"/><path d="M262 176h44l-4 34a18 18 0 0 1-36 0Z"/><path d="M284 228v22M270 252h28"/></g>
<path d="M95 186h34l-2 16a15 15 0 0 1-30 0Z" fill="#e6c76a" opacity=".75"/><path d="M267 192h34l-2 16a15 15 0 0 1-30 0Z" fill="#7a1838" opacity=".8"/>
</svg>`)}`;
