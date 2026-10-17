"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { TextField } from "@/components/ui/field";
import { addCost, deleteCost } from "@/lib/events/api";
import { splitCosts, wineTitle } from "@/lib/events/derive";
import type { EventData } from "@/lib/events/types";

const euro = (n: number) => n.toLocaleString("de-DE", { style: "currency", currency: "EUR" });

/** In the background of an evening: who paid what, who owes whom. */
export function CostsPanel({
  data,
  myParticipantId,
  isOrganizer,
  onChange,
}: {
  data: EventData;
  myParticipantId: string | undefined;
  isOrganizer: boolean;
  onChange: () => Promise<void>;
}) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState<string | null>(myParticipantId ?? null);
  const [busy, setBusy] = useState(false);
  const split = splitCosts(data.costs, data.participants);
  const name = (id: string | null) => data.participants.find((p) => p.id === id)?.name ?? "–";
  const parsed = Number(amount.replace(",", "."));
  const valid = description.trim().length > 0 && amount.trim() !== "" && !Number.isNaN(parsed) && parsed >= 0;

  // Bottles with a price and a "brought by" that aren't in the list yet.
  const fromGlasses = data.secrets.filter(
    (s) => s.price && s.broughtBy && !data.costs.some((c) => c.glassId === s.glassId),
  );

  async function add() {
    if (!valid) return;
    setBusy(true);
    await addCost(data.event.id, { paidBy, description, amount: parsed }).catch(() => null);
    setDescription("");
    setAmount("");
    await onChange();
    setBusy(false);
  }

  return (
    <div className="space-y-5">
      <Card className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h3 className="text-xl">Ausgaben</h3>
          <span className="font-display text-2xl tabular-nums">{euro(split.total)}</span>
        </div>
        {data.costs.length === 0 ? (
          <p className="text-sm text-muted">Noch nichts eingetragen.</p>
        ) : (
          <ul className="divide-y divide-border text-sm">
            {data.costs.map((c) => (
              <li key={c.id} className="flex items-center gap-3 py-2">
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{c.description}</span>
                  <span className="text-xs text-muted">bezahlt von {name(c.paidBy)}</span>
                </span>
                <span className="tabular-nums">{euro(c.amount)}</span>
                {(isOrganizer || c.paidBy === myParticipantId) && (
                  <button
                    type="button"
                    aria-label="Ausgabe löschen"
                    className="size-8 rounded-full text-muted hover:bg-surface-2"
                    onClick={async () => {
                      await deleteCost(c.id).catch(() => null);
                      await onChange();
                    }}
                  >
                    ✕
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
        {isOrganizer && fromGlasses.length > 0 && (
          <Button
            variant="ghost"
            block
            onClick={async () => {
              setBusy(true);
              for (const s of fromGlasses) {
                const glass = data.glasses.find((g) => g.id === s.glassId);
                await addCost(data.event.id, {
                  paidBy: s.broughtBy,
                  description: `Glas ${glass?.number}: ${wineTitle(s.wine)}`,
                  amount: s.price!,
                  glassId: s.glassId,
                }).catch(() => null);
              }
              await onChange();
              setBusy(false);
            }}
          >
            {fromGlasses.length} {fromGlasses.length === 1 ? "Flasche" : "Flaschen"} aus den Gläsern
            übernehmen
          </Button>
        )}
      </Card>

      <Card className="space-y-3">
        <h3 className="text-xl">Ausgabe eintragen</h3>
        <TextField
          label="Wofür"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="z. B. Brot & Käse"
        />
        <TextField
          label="Betrag (€)"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="z. B. 18,50"
        />
        <div className="space-y-2">
          <p className="text-sm font-medium">Bezahlt von</p>
          <div className="flex flex-wrap gap-2">
            {data.participants
              .filter((p) => p.rsvp === "yes")
              .map((p) => (
                <Chip key={p.id} selected={paidBy === p.id} onClick={() => setPaidBy(p.id)}>
                  {p.name}
                </Chip>
              ))}
          </div>
        </div>
        <Button block onClick={add} loading={busy} disabled={!valid || !paidBy}>
          Eintragen
        </Button>
      </Card>

      {split.total > 0 && (
        <Card className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h3 className="text-xl">Wer schuldet wem</h3>
            <span className="text-sm text-muted tabular-nums">
              {euro(split.share)} pro Person ({split.people.length})
            </span>
          </div>
          {split.transfers.length === 0 ? (
            <p className="text-sm text-muted">Alles ausgeglichen.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {split.transfers.map((t) => (
                <li
                  key={`${t.from.id}-${t.to.id}`}
                  className={`flex items-center justify-between rounded-control px-3 py-2 ${
                    t.from.id === myParticipantId ? "bg-accent/10" : "bg-surface-2/60"
                  }`}
                >
                  <span>
                    {t.from.id === myParticipantId ? "Du" : t.from.name} →{" "}
                    {t.to.id === myParticipantId ? "dir" : t.to.name}
                  </span>
                  <span className="font-medium tabular-nums">{euro(t.amount)}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="text-xs text-muted">
            Geteilt durch alle, die zugesagt haben. Bezahlt wird wie gewohnt untereinander.
          </p>
        </Card>
      )}
    </div>
  );
}
