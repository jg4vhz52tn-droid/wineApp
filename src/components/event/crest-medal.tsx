"use client";

import { useId } from "react";

// The evening crest as a two-sided medal (like Apple's activity medals):
// front = photo with a faint podium and the top three, title ribbon, place;
// back = the date and everyone who was there.

export type MedalProps = {
  title: string;
  startsAt: string | null;
  location: string | null;
  /** Names of places 1, 2, 3 (may be shorter). */
  podium: string[];
  /** Everyone who was there. */
  guests: string[];
  photoUrl: string | null;
};

export const SHIELD =
  "M20 30Q20 14 36 14H204Q220 14 220 30V148C220 208 174 250 120 278C66 250 20 208 20 148Z";
const STITCH = "M31 36Q31 25 42 25H198Q209 25 209 36V148C209 201 167 238 120 264C73 238 31 201 31 148Z";
const WINDOW = "M50 176V114A70 70 0 0 1 190 114V176Z";
const BRASS = "#d1ad72";
const BRASS_DARK = "#9c7c45";
const INK = "#f4ede5";
const WINE_INK = "#2a0d18";
const TZ = "Europe/Berlin";
const day = new Intl.DateTimeFormat("de-DE", { day: "numeric", timeZone: TZ });
const month = new Intl.DateTimeFormat("de-DE", { month: "long", timeZone: TZ });
const year = new Intl.DateTimeFormat("de-DE", { year: "numeric", timeZone: TZ });
const weekday = new Intl.DateTimeFormat("de-DE", { weekday: "long", timeZone: TZ });
const short = (name: string, max: number) => (name.length > max ? `${name.slice(0, max - 1)}…` : name);
const DISPLAY = "var(--font-display), serif";
const BODY = "var(--font-body), sans-serif";

/** Shield body shared by both faces: wine twill, brass edge, stitching. */
function Shield({ id, dark = false }: { id: string; dark?: boolean }) {
  return (
    <>
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0" stopColor={dark ? "#4a1228" : "#5e1832"} />
          <stop offset="1" stopColor={dark ? "#1a0610" : "#24091a"} />
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
      </defs>
      <path d={SHIELD} fill={`url(#${id}-bg)`} />
      <path d={SHIELD} fill={`url(#${id}-twill)`} />
      <path d={SHIELD} fill="none" stroke={BRASS} strokeWidth="6" strokeLinejoin="round" />
      <path
        d={STITCH}
        fill="none"
        stroke={BRASS}
        strokeOpacity="0.8"
        strokeWidth="1.4"
        strokeDasharray="3 3.2"
      />
    </>
  );
}

// Podium blocks (2 - 1 - 3) standing on the bottom edge of the photo window.
const BLOCKS = [
  { place: 2, x: 72, w: 32, h: 20 },
  { place: 1, x: 104, w: 32, h: 30 },
  { place: 3, x: 136, w: 32, h: 13 },
];
const FLOOR = 176;

