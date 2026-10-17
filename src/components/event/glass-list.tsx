"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Pill } from "@/components/ui/chip";
import { deleteGlass, reorderGlasses, saveGlass } from "@/lib/events/api";
import { suggestOrder, wineDetails, wineTitle, type OrderSuggestion } from "@/lib/events/derive";
import type { Catalog, EventData } from "@/lib/events/types";
import { tick } from "@/lib/haptics";
import { GlassSheet, type GlassDraft } from "./glass-sheet";

const euro = (n: number) => n.toLocaleString("de-DE", { style: "currency", currency: "EUR" });

/** Organizer: the bottles of the evening, one per glass, in serving order. */
export function GlassList({
  data,
  catalog,
  onChange,
}: {
  data: EventData;
  catalog: Catalog | null;
  onChange: () => Promise<void>;
}) {
  const [draft, setDraft] = useState<GlassDraft | null>(null);
  const [suggestion, setSuggestion] = useState<OrderSuggestion | null>(null);
  const [busy, setBusy] = useState(false);
  const started = data.glasses.some((g) => g.status !== "pending");
  const nextNumber = Math.max(0, ...data.glasses.map((g) => g.number)) + 1;

  async function move(index: number, by: number) {
    const order = data.glasses.map((g) => g.id);
    const [item] = order.splice(index, 1);
    order.splice(index + by, 0, item);
    tick("minor");
    setBusy(true);
    await reorderGlasses(data.event.id, order).catch(() => null);
    await onChange();
    setBusy(false);
  }

  async function applySuggestion() {
    if (!suggestion) return;
    setBusy(true);
    await reorderGlasses(data.event.id, suggestion.order).catch(() => null);
    tick("medium");
    setSuggestion(null);
    await onChange();
    setBusy(false);
  }

  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-2xl">Flaschen & Gläser</h2>
        <span className="text-sm text-muted">{data.glasses.length} Gläser</span>
      </div>

      {data.glasses.length === 0 && (
        <p className="text-sm text-muted">
          Leg für jede Flasche ein Glas an. Die Gäste sehen nur die Nummern – welcher Wein drin ist, weißt nur
          du.
        </p>
      )}

      <ol className="space-y-2">
        <AnimatePresence initial={false}>
          {data.glasses.map((glass, index) => {
            const secret = data.secrets.find((s) => s.glassId === glass.id);
            const brought = data.participants.find((p) => p.id === secret?.broughtBy);
            return (
              <motion.li
                key={glass.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-3 rounded-control border border-border bg-surface p-3"
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-curtain font-display text-xl text-accent">
                  {glass.number}
                </span>
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left"
                  onClick={() => glass.status !== "revealed" && setDraft({ number: glass.number, secret })}
                >
                  <span className="block truncate font-medium">{wineTitle(secret?.wine)}</span>
                  <span className="block truncate text-sm text-muted">
                    {wineDetails(secret?.wine, catalog) || "Antippen, um einen Wein zuzuordnen"}
                  </span>
                  <span className="mt-1.5 flex flex-wrap gap-1.5">
                    {secret?.isPirate && <Pill className="bg-wine text-wine-fg">Pirat</Pill>}
                    {secret?.price != null && <Pill>{euro(secret.price)}</Pill>}
                    {brought && <Pill>von {brought.name}</Pill>}
                    {glass.status !== "pending" && <Pill>{STATUS[glass.status]}</Pill>}
                  </span>
                </button>
                {!started && (
                  <div className="flex shrink-0 flex-col">
                    <MoveButton
                      label="Nach oben"
                      disabled={busy || index === 0}
                      onClick={() => move(index, -1)}
                    >
                      ↑
                    </MoveButton>
                    <MoveButton
                      label="Nach unten"
                      disabled={busy || index === data.glasses.length - 1}
                      onClick={() => move(index, 1)}
                    >
                      ↓
                    </MoveButton>
                  </div>
                )}
                {!started && (
                  <button
                    type="button"
                    aria-label={`Glas ${glass.number} entfernen`}
                    className="size-9 shrink-0 rounded-full text-muted hover:bg-surface-2"
                    onClick={async () => {
                      if (!window.confirm(`Glas ${glass.number} entfernen?`)) return;
                      await deleteGlass(glass.id).catch(() => null);
                      await onChange();
                    }}
                  >
                    ✕
                  </button>
                )}
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ol>

      {!started && (
        <div className="grid gap-2">
          <Button variant="secondary" block onClick={() => setDraft({ number: nextNumber })}>
            + Glas {nextNumber} hinzufügen
          </Button>
          {data.glasses.length >= 2 && (
            <Button
              variant="ghost"
              block
              onClick={() => {
                tick("minor");
                setSuggestion(suggestOrder(data.glasses, data.secrets));
              }}
            >
              ✦ Schlag mir eine Reihenfolge vor
            </Button>
          )}
        </div>
      )}

      <AnimatePresence>
        {suggestion && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="space-y-3 rounded-control border border-accent/40 bg-accent/10 p-4"
            role="status"
          >
            <p className="text-sm leading-relaxed">
              <b className="font-medium text-accent">✦ Vorschlag</b> {suggestion.reason}
            </p>
            {suggestion.changed && (
              <ol className="flex flex-wrap gap-1.5 text-xs">
                {suggestion.order.map((id, i) => {
                  const glass = data.glasses.find((g) => g.id === id)!;
                  return (
                    <li key={id} className="rounded-full bg-surface px-2.5 py-1">
                      {i + 1}. {wineTitle(data.secrets.find((s) => s.glassId === id)?.wine)}
                      <span className="text-muted"> (bisher {glass.number})</span>
                    </li>
                  );
                })}
              </ol>
            )}
            <p className="text-xs text-muted">Nur ein Vorschlag – du kannst danach alles frei ändern.</p>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="ghost" onClick={() => setSuggestion(null)}>
                Verwerfen
              </Button>
              <Button onClick={applySuggestion} loading={busy} disabled={!suggestion.changed}>
                Übernehmen
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <GlassSheet
        draft={draft}
        eventId={data.event.id}
        participants={data.participants}
        pirateMode={data.event.pirateMode}
        catalog={catalog}
        onClose={() => setDraft(null)}
        onSave={async (eventId, glass) => {
          await saveGlass(eventId, glass);
          tick("medium");
          await onChange();
        }}
      />
    </section>
  );
}

const STATUS = { pending: "", open: "läuft", closed: "Abgabe zu", revealed: "aufgedeckt" } as const;

function MoveButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex size-8 items-center justify-center rounded-full text-muted hover:bg-surface-2 disabled:opacity-25"
    >
      {children}
    </button>
  );
}
