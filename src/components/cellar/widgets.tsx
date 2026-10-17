"use client";

import { AnimatePresence, motion } from "motion/react";
import { Fragment, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, Eyebrow } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { TickDial } from "@/components/ui/tick-dial";
import type { CellarData, CellarWine } from "@/lib/cellar/types";
import { drinkStatus, DRINK_STATUS_LABEL, euro, valueAt, type DrinkStatus } from "@/lib/cellar/value";
import { tick } from "@/lib/haptics";
import { DrinkBadge } from "./drink-badge";
import { RackEditor } from "./rack-editor";

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

/** Each named rack as a grid of compartments × rows. Tap a slot to see what's in it. */
export function ShelfGrid({
  data,
  onOpen,
  onAddRack,
  onUpdateRack,
}: {
  data: CellarData;
  onOpen: (item: CellarWine) => void;
  onAddRack: (name: string, compartments: number, rows: number) => Promise<string | null>;
  onUpdateRack: (
    id: string,
    changes: { name: string; compartments: number; rows: number },
  ) => Promise<boolean>;
}) {
  const [rackId, setRackId] = useState<string | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [editing, setEditing] = useState<"new" | "edit" | null>(null);
  const racks = data.racks;
  const rack = racks.find((r) => r.id === rackId) ?? racks[0] ?? null;
  const inRack = rack ? data.items.filter((i) => i.quantity > 0 && i.rackId === rack.id) : [];
  const unplaced = data.items.filter((i) => i.quantity > 0 && !i.rackId).reduce((s, i) => s + i.quantity, 0);
  const slotItems = (c: number, r: number) =>
    inRack.filter((i) => Number(i.compartment) === c && Number(i.row) === r);
  const selected = slot ? inRack.filter((i) => `${i.compartment}-${i.row}` === slot) : [];
  const loose = inRack.filter((i) => !i.compartment || !i.row);

  return (
    <section className="space-y-3">
      <h2 className="text-2xl">Kellerregal</h2>
      <div className="-mx-5 flex [scrollbar-width:none] gap-2 overflow-x-auto px-5 pb-1">
        {racks.map((r) => (
          <Chip
            key={r.id}
            selected={r.id === rack?.id}
            className="shrink-0"
            onClick={() => {
              tick("minor");
              setRackId(r.id);
              setSlot(null);
              setEditing(null);
            }}
          >
            {r.name}
          </Chip>
        ))}
        <Chip className="shrink-0 border-dashed" onClick={() => setEditing("new")}>
          + Regal
        </Chip>
      </div>

      {editing && (
        <RackEditor
          key={editing === "edit" ? rack?.id : "new"}
          rack={editing === "edit" ? (rack ?? undefined) : undefined}
          onCancel={() => setEditing(null)}
          onSave={async (values) => {
            if (editing === "edit" && rack) {
              if (await onUpdateRack(rack.id, values)) setEditing(null);
            } else {
              const id = await onAddRack(values.name, values.compartments, values.rows);
              if (id) {
                tick("medium");
                setRackId(id);
                setEditing(null);
              }
            }
          }}
        />
      )}

      {!rack ? (
        <p className="rounded-card border border-dashed border-border p-6 text-center text-sm text-muted">
          Leg dein erstes Regal an – z. B. „Keller“ oder „Weinkühlschrank“ – und gib beim Einlagern Fach und
          Reihe an.
        </p>
      ) : (
        <Card className="space-y-3">
          <div className="flex items-baseline justify-between gap-3">
            <p className="truncate font-display text-xl">{rack.name}</p>
            <button type="button" onClick={() => setEditing("edit")} className="shrink-0 text-sm text-accent">
              Bearbeiten
            </button>
          </div>
          <RackView
            key={rack.id}
            compartments={rack.compartments}
            rows={rack.rows}
            slotItems={slotItems}
            selected={slot}
            onSelect={(key) => {
              tick("minor");
              setSlot(slot === key ? null : key);
            }}
          />
          <p className="text-xs text-muted">Spalten = Fächer, Zeilen = Reihen · Fach antippen</p>
          <AnimatePresence mode="wait">
            {(selected.length > 0 || (slot === null && loose.length > 0)) && (
              <motion.ul
                key={slot ?? "loose"}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-1 border-t border-border pt-3"
              >
                {slot === null && <li className="text-xs text-muted">Ohne Fach in diesem Regal:</li>}
                {(slot ? selected : loose).map((i) => (
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
      )}
      {unplaced > 0 && (
        <p className="text-xs text-muted">
          {unplaced} {unplaced === 1 ? "Flasche hat" : "Flaschen haben"} noch keinen Lagerplatz.
        </p>
      )}
    </section>
  );
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

const WOOD =
  "linear-gradient(180deg, rgb(255 255 255 / 0.04), transparent 40%), repeating-linear-gradient(90deg, rgb(0 0 0 / 0.06) 0 2px, transparent 2px 9px), #2a1418";
const BRASS = "#d1ad72";

/** Front view of a wooden wine rack: every compartment shows the bottle bases lying in it. */
function RackView({
  compartments,
  rows,
  slotItems,
  selected,
  onSelect,
}: {
  compartments: number;
  rows: number;
  slotItems: (c: number, r: number) => CellarWine[];
  selected: string | null;
  onSelect: (key: string) => void;
}) {
  return (
    <div className="-mx-1 overflow-x-auto px-1 pb-1">
      <motion.div
        className="relative min-w-fit rounded-[1.25rem] p-2.5 shadow-[inset_0_2px_10px_rgb(0_0_0/0.5),0_14px_30px_-18px_rgb(0_0_0/0.7)]"
        style={{ background: WOOD }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-1 rounded-[1rem] border"
          style={{ borderColor: `${BRASS}33` }}
        />
        <div
          className="relative grid gap-1.5"
          style={{ gridTemplateColumns: `1.1rem repeat(${compartments}, minmax(3.25rem, 1fr))` }}
        >
          <span aria-hidden />
          {Array.from({ length: compartments }, (_, c) => (
            <span
              key={c}
              className="pb-0.5 text-center text-[0.65rem] font-medium"
              style={{ color: `${BRASS}b0` }}
            >
              {c + 1}
            </span>
          ))}
          {Array.from({ length: rows }, (_, r) => (
            <Fragment key={r}>
              <span className="flex items-center text-[0.65rem] font-medium" style={{ color: `${BRASS}b0` }}>
                {r + 1}
              </span>
              {Array.from({ length: compartments }, (_, c) => {
                const items = slotItems(c + 1, r + 1);
                const bottles = items.reduce((sum, i) => sum + i.quantity, 0);
                const key = `${c + 1}-${r + 1}`;
                const active = selected === key;
                return (
                  <motion.button
                    key={key}
                    type="button"
                    disabled={!bottles}
                    aria-label={`Fach ${c + 1}, Reihe ${r + 1}: ${bottles} ${bottles === 1 ? "Flasche" : "Flaschen"}`}
                    aria-pressed={active}
                    onClick={() => onSelect(key)}
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: active ? 1.06 : 1 }}
                    whileTap={bottles ? { scale: 0.96 } : undefined}
                    transition={{
                      opacity: { delay: (r * compartments + c) * 0.025, duration: 0.25 },
                      scale: { type: "spring", damping: 20, stiffness: 320 },
                    }}
                    className="relative flex aspect-square items-center justify-center rounded-[0.85rem]"
                    style={{
                      background: "radial-gradient(80% 80% at 50% 40%, #12070a, #1d0d11 70%)",
                      boxShadow: active
                        ? `inset 0 0 0 1.5px ${BRASS}, 0 0 18px -4px ${BRASS}`
                        : "inset 0 3px 8px rgb(0 0 0 / 0.75), inset 0 -1px 0 rgb(255 255 255 / 0.05)",
                    }}
                  >
                    <BottleEnds
                      count={bottles}
                      red={items[0]?.color === "red"}
                      delay={(r * compartments + c) * 0.025}
                    />
                    {bottles > 1 && (
                      <span
                        className="absolute right-1 bottom-0.5 text-[0.6rem] font-semibold tabular-nums"
                        style={{ color: BRASS }}
                      >
                        {bottles}
                      </span>
                    )}
                  </motion.button>
                );
              })}
            </Fragment>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

// Bottle bases as seen lying in the rack: up to 7 in a honeycomb.
const SPOTS: [number, number][][] = [
  [],
  [[50, 50]],
  [
    [34, 50],
    [66, 50],
  ],
  [
    [34, 36],
    [66, 36],
    [50, 66],
  ],
  [
    [34, 34],
    [66, 34],
    [34, 66],
    [66, 66],
  ],
  [
    [30, 32],
    [70, 32],
    [50, 50],
    [30, 68],
    [70, 68],
  ],
  [
    [28, 34],
    [50, 34],
    [72, 34],
    [28, 66],
    [50, 66],
    [72, 66],
  ],
  [
    [50, 50],
    [50, 22],
    [50, 78],
    [26, 36],
    [74, 36],
    [26, 64],
    [74, 64],
  ],
];

function BottleEnds({ count, red, delay }: { count: number; red: boolean; delay: number }) {
  const spots = SPOTS[Math.min(count, 7)];
  const size = count <= 1 ? 54 : count <= 4 ? 36 : 28;
  const glass = red
    ? "radial-gradient(circle at 38% 34%, #8a3a50 0%, #4a1022 38%, #1c050c 75%)"
    : "radial-gradient(circle at 38% 34%, #b9a868 0%, #4f5a26 40%, #1a200c 78%)";
  if (!count) {
    return (
      <span
        aria-hidden
        className="size-[42%] rounded-full border border-dashed"
        style={{ borderColor: `${BRASS}2e` }}
      />
    );
  }
  return (
    <span aria-hidden className="absolute inset-0">
      {spots.map(([x, y], i) => (
        <motion.span
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${x}%`,
            top: `${y}%`,
            width: `${size}%`,
            height: `${size}%`,
            translate: "-50% -50%",
            background: glass,
            boxShadow: "0 2px 3px rgb(0 0 0 / 0.6), inset 0 0 0 1px rgb(255 255 255 / 0.08)",
          }}
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: delay + 0.12 + i * 0.04, type: "spring", damping: 16, stiffness: 300 }}
        >
          {/* the punt in the middle of the base */}
          <span className="absolute inset-[32%] rounded-full bg-black/45 shadow-[inset_0_1px_2px_rgb(255_255_255/0.15)]" />
        </motion.span>
      ))}
    </span>
  );
}
