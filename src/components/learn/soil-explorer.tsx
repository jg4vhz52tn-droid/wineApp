"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip, Pill } from "@/components/ui/chip";
import { Segmented } from "@/components/ui/segmented";
import { SOILS, type Soil, type SoilId } from "@/config/learn/soils";
import { tick } from "@/lib/haptics";

const GROUND = 92;
const TOPSOIL = 112;
const BOTTOM = 400;
const VINE_X = 170;

const WATER = "#6aa0c8";
const HEAT = "#e3a35a";
const FOOD = "#8fb36b";

const r1 = (n: number) => Math.round(n * 10) / 10;

/** Roots drawn from depth and spread: one tap root plus side roots. */
function rootPaths(soil: Soil) {
  const main: string[] = [`M${VINE_X} ${GROUND}`];
  const branches: string[] = [];
  const steps = Math.floor((soil.rootDepth - GROUND) / 26);
  let x = VINE_X;
  for (let i = 1; i <= steps; i++) {
    const y = GROUND + i * 26;
    const nx = r1(VINE_X + Math.sin(i * 1.3) * 6 + Math.sin(i * 0.4) * 5);
    main.push(`Q${r1((x + nx) / 2 + (i % 3 === 0 ? 4 : -2))} ${y - 13} ${nx} ${y}`);
    x = nx;
    if (i % 2 === 0 || i === 1) {
      const side = i % 4 === 0 ? -1 : 1;
      const reach = soil.rootSpread * (0.55 + ((i * 37) % 10) / 22);
      const ex = r1(nx + side * reach);
      const ey = y + 22 + (i % 3) * 6;
      branches.push(`M${nx} ${y}Q${r1(nx + side * reach * 0.5)} ${y + 2} ${ex} ${ey}`);
      branches.push(`M${r1(nx + side * reach * 0.6)} ${y + 8}q${side * 10} 6 ${side * 14} 18`);
    }
  }
  return { main: main.join(""), branches };
}

