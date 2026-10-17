"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, Eyebrow } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { TickDial } from "@/components/ui/tick-dial";
import type { CellarData, CellarWine } from "@/lib/cellar/types";
import { drinkStatus, DRINK_STATUS_LABEL, euro, valueAt, type DrinkStatus } from "@/lib/cellar/value";
import { cn } from "@/lib/cn";
import { tick } from "@/lib/haptics";
import { DrinkBadge } from "./drink-badge";

const YEAR = new Date().getFullYear();
const ORDER: DrinkStatus[] = ["ready", "urgent", "wait"];

/** "Was ist 2028 perfekt?" - swipe through the years. */
export function DrinkTimeline({ data, onOpen }: { data: CellarData; onOpen: (item: CellarWine) => void }) {
  const [year, setYear] = useState(YEAR);
  const inCellar = data.items.filter((i) => i.quantity > 0 && (i.drinkFrom || i.drinkUntil));
  const groups = ORDER.map((status) => ({
    status,
    items: inCellar.filter((i) => drinkStatus(i, year) === status),
  }));
  const past = inCellar.filter((i) => i.drinkUntil && year > i.drinkUntil);
  const ready = groups.find((g) => g.status === "ready")!.items.reduce((s, i) => s + i.quantity, 0);

  return (
    <section className="space-y-3">
      <h2 className="text-2xl">Trinkreife-Zeitstrahl</h2>
      <TickDial
        label="Jahr"
        value={year}
        onChange={setYear}
        min={YEAR}
        max={YEAR + 20}
        step={1}
        majorEvery={5}
        describe={() => `${ready} ${ready === 1 ? "Flasche" : "Flaschen"} perfekt`}
      />
      <Card className="space-y-4" aria-live="polite">
        {groups.map(({ status, items }) =>
          items.length ? (
            <div key={status} className="space-y-2">
              <DrinkBadge status={status} />
              <ul className="space-y-1">
                {items.map((i) => (
                  <li key={i.id}>
                    <button
                      type="button"
                      onClick={() => onOpen(i)}
                      className="flex w-full justify-between gap-3 py-1 text-left text-sm"
                    >
                      <span className="truncate">
                        {i.name || i.producer} <span className="text-muted">{i.vintage}</span>
                      </span>
                      <span className="shrink-0 text-muted tabular-nums">× {i.quantity}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null,
        )}
        {past.length > 0 && (
          <p className="text-sm text-muted">
            {past.length} {past.length === 1 ? "Wein ist" : "Weine sind"} {year} über dem Trinkfenster –
            vorher trinken!
          </p>
        )}
        {!inCellar.length && (
          <p className="text-sm text-muted">Trag Trinkfenster ein, dann erscheint hier dein Plan.</p>
        )}
      </Card>
    </section>
  );
}

/** The rack as a grid: shelves × compartments × rows. Tap a slot to see what's in it. */
export function ShelfGrid({ data, onOpen }: { data: CellarData; onOpen: (item: CellarWine) => void }) {
  const placed = data.items.filter((i) => i.quantity > 0 && i.shelf);
  const shelves = [...new Set(placed.map((i) => i.shelf!))].sort();
  const [shelf, setShelf] = useState<string | null>(shelves[0] ?? null);
  const [slot, setSlot] = useState<string | null>(null);
  if (!shelves.length) {
    return (
      <section className="space-y-3">
        <h2 className="text-2xl">Kellerregal</h2>
        <p className="rounded-card border border-dashed border-border p-6 text-center text-sm text-muted">
          Gib beim Einlagern Regal, Fach und Reihe an – dann siehst du hier, wo welche Flasche liegt.
        </p>
      </section>
    );
  }
  const current = shelf ?? shelves[0];
  const onShelf = placed.filter((i) => i.shelf === current);
  const compartments = Math.max(2, ...onShelf.map((i) => Number(i.compartment) || 1));
  const rowsCount = Math.max(2, ...onShelf.map((i) => Number(i.row) || 1));
  const slotItems = (c: number, r: number) =>
    onShelf.filter((i) => Number(i.compartment) === c && Number(i.row) === r);
  const selected = slot ? onShelf.filter((i) => `${i.compartment}-${i.row}` === slot) : [];

  return (
    <section className="space-y-3">
      <h2 className="text-2xl">Kellerregal</h2>
      <div className="flex gap-2">
        {shelves.map((s) => (
          <Chip
            key={s}
            selected={s === current}
            onClick={() => {
              tick("minor");
              setShelf(s);
              setSlot(null);
            }}
          >
            Regal {s}
          </Chip>
        ))}
      </div>
      <Card className="space-y-3">
        <div
          className="grid gap-2"
          style={{ gridTemplateColumns: `2.5rem repeat(${compartments}, minmax(0, 1fr))` }}
        >
          <span />
          {Array.from({ length: compartments }, (_, c) => (
            <span key={c} className="text-center text-xs text-muted">
              Fach {c + 1}
            </span>
          ))}
          {Array.from({ length: rowsCount }, (_, r) => (
            <Row key={r}>
              <span className="flex items-center text-xs text-muted">Reihe {r + 1}</span>
              {Array.from({ length: compartments }, (_, c) => {
                const items = slotItems(c + 1, r + 1);
                const bottles = items.reduce((s, i) => s + i.quantity, 0);
                const key = `${c + 1}-${r + 1}`;
                return (
                  <button
                    key={key}
                    type="button"
                    disabled={!bottles}
                    aria-label={`Fach ${c + 1}, Reihe ${r + 1}: ${bottles} Flaschen`}
                    aria-pressed={slot === key}
                    onClick={() => {
                      tick("minor");
                      setSlot(slot === key ? null : key);
                    }}
                    className={cn(
                      "flex aspect-square flex-wrap content-center items-center justify-center gap-0.5 rounded-control border p-1 transition",
                      slot === key ? "border-accent bg-accent/10" : "border-border bg-surface-2/50",
                      !bottles && "opacity-40",
                    )}
                  >
                    {Array.from({ length: Math.min(bottles, 12) }, (_, b) => (
                      <span
                        key={b}
                        className={cn(
                          "size-2.5 rounded-full",
                          items[0]?.color === "red" ? "bg-wine" : "bg-[#c9b26a]",
                        )}
                        aria-hidden
                      />
                    ))}
                  </button>
                );
              })}
            </Row>
          ))}
        </div>
        <AnimatePresence mode="wait">
          {selected.length > 0 && (
            <motion.ul
              key={slot}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-1 border-t border-border pt-3"
            >
              {selected.map((i) => (
                <li key={i.id}>
                  <button
                    type="button"
                    onClick={() => onOpen(i)}
                    className="flex w-full justify-between gap-3 py-1 text-left text-sm"
                  >
                    <span className="truncate">
                      {i.name || i.producer} <span className="text-muted">{i.vintage}</span>
                    </span>
                    <span className="shrink-0 tabular-nums">× {i.quantity}</span>
                  </button>
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </Card>
    </section>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

type Occasion = "alltag" | "besonders" | "muss-weg";
const OCCASIONS: { value: Occasion; label: string }[] = [
  { value: "alltag", label: "Einfach so" },
  { value: "besonders", label: "Besonderer Abend" },
  { value: "muss-weg", label: "Muss weg" },
];

/** Suggests a bottle for tonight - drinkable ones only, picked by occasion. */
export function TonightPicker({ data, onOpen }: { data: CellarData; onOpen: (item: CellarWine) => void }) {
  const [occasion, setOccasion] = useState<Occasion>("alltag");
  const [skip, setSkip] = useState(0);
  const drinkable = data.items.filter((i) => i.quantity > 0 && drinkStatus(i) !== "wait");
  const ranked = [...drinkable].sort((a, b) => {
    if (occasion === "muss-weg") return (a.drinkUntil ?? 9999) - (b.drinkUntil ?? 9999);
    const va = valueAt(a, data.valuations);
    const vb = valueAt(b, data.valuations);
    return occasion === "besonders" ? vb - va : va - vb;
  });
  const pick = ranked.length ? ranked[skip % ranked.length] : null;

  return (
    <Card className="space-y-4">
      <Eyebrow>Was trinke ich heute?</Eyebrow>
      <div className="flex flex-wrap gap-2">
        {OCCASIONS.map((o) => (
          <Chip
            key={o.value}
            selected={occasion === o.value}
            onClick={() => {
              tick("minor");
              setOccasion(o.value);
              setSkip(0);
            }}
          >
            {o.label}
          </Chip>
        ))}
      </div>
      <AnimatePresence mode="wait">
        {pick ? (
          <motion.div
            key={`${pick.id}-${occasion}`}
            initial={{ opacity: 0, rotateX: -20, y: 8 }}
            animate={{ opacity: 1, rotateX: 0, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-2 rounded-control bg-surface-2/70 p-4"
            aria-live="polite"
          >
            <p className="font-display text-2xl leading-tight">{pick.name || pick.producer}</p>
            <p className="text-sm text-muted">
              {pick.producer} · {pick.vintage} · {euro.format(valueAt(pick, data.valuations))}
            </p>
            <p className="text-sm">
              {occasion === "muss-weg"
                ? `Trinkfenster bis ${pick.drinkUntil ?? "?"} – jetzt ist ein guter Moment.`
                : occasion === "besonders"
                  ? "Dein wertvollster trinkreifer Wein. Wenn nicht heute, wann dann?"
                  : `${DRINK_STATUS_LABEL[drinkStatus(pick)]} – und kein Wein, um den es schade wäre.`}
            </p>
          </motion.div>
        ) : (
          <p className="text-sm text-muted">Gerade ist nichts trinkreif – Geduld zahlt sich aus.</p>
        )}
      </AnimatePresence>
      {pick && (
        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={() => setSkip((s) => s + 1)}>
            Anderer Vorschlag
          </Button>
          <Button onClick={() => onOpen(pick)}>Ansehen</Button>
        </div>
      )}
    </Card>
  );
}
