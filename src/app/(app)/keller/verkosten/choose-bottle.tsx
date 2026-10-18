"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { PageHeader } from "@/components/app/page-header";
import { Bottle } from "@/components/tasting/bottle";
import { buttonClasses } from "@/components/ui/button";
import { bottleShapeFor } from "@/config/bottles";
import { useCellar } from "@/lib/cellar/use-cellar";

const noop = () => () => {};

/** The cellar works with "now" - so it renders in the browser only. */
export function ChooseBottle() {
  const mounted = useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
  return mounted ? <Chooser /> : null;
}

/** Pick the bottle from your cellar you want to taste with guidance. */
function Chooser() {
  const { data, mode } = useCellar();
  const bottles = data.items.filter((i) => i.quantity > 0 && i.vintageId);
  return (
    <>
      <Link href="/keller" className="text-sm text-muted">
        ← Keller
      </Link>
      <PageHeader eyebrow="Geführte Verkostung" title="Welche Flasche probierst du?">
        Schritt für Schritt: sehen, riechen, schmecken – und nach jedem Schritt vergleichen, was Kenner in
        diesem Wein finden.
      </PageHeader>
      {mode === "loading" ? (
        <p className="text-muted">Lade Keller …</p>
      ) : mode === "demo" ? (
        <div className="space-y-3">
          <p className="text-muted">
            Die geführte Verkostung nutzt deinen eigenen Keller – dafür brauchst du ein Konto.
          </p>
          <Link href="/login?next=/keller/verkosten" className={buttonClasses({ size: "lg", block: true })}>
            Anmelden
          </Link>
        </div>
      ) : bottles.length === 0 ? (
        <p className="rounded-card border border-dashed border-border p-5 text-sm text-muted">
          Dein Keller ist leer. Scanne zuerst ein Etikett im Keller.
        </p>
      ) : (
        <ul className="space-y-2">
          {bottles.map((b) => (
            <li key={b.id}>
              <Link
                href={`/keller/verkosten/${b.vintageId}`}
                className="flex items-center gap-3 rounded-card border border-border bg-surface p-3"
              >
                <Bottle
                  shape={bottleShapeFor(b.color)}
                  label={{ producer: b.producer, name: b.name || b.producer, photo: b.labelUrl }}
                  className="h-20 w-11 shrink-0"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{b.name || b.producer}</span>
                  <span className="block truncate text-sm text-muted">
                    {[b.name ? b.producer : null, b.vintage, b.grape].filter(Boolean).join(" · ")}
                  </span>
                </span>
                <span className="text-sm font-medium text-accent">Probieren →</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