export function SoilExplorer() {
  const [soilId, setSoilId] = useState<SoilId>("schiefer");
  const [rain, setRain] = useState(0);
  const [night, setNight] = useState(false);
  const reduce = useReducedMotion();
  const soil = SOILS.find((s) => s.id === soilId)!;
  const roots = rootPaths(soil);
  const drainTo = TOPSOIL + (10 - soil.water) * 27;

  return (
    <div className="space-y-5">
      <div className="-mx-5 flex [scrollbar-width:none] gap-2 overflow-x-auto px-5 pb-1">
        {SOILS.map((s) => (
          <Chip
            key={s.id}
            selected={s.id === soilId}
            className="shrink-0"
            onClick={() => {
              tick("minor");
              setSoilId(s.id);
            }}
          >
            {s.name}
          </Chip>
        ))}
      </div>

      <Segmented<"tag" | "nacht">
        label="Tageszeit"
        value={night ? "nacht" : "tag"}
        onChange={(v) => {
          tick("minor");
          setNight(v === "nacht");
        }}
        options={[
          { value: "tag", label: "Tag" },
          { value: "nacht", label: "Nacht" },
        ]}
      />

      <div className="relative overflow-hidden rounded-card border border-border bg-surface-2/50">
        <svg
          viewBox={`0 0 340 ${BOTTOM}`}
          className="block w-full"
          role="img"
          aria-label={`Querschnitt: ${soil.name}`}
        >
          <SoilPatterns />

          {/* Night sky */}
          <motion.rect
            x="0"
            y="0"
            width="340"
            height={GROUND}
            fill="#141a2e"
            initial={false}
            animate={{ opacity: night ? 0.92 : 0 }}
            transition={{ duration: 0.8 }}
          />
          {night ? (
            <g>
              <circle cx="296" cy="38" r="13" fill="#ece6d2" />
              <circle cx="302" cy="33" r="11" fill="#141a2e" />
              {[
                [40, 22],
                [92, 14],
                [236, 26],
                [262, 64],
                [70, 60],
              ].map(([cx, cy]) => (
                <circle key={`${cx}`} cx={cx} cy={cy} r="1.2" fill="#ece6d2" />
              ))}
            </g>
          ) : (
            <g>
              {/* Sun and its warmth */}
              <motion.circle
                cx="296"
                cy="38"
                r="30"
                fill={HEAT}
                animate={reduce ? undefined : { opacity: [0.12, 0.25, 0.12] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
              <circle cx="296" cy="38" r="15" fill={HEAT} />
            </g>
          )}

          {/* Vine */}
          <g stroke="#5a3f2a" strokeLinecap="round" fill="none">
            <path d={`M${VINE_X} ${GROUND}C${VINE_X - 3} 76 ${VINE_X + 3} 64 ${VINE_X} 52`} strokeWidth="6" />
            <path
              d={`M${VINE_X} 56C${VINE_X - 20} 50 ${VINE_X - 40} 52 ${VINE_X - 56} 46`}
              strokeWidth="3.5"
            />
            <path
              d={`M${VINE_X} 56C${VINE_X + 20} 50 ${VINE_X + 40} 52 ${VINE_X + 56} 46`}
              strokeWidth="3.5"
            />
          </g>
          <g fill="#5e7a45">
            {[
              [VINE_X - 52, 36],
              [VINE_X - 30, 34],
              [VINE_X + 30, 34],
              [VINE_X + 52, 36],
              [VINE_X - 10, 38],
              [VINE_X + 12, 37],
            ].map(([cx, cy]) => (
              <ellipse key={`${cx}`} cx={cx} cy={cy} rx="11" ry="8" />
            ))}
          </g>
          <g fill="var(--wine)">
            {[
              [VINE_X - 34, 54],
              [VINE_X - 28, 54],
              [VINE_X - 31, 60],
              [VINE_X + 30, 54],
              [VINE_X + 36, 54],
              [VINE_X + 33, 60],
            ].map(([cx, cy]) => (
              <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="3.4" />
            ))}
          </g>

          {/* Ground */}
          <rect x="0" y={GROUND} width="340" height={TOPSOIL - GROUND} fill="#4b3628" />
          <AnimatePresence mode="popLayout">
            <motion.rect
              key={soil.id}
              x="0"
              y={TOPSOIL}
              width="340"
              height={BOTTOM - TOPSOIL}
              fill={`url(#soil-${soil.id})`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            />
          </AnimatePresence>

          {/* Warmth stored near the surface */}
          <defs>
            <linearGradient id="soil-heat" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={HEAT} stopOpacity="0.9" />
              <stop offset="1" stopColor={HEAT} stopOpacity="0" />
            </linearGradient>
            <linearGradient id="soil-water" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={WATER} stopOpacity="0.7" />
              <stop offset="1" stopColor={WATER} stopOpacity="0" />
            </linearGradient>
          </defs>
          <motion.rect
            x="0"
            y={GROUND}
            width="340"
            height="110"
            fill="url(#soil-heat)"
            animate={{
              opacity: reduce
                ? (soil.heat / 10) * 0.4
                : [(soil.heat / 10) * 0.25, (soil.heat / 10) * 0.5, (soil.heat / 10) * 0.25],
            }}
            transition={{ duration: 3, repeat: Infinity }}
          />
          {/* Water the soil keeps */}
          <motion.rect
            x="0"
            y={TOPSOIL}
            width="340"
            height={r1(soil.water * 24)}
            fill="url(#soil-water)"
            animate={{ opacity: rain ? (soil.water / 10) * 0.9 : (soil.water / 10) * 0.45 }}
            transition={{ duration: 1.2, delay: rain ? 1 : 0 }}
          />

          {/* Roots grow again for every soil */}
          <g key={soil.id} fill="none" stroke="#e8d9bf" strokeLinecap="round">
            <motion.path
              d={roots.main}
              strokeWidth="3.2"
              initial={{ pathLength: reduce ? 1 : 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.4, ease: "easeOut" }}
            />
            {roots.branches.map((d, i) => (
              <motion.path
                key={d}
                d={d}
                strokeWidth={i % 2 ? 1 : 1.8}
                strokeOpacity="0.85"
                initial={{ pathLength: reduce ? 1 : 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.9, delay: reduce ? 0 : 0.3 + i * 0.06 }}
              />
            ))}
          </g>

          {/* At night the ground gives its stored warmth back to the vine */}
          {night &&
            [130, 170, 210].map((x, i) => (
              <motion.path
                key={x}
                d={`M${x} ${GROUND}c-6-8 6-14 0-22s6-14 0-22`}
                fill="none"
                stroke={HEAT}
                strokeWidth="2.5"
                strokeLinecap="round"
                initial={{ opacity: 0, y: 0 }}
                animate={
                  reduce ? { opacity: soil.heat / 10 } : { opacity: [0, soil.heat / 10, 0], y: [0, -14, -26] }
                }
                transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.6, ease: "easeOut" }}
              />
            ))}

          {/* Rain: drops sink as deep as the soil lets them */}
          {rain > 0 &&
            Array.from({ length: 18 }, (_, i) => {
              const x = 18 + ((i * 53) % 304);
              return (
                <motion.ellipse
                  key={`${rain}-${i}`}
                  cx={x}
                  cy="0"
                  rx="2.2"
                  ry="4"
                  fill={WATER}
                  initial={{ y: -10, opacity: 0 }}
                  animate={{ y: [-10, GROUND, drainTo], opacity: [0, 1, 0] }}
                  transition={{ duration: 1.8, delay: (i % 6) * 0.12, times: [0, 0.35, 1], ease: "easeIn" }}
                />
              );
            })}
        </svg>
        <Button
          variant="secondary"
          className="absolute right-3 bottom-3 h-10 px-4 text-sm"
          onClick={() => {
            tick("minor");
            setRain((n) => n + 1);
          }}
        >
          Regen lassen
        </Button>
      </div>

      <Card className="space-y-4">
        <div className="space-y-1">
          <p className="font-display text-2xl leading-tight">{soil.name}</p>
          <p className="text-sm text-muted">{soil.origin}</p>
        </div>
        <div className="space-y-2.5">
          <Meter label="Wasser halten" value={soil.water} color={WATER} />
          <Meter label="Wärme speichern" value={soil.heat} color={HEAT} />
          <Meter label="Nährstoffe" value={soil.nutrients} color={FOOD} />
        </div>
        <p className="leading-relaxed">{soil.whatHappens}</p>
        {night && (
          <p className="rounded-control border border-border px-4 py-3 text-sm leading-relaxed">
            <strong>Nachts:</strong>{" "}
            {soil.heat >= 8
              ? "Die Steine geben die gespeicherte Wärme an die Reben ab – das schützt in kühlen Nächten und hilft den Trauben beim Reifen."
              : soil.heat >= 6
                ? "Der Boden gibt etwas Wärme ab, kühlt aber über Nacht spürbar aus."
                : "Der Boden kühlt schnell aus. Kühle Nächte bewahren Säure und Frische in den Trauben."}
          </p>
        )}
        <div className="rounded-control bg-surface-2/70 p-4">
          <p className="mb-1 text-xs font-medium tracking-[0.14em] text-accent uppercase">So schmeckt’s</p>
          <p className="leading-relaxed">{soil.taste}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {soil.sites.map((site) => (
            <Pill key={site}>{site}</Pill>
          ))}
        </div>
      </Card>
    </div>
  );
}

function Meter({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="grid grid-cols-[8.5rem_1fr] items-center gap-3 text-sm">
      <span className="text-muted">{label}</span>
      <div
        className="h-2 overflow-hidden rounded-full bg-surface-2"
        role="meter"
        aria-label={label}
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={10}
      >
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={false}
          animate={{ width: `${value * 10}%` }}
          transition={{ type: "spring", stiffness: 140, damping: 20 }}
        />
      </div>
    </div>
  );
}

/** Rock textures for the cross-section. */
function SoilPatterns() {
  return (
    <defs>
      <pattern id="soil-schiefer" width="28" height="16" patternUnits="userSpaceOnUse">
        <rect width="28" height="16" fill="#3b414f" />
        <path d="M-2 12L30 3" stroke="#262a33" strokeWidth="3.5" />
        <path d="M-2 15L30 6" stroke="#5c6474" strokeWidth="1" />
      </pattern>
      <pattern id="soil-kalk" width="34" height="30" patternUnits="userSpaceOnUse">
        <rect width="34" height="30" fill="#d9ceb3" />
        <path d="M5 11a5 5 0 0 1 10 0M7 11a3 3 0 0 1 6 0" stroke="#ad9f7d" fill="none" strokeWidth="1.2" />
        <path d="M21 24a4 4 0 0 1 8 0" stroke="#ad9f7d" fill="none" strokeWidth="1.2" />
        <circle cx="26" cy="7" r="1.4" fill="#bfb08c" />
        <circle cx="10" cy="23" r="1.1" fill="#bfb08c" />
      </pattern>
      <pattern id="soil-loess" width="10" height="10" patternUnits="userSpaceOnUse">
        <rect width="10" height="10" fill="#c7a26b" />
        <circle cx="2" cy="3" r="0.9" fill="#ad8a54" />
        <circle cx="7" cy="7" r="0.9" fill="#ad8a54" />
        <circle cx="6" cy="2" r="0.6" fill="#dcbd88" />
      </pattern>
      <pattern id="soil-granit" width="18" height="18" patternUnits="userSpaceOnUse">
        <rect width="18" height="18" fill="#b8a9a4" />
        <rect x="3" y="4" width="2.4" height="2" fill="#2b2627" />
        <rect x="10" y="2" width="3" height="1.6" fill="#f3ede7" />
        <rect x="6" y="12" width="3.2" height="2.2" fill="#c98a7c" />
        <rect x="14" y="10" width="2" height="2" fill="#3b3536" />
        <rect x="12" y="15" width="1.8" height="1.4" fill="#f3ede7" />
      </pattern>
      <pattern id="soil-vulkan" width="26" height="26" patternUnits="userSpaceOnUse">
        <rect width="26" height="26" fill="#2f2a2b" />
        <circle cx="6" cy="7" r="2.5" fill="#1b1819" />
        <circle cx="18" cy="14" r="1.7" fill="#1b1819" />
        <circle cx="10" cy="20" r="2" fill="#1b1819" />
        <circle cx="20" cy="5" r="1" fill="#7a4632" />
        <circle cx="4" cy="16" r="1" fill="#7a4632" />
      </pattern>
    </defs>
  );
}
