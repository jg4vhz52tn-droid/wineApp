"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Bottle } from "@/components/tasting/bottle";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/card";
import { TextField } from "@/components/ui/field";
import { Sheet } from "@/components/ui/sheet";
import { bottleShapeFor } from "@/config/bottles";
import type { CellarData, CellarWine } from "@/lib/cellar/types";
import { drinkStatus, euro, euroCents, isEstimated, percent, valueAt } from "@/lib/cellar/value";
import { cn } from "@/lib/cn";
import { tick } from "@/lib/haptics";
import { StepButton } from "./add-bottles";
import { location } from "./cellar-list";
import { DrinkBadge } from "./drink-badge";
import { ItemChart } from "./item-chart";
import { PriceCheck } from "./price-check";
import { marketSeries, usePriceHistory } from "@/lib/prices";

const dateFmt = new Intl.DateTimeFormat("de-DE", { day: "numeric", month: "short", year: "numeric" });
const SOURCE: Record<string, string> = {
  manual: "selbst eingetragen",
  estimate: "Schätzung",
  ai: "KI-Recherche",
  market: "Marktpreis",
};

export function BottleSheet({
  item,
  data,
  onClose,
  onSetValue,
  onOpenBottles,
  onSetPurchasePrice,
}: {
  item: CellarWine | null;
  data: CellarData;
  onClose: () => void;
  onSetValue: (id: string, value: number) => Promise<boolean>;
  onOpenBottles: (id: string, count: number, value: number) => Promise<boolean>;
  onSetPurchasePrice: (id: string, price: number | null) => Promise<boolean>;
}) {
  return (
    <Sheet open={!!item} onClose={onClose} title={item ? item.name || item.producer : ""}>
      {item && (
        <Content
          key={item.id}
          item={item}
          data={data}
          onSetValue={onSetValue}
          onOpenBottles={onOpenBottles}
          onSetPurchasePrice={onSetPurchasePrice}
          onClose={onClose}
        />
      )}
    </Sheet>
  );
}

