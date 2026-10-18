"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/card";
import { euroCents } from "@/lib/cellar/value";
import { tick } from "@/lib/haptics";
import type { PricePoint } from "@/lib/prices";
import { findPrices, type PriceOffer } from "@/lib/wine-ai";

const dateFmt = new Intl.DateTimeFormat("de-DE", { day: "numeric", month: "short", year: "numeric" });

/**
 * "Was kostet die Flasche gerade?" - on demand, Claude searches the web for
 * shop offers. Shown as Fundstellen with a link to buy.
 */
export function PriceCheck({
  wine,
  history,
  onFound,
  onUseValue,
}: {
  wine: {
    vintageId: string | null | undefined;
    producer: string;
    name: string | null;
    vintage: number | null;
  };
  history: PricePoint[];
  onFound: () => Promise<void>;
  onUseValue?: (value: number) => Promise<unknown>;
}) {
  const [offers, setOffers] = useState<PriceOffer[] | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Without a fresh search: the latest stored lookup.
  const lastDay = history.at(-1)?.observedAt.slice(0, 10);
  const stored = lastDay
    ? history
        .filter((p) => p.observedAt.startsWith(lastDay) && p.url)
        .sort((a, b) => a.price - b.price)
        .map((p) => ({ shop: p.shop ?? "Händler", price: p.price, url: p.url!, vintage: wine.vintage }))
    : [];
  const shown = offers ?? stored;
  const cheapest = shown[0];

  async function search() {
    if (!wine.vintageId) return;
    setBusy(true);
    setError(null);
    try {
      const result = await findPrices({ ...wine, vintageId: wine.vintageId });
      setOffers(result.offers);
      setNote(result.note);
      tick("medium");
      await onFound();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Die Preissuche hat nicht geklappt.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-3 rounded-[1.75rem] bg-surface-2/70 p-4">
      <div className="flex items-baseline justify-between gap-3">
        <Eyebrow>Im Handel</Eyebrow>
        {!offers && lastDay && (
          <span className="text-xs text-muted">
            geprüft am {dateFmt.format(new Date(`${lastDay}T12:00:00`))}
          </span>
        )}
      </div>

      {shown.length > 0 ? (
        <ul className="divide-y divide-border">
          {shown.map((o) => (
            <li key={o.url} className="flex items-center gap-3 py-2.5">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{o.shop}</span>
                {o.vintage && wine.vintage && o.vintage !== wine.vintage && (
                  <span className="block text-xs text-warning">Jahrgang {o.vintage}</span>
                )}
              </span>
              <span className="font-display text-lg tabular-nums">{euroCents.format(o.price)}</span>
              <a
                href={o.url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="inline-flex h-9 items-center rounded-full bg-accent px-3 text-xs font-semibold text-accent-fg"
              >
                Kaufen ↗
              </a>
            </li>
          ))}
        </ul>
      ) : (
        offers && <p className="text-sm text-muted">{note ?? "Keine Angebote gefunden."}</p>
      )}
      {offers && shown.length > 0 && note && <p className="text-xs text-muted">{note}</p>}

      <div className="grid gap-2">
        <Button
          block
          variant={shown.length ? "secondary" : "primary"}
          loading={busy}
          onClick={search}
          disabled={!wine.vintageId}
        >
          {shown.length ? "Erneut prüfen" : "Preis prüfen"}
        </Button>
        {cheapest && onUseValue && (
          <Button block variant="ghost" onClick={() => onUseValue(cheapest.price)}>
            {euroCents.format(cheapest.price)} als aktuellen Wert übernehmen
          </Button>
        )}
      </div>
      {busy && (
        <p className="text-center text-xs text-muted">Suche bei Händlern … das dauert ein paar Sekunden.</p>
      )}
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      {!wine.vintageId && (
        <p className="text-xs text-muted">Im Beispielkeller nicht verfügbar – melde dich an.</p>
      )}
      <p className="text-xs text-muted">Fundstellen aus der Websuche, ohne Gewähr. Preise ändern sich.</p>
    </section>
  );
}
