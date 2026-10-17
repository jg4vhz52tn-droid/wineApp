"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "@/components/app/session-provider";
import { EventPatch } from "@/components/event/event-patch";
import { CollectibleCard } from "@/components/learn/collectible-card";
import { Eyebrow } from "@/components/ui/card";
import { LEARN_MODULES } from "@/config/learn/modules";
import { useLearnProgress } from "@/lib/learn-progress";
import { fetchPatches, photoUrls, type PatchInfo } from "@/lib/events/api";

/** One patch per finished evening you were part of. */
function Patches() {
  const { session } = useSession();
  const [patches, setPatches] = useState<PatchInfo[] | null>(null);
  const [urls, setUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!session) return;
    let active = true;
    fetchPatches().then(async (list) => {
      if (!active) return;
      setPatches(list);
      const found = await photoUrls(list.flatMap((p) => (p.photoPath ? [p.photoPath] : [])));
      if (active) setUrls(found);
    });
    return () => {
      active = false;
    };
  }, [session]);

  if (!session || !patches) return null;
  return (
    <section className="mb-10 space-y-3">
      <h2 className="text-2xl">Abend-Patches</h2>
      {patches.length === 0 ? (
        <p className="rounded-card border border-dashed border-border p-5 text-sm text-muted">
          Nach jedem Lagenabend bekommst du hier einen Patch – mit Foto, Datum und Gewinner.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {patches.map((p) => (
            <li key={p.eventId}>
              <Link href={`/abende/${p.eventId}/rueckblick`} aria-label={`Rückblick: ${p.title}`}>
                <EventPatch
                  title={p.title}
                  startsAt={p.startsAt}
                  winner={p.winner}
                  photoUrl={p.photoPath ? (urls[p.photoPath] ?? null) : null}
                  className="w-full"
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function Collection() {
  const { completed } = useLearnProgress();
  return (
    <>
      <header className="mb-6 space-y-3">
        <Link href="/lernen" className="inline-flex h-10 items-center text-sm text-muted hover:text-fg">
          ← Lernen
        </Link>
        <Eyebrow>Sammlung</Eyebrow>
        <h1 className="text-[2.5rem] leading-[1.05]">
          {completed.length} von {LEARN_MODULES.length} Lernkarten
        </h1>
        <p className="text-muted">
          Später kommen hier die Karten für Regionen, Lagen und Rebsorten dazu, die du beim Aufdecken an euren
          Abenden sammelst.
        </p>
      </header>
      <Patches />
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {LEARN_MODULES.map((item, index) => {
          const locked = !completed.includes(item.id);
          return (
            <li key={item.id}>
              {locked ? (
                <Link href={`/lernen/${item.id}`} aria-label={`${item.title} – Modul starten`}>
                  <CollectibleCard item={item} number={index + 1} locked />
                </Link>
              ) : (
                <CollectibleCard item={item} number={index + 1} />
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}
