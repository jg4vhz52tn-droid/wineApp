"use client";

import { AnimatePresence, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { useRef, useState } from "react";
import { ArrowRightIcon, PinIcon } from "@/components/ui/icons";
import { eventDateParts } from "@/lib/format";
import { tick } from "@/lib/haptics";

export type TicketProps = {
  organizerName: string | null;
  title: string;
  theme: string | null;
  startsAt: string | null;
  location: string | null;
  isBlind: boolean;
  confirmed: number;
  limit: number | null;
  /** Render the title as the page's h1 (on the invite page itself). */
  asPageTitle?: boolean;
  /** What appears once the stub is torn off. */
  children?: React.ReactNode;
};

const INK = "#f4ede5";
const BRASS = "#d1ad72";
const CARD_BG =
  "radial-gradient(120% 70% at 0% 0%, #6e1b3a 0%, transparent 60%), radial-gradient(90% 60% at 100% 100%, #3d1a2d 0%, transparent 70%), #170b11";
const STUB_BG = "radial-gradient(90% 120% at 100% 100%, #3d1a2d 0%, transparent 70%), #170b11";
const TEAR_DISTANCE = 90;

// Jagged edge where the stub was torn off (percent-based so it fits any width).
const TORN = (() => {
  const teeth = 22;
  const points = ["0 0", "100% 0"];
  for (let i = teeth; i >= 0; i--) {
    points.push(`${(i / teeth) * 100}% ${i % 2 ? "calc(100% - 7px)" : "100%"}`);
  }
  return `polygon(${points.join(",")})`;
})();

/**
 * The invitation as a printed ticket: deep wine card, brass hairline, big
 * date and a perforated stub you tear off (swipe right, or tap) to open it.
 * Always dark - like a real card - in both themes.
 */
export function InvitationTicket({
  organizerName,
  title,
  theme,
  startsAt,
  location,
  isBlind,
  confirmed,
  limit,
  asPageTitle = false,
  children,
}: TicketProps) {
  const Title = asPageTitle ? "h1" : "h2";
  const reduce = useReducedMotion();
  const date = eventDateParts(startsAt);
  const [torn, setTorn] = useState(false);
  const x = useMotionValue(0);
  const rotate = useTransform(x, [0, 200], [0, 7]);
  const passedThreshold = useRef(false);

  function tear() {
    if (torn) return;
    tick("major");
    setTorn(true);
  }

  return (
    <div className="relative">
      <motion.article
        className="relative z-10 overflow-hidden rounded-t-[1.75rem] shadow-[0_30px_80px_-30px_rgb(0_0_0/0.7)]"
        style={{ color: INK, background: CARD_BG, clipPath: torn ? TORN : undefined }}
        initial={reduce ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        {!reduce && (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 w-1/2"
            style={{
              background: "linear-gradient(100deg, transparent, rgb(255 236 200 / 0.16), transparent)",
            }}
            initial={{ x: "-120%" }}
            animate={{ x: "320%" }}
            transition={{ duration: 1.6, delay: 0.5, ease: "easeInOut" }}
          />
        )}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-2.5 top-2.5 -bottom-4 rounded-[1.35rem] border"
          style={{ borderColor: `${BRASS}55` }}
        />

        <div className="relative space-y-5 px-7 pt-8 pb-7">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1 pt-1">
              <p className="text-[0.7rem] font-medium tracking-[0.22em] uppercase" style={{ color: BRASS }}>
                Lagenabend
              </p>
              {organizerName && (
                <p className="text-sm" style={{ color: `${INK}b3` }}>
                  {organizerName} lädt ein
                </p>
              )}
            </div>
            {date && (
              <div
                className="text-center leading-none"
                aria-label={`${date.weekday}, ${date.day}. ${date.month}, ${date.time} Uhr`}
              >
                <p className="font-display text-5xl">{date.day}</p>
                <p className="mt-1 text-[0.7rem] font-semibold tracking-[0.2em]" style={{ color: BRASS }}>
                  {date.month}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Title className="text-[2.6rem] leading-[1] text-balance">{title}</Title>
            {theme && (
              <p className="text-[0.95rem] leading-snug" style={{ color: `${INK}b3` }}>
                {theme}
              </p>
            )}
          </div>

          {(date || location) && (
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
              {date && (
                <span>
                  {date.weekday} · {date.time} Uhr
                </span>
              )}
              {location && (
                <span className="inline-flex items-center gap-1.5">
                  <PinIcon className="size-4" style={{ color: BRASS }} /> {location}
                </span>
              )}
            </div>
          )}
        </div>
      </motion.article>

      <AnimatePresence initial={false}>
        {!torn && (
          <motion.div
            key="stub"
            className="relative z-20 touch-pan-y"
            style={{ x, rotate, originX: 0, originY: 0 }}
            drag={reduce ? false : "x"}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={{ left: 0, right: 0.9 }}
            onDrag={(_, info) => {
              const past = info.offset.x > TEAR_DISTANCE;
              if (past !== passedThreshold.current) {
                passedThreshold.current = past;
                if (past) tick("medium");
              }
            }}
            onDragEnd={(_, info) => {
              if (info.offset.x > TEAR_DISTANCE || info.velocity.x > 500) tear();
            }}
            exit={{
              x: "115%",
              y: 90,
              rotate: 20,
              opacity: 0,
              transition: { duration: reduce ? 0 : 0.55, ease: [0.4, 0, 1, 1] },
            }}
          >
            {/* Perforation with notches */}
            <div aria-hidden className="relative h-0">
              <span className="absolute -top-3 -left-3 z-20 size-6 rounded-full bg-bg" />
              <span className="absolute -top-3 -right-3 z-20 size-6 rounded-full bg-bg" />
              <span
                className="absolute inset-x-6 -top-px z-20 border-t-2 border-dashed"
                style={{ borderColor: `${BRASS}55` }}
              />
            </div>
            <div
              className="rounded-b-[1.75rem] px-7 pt-5 pb-4 shadow-[0_30px_60px_-30px_rgb(0_0_0/0.7)]"
              style={{ color: INK, background: STUB_BG }}
            >
              <dl className="grid grid-cols-3 text-center">
                <Stub label="Format" value={isBlind ? "Blind" : "Offen"} />
                <Stub label="Zusagen" value={String(confirmed)} />
                <Stub label="Frei" value={limit ? String(Math.max(0, limit - confirmed)) : "∞"} />
              </dl>
              <button
                type="button"
                onClick={tear}
                className="mt-4 flex h-11 w-full items-center justify-center gap-2 text-sm font-medium"
                style={{ color: BRASS }}
              >
                Zum Öffnen abreißen
                <motion.span
                  aria-hidden
                  animate={reduce ? undefined : { x: [0, 8, 0] }}
                  transition={{ duration: 1.4, repeat: Infinity, repeatDelay: 1.6, ease: "easeInOut" }}
                >
                  <ArrowRightIcon className="size-4" />
                </motion.span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {torn && (
          <motion.div
            key="inside"
            className="-mt-2 overflow-hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            transition={{ duration: reduce ? 0 : 0.55, delay: reduce ? 0 : 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="rounded-b-[1.75rem] border border-t-0 border-border bg-surface px-5 pt-7 pb-5">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Stub({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <dt className="text-[0.65rem] tracking-[0.18em] uppercase" style={{ color: `${INK}80` }}>
        {label}
      </dt>
      <dd className="font-display text-2xl">{value}</dd>
    </div>
  );
}
