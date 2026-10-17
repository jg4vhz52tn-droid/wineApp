"use client";

import Link from "next/link";
import { useSession } from "@/components/app/session-provider";
import { PatchGrid } from "@/components/event/patch-gallery";
import { CollectibleCard } from "@/components/learn/collectible-card";
import { Eyebrow } from "@/components/ui/card";
import { LEARN_MODULES } from "@/config/learn/modules";
import { useLearnProgress } from "@/lib/learn-progress";

function Patches() {
  const { session } = useSession();
  if (!session) return null;
  return (
    <section className="mb-10 space-y-3">
      <h2 className="text-2xl">Abend-Patches</h2>
      <PatchGrid emptyText="Nach jedem Lagenabend bekommst du hier einen Patch – mit Foto, Datum und Gewinner." />
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
