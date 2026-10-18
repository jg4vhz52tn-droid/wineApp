"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/app/page-header";
import { useSession } from "@/components/app/session-provider";
import { Bottle } from "@/components/tasting/bottle";
import { buttonClasses } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { bottleShapeFor } from "@/config/bottles";
import { fetchMyWines, type WineSummary } from "@/lib/wines";

type Filter = "alle" | "keller" | "geoeffnet" | "gescannt" | "bewertet" | "offen";
function matches(w: WineSummary, filter: Filter) {
  if (filter === "keller") return w.inCellar > 0;
  if (filter === "geoeffnet") return w.opened > 0;
  if (filter === "gescannt") return w.scanned;
  if (filter === "bewertet") return w.myRating !== null;
  // Opened but not rated yet - the ones that still need your verdict.
  if (filter === "offen") return w.opened > 0 && w.myRating === null;
  return true;
}

const fmt = (n: number) => n.toLocaleString("de-DE", { maximumFractionDigits: 1 });

export function MyWines() {
  const { ready, session, isGuest } = useSession();
  const [wines, setWines] = useState<WineSummary[] | null>(null);
  const [filter, setFilter] = useState<Filter>("alle");

  useEffect(() => {
    if (!session || isGuest) return;
    let active = true;
    fetchMyWines(session.user.id).then((list) => active && setWines(list));
    return () => {
      active = false;
    };
  }, [session, isGuest]);

  const shown = (wines ?? []).filter((w) => matches(w, filter));
  const count = (f: Filter) => (wines ?? []).filter((w) => matches(w, f)).length;

  return (
    <>
      <Link href="/keller" className="text-sm text-muted">
        ← Keller
      </Link>
      <PageHeader eyebrow="Meine Weine" title="Bewertet & im Keller">
        Deine Punkte, deine Notizen – und was die anderen zu denselben Weinen sagen.
      </PageHeader>

      {ready && (!session || isGuest) ? (
        <Link href="/login?next=/keller/weine" className={buttonClasses({ size: "lg", block: true })}>
          Anmelden
        </Link>
      ) : wines === null ? (
        <p className="text-muted">Lade …</p>
      ) : wines.length === 0 ? (
        <p className="rounded-card border border-dashed border-border p-5 text-sm text-muted">
          Noch keine Weine – scanne ein Etikett im Keller oder bewerte einen Wein nach einem Abend.
        </p>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["alle", "Alle"],
                ["keller", "Im Keller"],
                ["geoeffnet", "Geöffnet"],
                ["gescannt", "Gescannt"],
                ["bewertet", "Bewertet"],
                ["offen", "Noch nicht bewertet"],
              ] as const
            ).map(([key, label]) => (
              <Chip key={key} selected={filter === key} onClick={() => setFilter(key)}>
                {label} <span className="ml-1 tabular-nums opacity-60">{count(key)}</span>
              </Chip>
            ))}
          </div>
          <ul className="space-y-2">
            {shown.map((w) => (
              <li key={w.wineId}>
                <Link
                  href={`/keller/weine/${w.wineId}`}
                  className="flex items-center gap-3 rounded-card border border-border bg-surface p-3"
                >
                  <Bottle
                    shape={bottleShapeFor(w.color)}
                    label={{ producer: w.producer, name: w.name ?? w.producer, photo: w.labelUrl }}
                    className="h-20 w-11 shrink-0"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{w.name ?? w.producer}</span>
                    <span className="block truncate text-sm text-muted">
                      {[w.name ? w.producer : null, w.region, w.vintages.sort().join(", ")]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                    <span className="mt-1 flex flex-wrap gap-x-3 text-xs text-muted">
                      {w.inCellar > 0 && <span>{w.inCellar} im Keller</span>}
                      {w.opened > 0 && <span>{w.opened} geöffnet</span>}
                      {w.scanned && <span>📷 gescannt</span>}
                      {w.avgRating !== null && (
                        <span>
                          Ø {fmt(w.avgRating)} · {w.ratings} {w.ratings === 1 ? "Bewertung" : "Bewertungen"}
                        </span>
                      )}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    {w.myRating !== null ? (
                      <>
                        <span className="block font-display text-2xl text-accent tabular-nums">
                          {fmt(w.myRating)}
                        </span>
                        <span className="text-[0.65rem] text-muted">deine Punkte</span>
                      </>
                    ) : (
                      <span className="text-xs font-medium text-accent">Bewerten →</span>
                    )}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          {shown.length === 0 && (
            <p className="text-sm text-muted">
              {filter === "offen"
                ? "Alles bewertet, was du geöffnet hast. Zum Wohl!"
                : "Hier ist gerade nichts."}
            </p>
          )}
        </div>
      )}
    </>
  );
}
