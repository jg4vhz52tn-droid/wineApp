"use client";

import { motion } from "motion/react";
import { CountUp } from "@/components/tasting/count-up";
import { STRUCTURE_SCALES, type StructureKey } from "@/config/tasting";
import { countryName, grapeName, regionName, siteName } from "@/lib/events/derive";
import type { Catalog, Guess, Score, Secret } from "@/lib/events/types";
import { cn } from "@/lib/cn";

const euro = (n: number | null) => (n === null ? "–" : `${Math.round(n)} €`);

/** After the reveal: your guess next to the truth, line by line, with the points. */
export function RevealResult({
  secret,
  guess,
  score,
  catalog,
  pirateMode,
}: {
  secret: Secret | undefined;
  guess: Guess | undefined;
  score: Score | undefined;
  catalog: Catalog | null;
  pirateMode: boolean;
}) {
  if (!guess) {
    return (
      <p className="rounded-control bg-surface-2/70 px-4 py-3 text-sm text-muted">
        Für dieses Glas hast du nichts abgegeben – beim nächsten bist du wieder dabei.
      </p>
    );
  }
  const b = score?.breakdown ?? {};
  const wine = secret?.wine;
  const structure = Object.entries(b.structure ?? {}) as [StructureKey, number][];
  const rows: [string, string, number | undefined][] = [
    ["Rebsorte", grapeName(catalog, guess.grapeId) ?? "–", b.grape],
    ["Land", countryName(guess.countryCode) ?? "–", b.country],
    ["Region", regionName(catalog, guess.regionId) ?? "–", b.region],
    ["Lage", siteName(catalog, guess.siteId) ?? "–", b.site],
    ["Jahrgang", guess.vintage ? String(guess.vintage) : "–", b.vintage],
    ["Preis", euro(guess.price), b.price],
    ...structure.map(([key, p]): [string, string, number] => [
      STRUCTURE_SCALES[key].label,
      (guess.structure[key] ?? 0).toLocaleString("de-DE"),
      p,
    ]),
    ["Aromen", guess.aromas.length ? `${guess.aromas.length} gewählt` : "–", b.aromas],
  ];
  if (pirateMode) rows.push(["Pirat", guess.markedPirate ? "markiert" : "–", b.pirate]);

  const truth: Record<string, string | null> = {
    Rebsorte: grapeName(catalog, wine?.grapeId ?? null),
    Jahrgang: wine?.vintage ? String(wine.vintage) : null,
    Preis: secret?.price ? euro(secret.price) : null,
    Lage: siteName(catalog, wine?.siteId ?? null),
    Region: regionName(catalog, wine?.regionId ?? null),
    Pirat: secret?.isPirate ? "das war der Pirat" : null,
  };

  return (
    <section className="space-y-3">
      <ol className="divide-y divide-border rounded-control bg-surface-2/50 px-4">
        {rows.map(([label, yours, points], i) => (
          <motion.li
            key={label}
            className="flex items-center gap-3 py-2.5 text-sm"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.9 + i * 0.07 }}
          >
            <span className="w-20 shrink-0 text-muted">{label}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate">{yours}</span>
              {!points && truth[label] && truth[label] !== yours && (
                <span className="block truncate text-xs text-muted">richtig: {truth[label]}</span>
              )}
            </span>
            <span
              className={cn(
                "w-10 text-right font-medium tabular-nums",
                points ? "text-success" : "text-muted",
              )}
            >
              {points ? `+${points}` : "0"}
            </span>
          </motion.li>
        ))}
      </ol>
      <div className="flex items-center justify-between rounded-control bg-accent/15 px-4 py-3">
        <span className="text-sm text-muted">Deine Punkte für dieses Glas</span>
        <span className="font-display text-4xl text-accent">
          <CountUp value={score?.points ?? 0} />
        </span>
      </div>
      {b.structure_reference === "group" && (
        <p className="text-xs text-muted">Struktur verglichen mit dem Schnitt der Runde.</p>
      )}
    </section>
  );
}
