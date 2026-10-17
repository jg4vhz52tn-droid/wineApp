"use client";

import { motion, useReducedMotion } from "motion/react";
import { PinIcon } from "@/components/ui/icons";
import { eventDateParts } from "@/lib/format";

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
};

const INK = "#f4ede5";
const BRASS = "#d1ad72";

/**
 * The invitation as a printed ticket: deep wine card, brass hairline, big
 * date, perforated stub. Always dark - like a real card - in both themes.
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
}: TicketProps) {
  const Title = asPageTitle ? "h1" : "h2";
  const reduce = useReducedMotion();
  const date = eventDateParts(startsAt);

  return (
    <motion.article
      className="relative overflow-hidden rounded-[1.75rem] shadow-[0_30px_80px_-30px_rgb(0_0_0/0.7)]"
      style={{
        color: INK,
        background:
          "radial-gradient(120% 70% at 0% 0%, #6e1b3a 0%, transparent 60%), radial-gradient(90% 60% at 100% 100%, #3d1a2d 0%, transparent 70%), #170b11",
      }}
      initial={reduce ? false : { opacity: 0, y: 16, rotateX: 8 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* One-time foil sweep */}
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
        className="pointer-events-none absolute inset-2.5 rounded-[1.35rem] border"
        style={{ borderColor: `${BRASS}55` }}
      />

      <div className="relative space-y-5 px-7 pt-8 pb-6">
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

      {/* Perforation with notches */}
      <div aria-hidden className="relative h-6">
        <span className="absolute top-1/2 -left-3 size-6 -translate-y-1/2 rounded-full bg-bg" />
        <span className="absolute top-1/2 -right-3 size-6 -translate-y-1/2 rounded-full bg-bg" />
        <span
          className="absolute inset-x-6 top-1/2 border-t-2 border-dashed"
          style={{ borderColor: `${BRASS}40` }}
        />
      </div>

      <dl className="relative grid grid-cols-3 px-7 pt-3 pb-7 text-center">
        <Stub label="Format" value={isBlind ? "Blind" : "Offen"} />
        <Stub label="Zusagen" value={String(confirmed)} />
        <Stub label="Frei" value={limit ? String(Math.max(0, limit - confirmed)) : "∞"} />
      </dl>
    </motion.article>
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