export function CrestFront({ title, location, podium, photoUrl }: MedalProps) {
  const id = useId().replace(/:/g, "");
  const titleSize = title.length > 24 ? 13 : title.length > 16 ? 15.5 : 18;

  return (
    <svg viewBox="0 0 240 292" className="block h-full w-full overflow-visible" aria-hidden>
      <defs>
        <clipPath id={`${id}-win`}>
          <path d={WINDOW} />
        </clipPath>
        <linearGradient id={`${id}-fade`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.35" stopColor="#14060c" stopOpacity="0" />
          <stop offset="1" stopColor="#14060c" stopOpacity="0.85" />
        </linearGradient>
      </defs>
      <Shield id={id} />
      <text
        x="120"
        y="40"
        textAnchor="middle"
        fill={BRASS}
        fontSize="8"
        letterSpacing="3.5"
        fontWeight="600"
        fontFamily={BODY}
      >
        ✦ LAGENABEND ✦
      </text>

      <g clipPath={`url(#${id}-win)`}>
        {photoUrl ? (
          <image
            href={photoUrl}
            x="50"
            y="44"
            width="140"
            height="132"
            preserveAspectRatio="xMidYMid slice"
          />
        ) : (
          <rect x="50" y="44" width="140" height="132" fill="#14060c" />
        )}
        <rect x="50" y="44" width="140" height="132" fill={`url(#${id}-fade)`} />
        {/* the podium, only hinted */}
        {BLOCKS.map((b) => (
          <g key={b.place}>
            <rect
              x={b.x}
              y={FLOOR - b.h}
              width={b.w}
              height={b.h + 2}
              fill="rgb(255 255 255 / 0.13)"
              stroke={BRASS}
              strokeOpacity="0.55"
              strokeWidth="1"
            />
            <text
              x={b.x + b.w / 2}
              y={FLOOR - b.h + 10}
              textAnchor="middle"
              fill={BRASS}
              fillOpacity="0.8"
              fontSize="7.5"
              fontFamily={DISPLAY}
            >
              {b.place}
            </text>
          </g>
        ))}
        {BLOCKS.map((b) => {
          const name = podium[b.place - 1];
          if (!name) return null;
          const top = FLOOR - b.h;
          return (
            <g key={`n${b.place}`}>
              {b.place === 1 && (
                <text x={b.x + b.w / 2} y={top - 15} textAnchor="middle" fill={BRASS} fontSize="10">
                  ♛
                </text>
              )}
              <text
                x={b.x + b.w / 2}
                y={top - 4}
                textAnchor="middle"
                fill={INK}
                fontSize={b.place === 1 ? 9 : 7.5}
                fontWeight={b.place === 1 ? 700 : 600}
                fontFamily={BODY}
                stroke="#14060c"
                strokeWidth="2.4"
                strokeOpacity="0.7"
                paintOrder="stroke"
              >
                {short(name, b.place === 1 ? 10 : 8)}
              </text>
            </g>
          );
        })}
      </g>
      {!photoUrl && podium.length === 0 && (
        <path
          d="M106 84h28l-3 22a11 11 0 0 1-22 0L106 84Z M120 117v18 M110 136h20"
          fill="none"
          stroke={BRASS}
          strokeOpacity="0.75"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      )}
      <path d={WINDOW} fill="none" stroke={BRASS} strokeWidth="3" />

      {/* ribbon */}
      <path d="M24 186H52V216H24L33 201Z M216 186H188V216H216L207 201Z" fill={BRASS_DARK} />
      <path d="M52 216L60 224V216Z M188 216L180 224V216Z" fill="#6f5530" />
      <rect x="44" y="180" width="152" height="36" rx="2" fill={BRASS} />
      <text
        x="120"
        y={203 + titleSize * 0.05}
        textAnchor="middle"
        fill={WINE_INK}
        fontSize={titleSize}
        fontFamily={DISPLAY}
        {...(title.length > 22 ? { textLength: 140, lengthAdjust: "spacingAndGlyphs" } : {})}
      >
        {title}
      </text>

      {location && (
        <text
          x="120"
          y="236"
          textAnchor="middle"
          fill={INK}
          fillOpacity="0.85"
          fontSize="9.5"
          fontFamily={BODY}
        >
          <tspan fill={BRASS}>⌖ </tspan>
          {short(location, 20)}
        </text>
      )}
      <text x="120" y={location ? 254 : 240} textAnchor="middle" fill={BRASS} fillOpacity="0.7" fontSize="9">
        ↻
      </text>
    </svg>
  );
}

export function CrestBack({ startsAt, location, guests }: MedalProps) {
  const id = useId().replace(/:/g, "");
  const date = startsAt ? new Date(startsAt) : null;
  const shown = guests.length > 8 ? guests.slice(0, 7) : guests;
  const more = guests.length - shown.length;
  const cells = [...shown.map((g) => short(g, 11)), ...(more > 0 ? [`+ ${more} weitere`] : [])];

  return (
    <svg viewBox="0 0 240 292" className="block h-full w-full overflow-visible" aria-hidden>
      <Shield id={id} dark />
      <text
        x="120"
        y="48"
        textAnchor="middle"
        fill={BRASS}
        fontSize="8"
        letterSpacing="3.5"
        fontWeight="600"
        fontFamily={BODY}
      >
        ✦ LAGENABEND ✦
      </text>
      {date ? (
        <>
          <text x="120" y="98" textAnchor="middle" fill={INK} fontSize="46" fontFamily={DISPLAY}>
            {day.format(date)}
          </text>
          <text
            x="120"
            y="118"
            textAnchor="middle"
            fill={INK}
            fontSize="13"
            letterSpacing="3"
            fontFamily={BODY}
            fontWeight="600"
          >
            {month.format(date).toUpperCase()}
          </text>
          <text
            x="120"
            y="134"
            textAnchor="middle"
            fill={BRASS}
            fontSize="10.5"
            letterSpacing="2"
            fontFamily={BODY}
          >
            {weekday.format(date)} · {year.format(date)}
          </text>
        </>
      ) : (
        <text x="120" y="110" textAnchor="middle" fill={INK} fontSize="16" fontFamily={DISPLAY}>
          ohne Datum
        </text>
      )}

      {location && (
        <text
          x="120"
          y="150"
          textAnchor="middle"
          fill={INK}
          fillOpacity="0.75"
          fontSize="9"
          fontFamily={BODY}
        >
          ⌖ {short(location, 24)}
        </text>
      )}
      <path d="M66 162H108 M132 162H174" stroke={BRASS} strokeOpacity="0.6" />
      <text x="120" y="166" textAnchor="middle" fill={BRASS} fontSize="10">
        ✦
      </text>

      {cells.length > 0 && (
        <>
          <text
            x="120"
            y="182"
            textAnchor="middle"
            fill={BRASS}
            fontSize="7.5"
            letterSpacing="2.5"
            fontWeight="600"
            fontFamily={BODY}
          >
            DABEI WAREN
          </text>
          {cells.map((name, i) => {
            const col = cells.length === 1 ? 0.5 : i % 2;
            const row = cells.length === 1 ? 0 : Math.floor(i / 2);
            return (
              <text
                key={`${name}-${i}`}
                x={col === 0.5 ? 120 : col === 0 ? 86 : 154}
                y={197 + row * 13}
                textAnchor="middle"
                fill={INK}
                fontSize="10"
                fontFamily={BODY}
              >
                {name}
              </text>
            );
          })}
        </>
      )}
    </svg>
  );
}
