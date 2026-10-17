"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "@/components/app/session-provider";
import { fetchPatches, photoUrls, type PatchInfo } from "@/lib/events/api";
import { EventPatch } from "./event-patch";

const dateFmt = new Intl.DateTimeFormat("de-DE", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Europe/Berlin",
});

/** Loads the patches of all finished evenings you were part of, with photo links. */
export function usePatches() {
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

  return { patches: session ? patches : null, urls };
}

function PatchLink({
  patch,
  urls,
  caption,
}: {
  patch: PatchInfo;
  urls: Record<string, string>;
  caption: boolean;
}) {
  return (
    <Link
      href={`/abende/${patch.eventId}/rueckblick`}
      aria-label={`Rückblick: ${patch.title}`}
      className="block space-y-1.5"
    >
      <EventPatch
        title={patch.title}
        startsAt={patch.startsAt}
        location={patch.location}
        podium={patch.podium}
        guests={patch.guests}
        photoUrl={patch.photoPath ? (urls[patch.photoPath] ?? null) : null}
        className="w-full"
      />
      {caption && (
        <span className="block text-center">
          <span className="block truncate text-sm font-medium">{patch.title}</span>
          <span className="block text-xs text-muted">
            {patch.startsAt ? dateFmt.format(new Date(patch.startsAt)) : ""}
          </span>
        </span>
      )}
    </Link>
  );
}

/** Tile on the Abende page: the latest patches and a way to all of them. */
export function PatchTile() {
  const { patches, urls } = usePatches();
  if (!patches) return null;
  return (
    <section className="space-y-3 rounded-card border border-border bg-surface p-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-2xl">Deine Patches</h2>
        {patches.length > 0 && (
          <Link href="/abende/patches" className="text-sm font-medium text-accent">
            Alle {patches.length} →
          </Link>
        )}
      </div>
      {patches.length === 0 ? (
        <p className="text-sm text-muted">
          Nach jedem Lagenabend bekommt ihr einen Patch – mit Foto, Datum und der besten Nase. Hier sammelst
          du sie.
        </p>
      ) : (
        <ul className="-mx-4 flex [scrollbar-width:none] gap-3 overflow-x-auto px-4 pb-1">
          {patches.slice(0, 6).map((p) => (
            <li key={p.eventId} className="w-28 shrink-0">
              <PatchLink patch={p} urls={urls} caption={false} />
            </li>
          ))}
          {patches.length > 6 && (
            <li className="flex w-24 shrink-0 items-center">
              <Link href="/abende/patches" className="text-sm text-accent">
                + {patches.length - 6} weitere
              </Link>
            </li>
          )}
        </ul>
      )}
    </section>
  );
}

/** Full grid for the "Alle Patches" page and the collection. */
export function PatchGrid({ emptyText }: { emptyText: string }) {
  const { patches, urls } = usePatches();
  if (!patches) return null;
  if (patches.length === 0) {
    return (
      <p className="rounded-card border border-dashed border-border p-5 text-sm text-muted">{emptyText}</p>
    );
  }
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3">
      {patches.map((p) => (
        <li key={p.eventId}>
          <PatchLink patch={p} urls={urls} caption />
        </li>
      ))}
    </ul>
  );
}