function Content({
  item: initial,
  data,
  onSetValue,
  onOpenBottles,
  onSetPurchasePrice,
  onClose,
}: {
  item: CellarWine;
  data: CellarData;
  onSetValue: (id: string, value: number) => Promise<boolean>;
  onOpenBottles: (id: string, count: number, value: number) => Promise<boolean>;
  onSetPurchasePrice: (id: string, price: number | null) => Promise<boolean>;
  onClose: () => void;
}) {
  const item = data.items.find((i) => i.id === initial.id) ?? initial;
  const now = valueAt(item, data.valuations);
  const estimated = isEstimated(item, data.valuations);
  const change = item.purchasePrice ? (now - item.purchasePrice) / item.purchasePrice : 0;
  const history = data.valuations
    .filter((v) => v.itemId === item.id)
    .sort((a, b) => b.date.localeCompare(a.date));
  const [value, setValue] = useState("");
  const [count, setCount] = useState(1);
  const [cheers, setCheers] = useState<number | null>(null);
  const [busy, setBusy] = useState<"value" | "open" | null>(null);
  const [chart, setChart] = useState(true);
  const [editPaid, setEditPaid] = useState(false);
  const [paid, setPaid] = useState("");
  const prices = usePriceHistory(item.vintageId);

  const parsed = value.trim() ? Number(value.replace(",", ".")) : NaN;

  async function saveValue() {
    if (Number.isNaN(parsed) || parsed < 0) return;
    setBusy("value");
    if (await onSetValue(item.id, Math.round(parsed * 100) / 100)) {
      tick("medium");
      setValue("");
    }
    setBusy(null);
  }

  async function open() {
    setBusy("open");
    const opened = count;
    if (await onOpenBottles(item.id, opened, now)) {
      tick("major");
      setCheers(item.purchasePrice !== null ? (now - item.purchasePrice) * opened : null);
      setCount(1);
    }
    setBusy(null);
  }

  return (
    <div className="space-y-5 pb-4">
      <div className="flex gap-4">
        <Bottle
          shape={bottleShapeFor(item.color)}
          label={{
            producer: item.producer,
            name: item.name || item.producer,
            vintage: item.vintage ?? undefined,
            photo: item.labelUrl,
          }}
          className="h-44 w-24 shrink-0"
        />
        <div className="min-w-0 space-y-2 pt-1">
          <p className="text-sm text-muted">
            {item.producer} · {item.vintage ?? "ohne Jahrgang"}
          </p>
          <DrinkBadge status={drinkStatus(item)} />
          <p className="text-sm">
            Trinkfenster:{" "}
            {item.drinkFrom || item.drinkUntil
              ? `${item.drinkFrom ?? "?"} – ${item.drinkUntil ?? "?"}`
              : "offen"}
          </p>
          <p className="text-sm text-muted">{location(item, data.racks)}</p>
          <p className="font-display text-3xl tabular-nums">× {item.quantity}</p>
        </div>
      </div>

      <dl className="grid grid-cols-3 gap-2 text-center">
        <button
          type="button"
          aria-expanded={editPaid}
          onClick={() => {
            tick("minor");
            setPaid(item.purchasePrice !== null ? String(item.purchasePrice).replace(".", ",") : "");
            setEditPaid(!editPaid);
          }}
          className={cn(
            "rounded-control px-2 py-2.5 transition",
            editPaid ? "bg-accent/15 ring-1 ring-accent/50" : "bg-surface-2/70",
          )}
        >
          <dt className="text-[0.65rem] leading-tight text-muted">Bezahlt ✎</dt>
          <dd className="mt-0.5 font-display text-lg tabular-nums">
            {item.purchasePrice !== null ? euro.format(item.purchasePrice) : "eintragen"}
          </dd>
        </button>
        <Box label={estimated ? "Wert (geschätzt)" : "Wert heute"} value={euro.format(now)} />
        <button
          type="button"
          aria-expanded={chart}
          onClick={() => {
            tick("minor");
            setChart(!chart);
          }}
          className={cn(
            "rounded-control px-2 py-2.5 transition",
            chart ? "bg-accent/15 ring-1 ring-accent/50" : "bg-surface-2/70",
          )}
        >
          <dt className="text-[0.65rem] leading-tight text-muted">Veränderung {chart ? "▴" : "▾"}</dt>
          <dd
            className={cn(
              "mt-0.5 font-display text-lg tabular-nums",
              change >= 0 ? "text-success" : "text-danger",
            )}
          >
            {change >= 0 ? "▲" : "▼"} {percent.format(change)}
          </dd>
        </button>
      </dl>

      <AnimatePresence initial={false}>
        {editPaid && (
          <motion.form
            key="paid"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
            onSubmit={async (e) => {
              e.preventDefault();
              const parsed = paid.trim() ? Number(paid.replace(",", ".")) : null;
              if (parsed !== null && (Number.isNaN(parsed) || parsed < 0)) return;
              if (await onSetPurchasePrice(item.id, parsed)) {
                tick("medium");
                setEditPaid(false);
              }
            }}
          >
            <div className="flex items-end gap-2 rounded-[1.75rem] bg-surface-2/70 p-4">
              <TextField
                label="Bezahlt pro Flasche (€)"
                inputMode="decimal"
                autoFocus
                value={paid}
                onChange={(e) => setPaid(e.target.value)}
                placeholder="z. B. 24,50"
                className="flex-1"
              />
              <Button type="submit" className="h-12">
                Speichern
              </Button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {chart && (
          <motion.div
            key="chart"
            initial={{ height: 0, opacity: 0, scale: 0.96 }}
            animate={{ height: "auto", opacity: 1, scale: 1 }}
            exit={{ height: 0, opacity: 0, scale: 0.96 }}
            transition={{ type: "spring", damping: 26, stiffness: 260, delay: 0.15 }}
            className="origin-top overflow-hidden"
          >
            <div className="rounded-[1.75rem] bg-surface-2/70 p-4">
              <ItemChart
                item={item}
                valuations={data.valuations}
                asOf={data.asOf}
                market={marketSeries(prices.history)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {cheers !== null && (
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-control bg-surface-2/70 p-4 text-sm"
            role="status"
          >
            <strong className="font-display text-xl">Zum Wohl! </strong>
            {cheers >= 0
              ? `Getrunken mit ${euro.format(cheers)} Wertzuwachs.`
              : `Getrunken – ${euro.format(-cheers)} unter Einkauf.`}
          </motion.p>
        )}
      </AnimatePresence>

      {item.quantity > 0 && (
        <section className="space-y-3 rounded-[1.75rem] bg-surface-2/70 p-4">
          <Eyebrow>Flasche öffnen</Eyebrow>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <StepButton label="Eine weniger" onClick={() => setCount((c) => Math.max(1, c - 1))}>
                −
              </StepButton>
              <span className="w-8 text-center font-display text-3xl tabular-nums">{count}</span>
              <StepButton label="Eine mehr" onClick={() => setCount((c) => Math.min(item.quantity, c + 1))}>
                +
              </StepButton>
            </div>
            <Button variant="wine" onClick={open} loading={busy === "open"}>
              Öffnen & genießen
            </Button>
          </div>
        </section>
      )}

      <PriceCheck
        wine={{
          vintageId: item.vintageId,
          producer: item.producer,
          name: item.name || null,
          vintage: item.vintage,
        }}
        history={prices.history}
        onFound={prices.reload}
        onUseValue={async (v) => {
          if (await onSetValue(item.id, v)) tick("medium");
        }}
      />

      <section className="space-y-3">
        <Eyebrow>Aktuellen Wert eintragen</Eyebrow>
        <div className="flex items-end gap-2">
          <TextField
            label="Wert pro Flasche (€)"
            inputMode="decimal"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={euroCents.format(now)}
            className="flex-1"
          />
          <Button
            onClick={saveValue}
            loading={busy === "value"}
            disabled={Number.isNaN(parsed)}
            className="h-12"
          >
            Speichern
          </Button>
        </div>
        <p className="text-xs text-muted">
          Tipp: Händlerpreise oder Auktionsergebnisse sind gute Anhaltspunkte. Ohne Eintrag schätzt die App
          nach Alter und Trinkfenster.
        </p>
      </section>

      {history.length > 0 && (
        <section className="space-y-2">
          <Eyebrow>Wertverlauf</Eyebrow>
          <ul className="divide-y divide-border text-sm">
            {history.map((v) => (
              <li key={v.id} className="flex justify-between py-2">
                <span className="text-muted">
                  {dateFmt.format(new Date(`${v.date}T12:00:00`))} · {SOURCE[v.source]}
                </span>
                <span className="tabular-nums">{euroCents.format(v.value)}</span>
              </li>
            ))}
            {item.purchasePrice !== null && (
              <li className="flex justify-between py-2">
                <span className="text-muted">
                  {dateFmt.format(new Date(`${item.purchasedOn}T12:00:00`))} · Kauf
                </span>
                <span className="tabular-nums">{euroCents.format(item.purchasePrice)}</span>
              </li>
            )}
          </ul>
        </section>
      )}

      {item.wineId && (
        <Link
          href={`/keller/weine/${item.wineId}`}
          className="flex items-center justify-between rounded-control bg-surface-2/70 px-4 py-3 text-sm font-medium"
        >
          Bewerten & Bewertungen ansehen <span className="text-accent">→</span>
        </Link>
      )}

      <Button variant="ghost" block onClick={onClose}>
        Schließen
      </Button>
    </div>
  );
}

function Box({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-control bg-surface-2/70 px-2 py-2.5">
      <dt className="text-[0.65rem] leading-tight text-muted">{label}</dt>
      <dd className={cn("mt-0.5 font-display text-lg tabular-nums", tone)}>{value}</dd>
    </div>
  );
}
