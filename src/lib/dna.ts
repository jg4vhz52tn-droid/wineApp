import { describeStructure, STRUCTURE_SCALES, type StructureKey } from "@/config/tasting";

// Geschmacks-DNA: computed in the database (taste_dna), shown on /profil/dna,
// used for "Passt zu dir".

export type Stat = { value: number; n: number };
export type Ranked = { name: string; avg: number; n: number };

export type Dna = {
  ready: boolean;
  ratings: number;
  needed: number;
  median: number | null;
  structure?: Partial<Record<StructureKey, Stat>>;
  group_structure?: Partial<Record<StructureKey, Stat>>;
  aromas?: { aroma: string; n: number }[];
  grapes?: Ranked[];
  regions?: Ranked[];
  colors?: Record<string, { avg: number; n: number }>;
  prices?: { band: string; from: number; avg: number; n: number }[];
  nose: {
    glasses: number;
    grape_guesses: number;
    grape_hits: number;
    vintage_guesses: number;
    vintage_close: number;
    avg_points: number | null;
    confusions: { actual: string; guessed: string; n: number }[];
  } | null;
};

export const DIMENSIONS: StructureKey[] = ["sweetness", "acidity", "body", "tannin", "finish"];

const fmt = (n: number) => n.toLocaleString("de-DE", { maximumFractionDigits: 1 });

/** Short facts for the text (and the fallback text) - numbers only, no names. */
export function dnaFacts(dna: Dna) {
  const facts: string[] = [];
  const s = dna.structure ?? {};
  const dims = DIMENSIONS.filter((d) => s[d] && s[d]!.n >= 2);
  if (dims.length)
    facts.push(
      `Struktur deiner Lieblingsweine: ${dims
        .map((d) => `${STRUCTURE_SCALES[d].label} ${fmt(s[d]!.value)} (${describeStructure(d, s[d]!.value)})`)
        .join(", ")}`,
    );
  if (dna.aromas?.length)
    facts.push(
      `Lieblingsaromen: ${dna.aromas
        .slice(0, 5)
        .map((a) => a.aroma)
        .join(", ")}`,
    );
  const grapes = (dna.grapes ?? []).filter((g) => g.n >= 1).slice(0, 3);
  if (grapes.length)
    facts.push(`Beste Rebsorten: ${grapes.map((g) => `${g.name} Ø ${fmt(g.avg)}`).join(", ")}`);
  const regions = (dna.regions ?? []).slice(0, 3);
  if (regions.length)
    facts.push(`Beste Regionen: ${regions.map((r) => `${r.name} Ø ${fmt(r.avg)}`).join(", ")}`);
  const sweet = sweetSpot(dna);
  if (sweet) facts.push(`Preis-Sweetspot: ${sweet.band} (Ø ${fmt(sweet.avg)})`);
  const nose = dna.nose;
  if (nose && nose.grape_guesses >= 3)
    facts.push(`Rebsorte blind erkannt: ${nose.grape_hits} von ${nose.grape_guesses}`);
  if (nose?.confusions.length)
    facts.push(
      `Häufige Verwechslung: ${nose.confusions[0].actual} gehalten für ${nose.confusions[0].guessed}`,
    );
  return facts;
}

/** Cheapest price band whose average is within 1 point of the best one. */
export function sweetSpot(dna: Dna) {
  const bands = (dna.prices ?? []).filter((b) => b.n >= 1);
  if (bands.length < 2) return null;
  const best = Math.max(...bands.map((b) => b.avg));
  return bands.find((b) => b.avg >= best - 1) ?? null;
}

/** A plain text if the AI is not available. */
export function fallbackText(dna: Dna) {
  const s = dna.structure ?? {};
  const words: string[] = [];
  if (s.sweetness && s.sweetness.n >= 2) words.push(describeStructure("sweetness", s.sweetness.value));
  if (s.acidity && s.acidity.n >= 2)
    words.push(`mit ${describeStructure("acidity", s.acidity.value)}er Säure`);
  if (s.body && s.body.n >= 2) words.push(`${describeStructure("body", s.body.value)}em Körper`);
  const grape = dna.grapes?.[0];
  const aromas = dna.aromas?.slice(0, 3).map((a) => a.aroma);
  const parts = [
    words.length ? `Du magst Weine, die ${words.join(", ")} sind.` : null,
    grape ? `Am besten bewertest du bisher ${grape.name}.` : null,
    aromas?.length ? `In deinen Lieblingsweinen findest du oft ${aromas.join(", ")}.` : null,
  ].filter(Boolean);
  return parts.join(" ") || "Deine DNA nimmt Form an – mit jeder Bewertung wird sie genauer.";
}

/**
 * "Passt zu dir": how a wine's grape, region and colour did in your ratings,
 * relative to your own middle. Null when the DNA knows nothing about it.
 */
export function matchScore(
  dna: Dna | null,
  wine: { grape: string | null; region: string | null; color: string | null },
): number | null {
  if (!dna?.ready || dna.median === null) return null;
  const parts: [number, number][] = [];
  const grape = dna.grapes?.find((g) => g.name === wine.grape);
  const region = dna.regions?.find((r) => r.name === wine.region);
  const color = wine.color ? dna.colors?.[wine.color] : undefined;
  if (grape) parts.push([grape.avg, 0.5]);
  if (region) parts.push([region.avg, 0.3]);
  if (color) parts.push([color.avg, 0.2]);
  if (!parts.length) return null;
  const weight = parts.reduce((s, [, w]) => s + w, 0);
  const avg = parts.reduce((s, [v, w]) => s + v * w, 0) / weight;
  // Your middle = 70 %, every point above or below moves it by 6 %.
  return Math.round(Math.min(99, Math.max(10, 70 + (avg - dna.median) * 6)));
}
