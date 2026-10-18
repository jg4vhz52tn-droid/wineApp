"use client";

import type { WineProfile } from "@/app/api/wine-profile/route";
import { AROMA_FAMILIES } from "@/config/aromas";
import type { StructureKey } from "@/config/tasting";
import { GRAPES } from "@/config/learn/grapes";
import type { WineColor } from "@/lib/cellar/types";
import { getSupabase } from "@/lib/supabase";
import { labelUrl, post } from "@/lib/wine-ai";
import { fetchReviews } from "@/lib/wines";

export type GuideWine = {
  vintageId: string;
  wineId: string;
  producer: string;
  name: string | null;
  vintage: number | null;
  color: WineColor;
  grape: string | null;
  region: string | null;
  labelUrl: string | null;
};

export type Expected = {
  shade: string | null;
  colorNote: string | null;
  aromas: { aroma: string; note: string | null }[];
  structure: Partial<Record<StructureKey, number>>;
  finishSeconds: number | null;
  note: string | null;
  /** Where the expectation comes from - shown to the user. */
  source: "community" | "ai" | "grape" | "none";
};

const ALL_AROMAS = new Set(AROMA_FAMILIES.flatMap((f) => f.aromas));

export async function fetchGuideWine(vintageId: string): Promise<GuideWine | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data } = await supabase
    .from("wine_vintages")
    .select(
      "id, vintage, wine_id, wines(producer, name, color, label_path, grape_varieties(name), regions(name))",
    )
    .eq("id", vintageId)
    .maybeSingle();
  const row = data as unknown as {
    id: string;
    vintage: number | null;
    wine_id: string;
    wines: {
      producer: string;
      name: string | null;
      color: WineColor;
      label_path: string | null;
      grape_varieties: { name: string } | null;
      regions: { name: string } | null;
    } | null;
  } | null;
  if (!row?.wines) return null;
  return {
    vintageId: row.id,
    wineId: row.wine_id,
    producer: row.wines.producer,
    name: row.wines.name,
    vintage: row.vintage,
    color: row.wines.color,
    grape: row.wines.grape_varieties?.name ?? null,
    region: row.wines.regions?.name ?? null,
    labelUrl: labelUrl(row.wines.label_path),
  };
}

/** The grape profile from the learning chapter as a last resort. */
function fromGrape(wine: GuideWine): Expected {
  const g = GRAPES.find((x) => x.name.toLowerCase() === (wine.grape ?? "").toLowerCase());
  if (!g)
    return {
      shade: null,
      colorNote: null,
      aromas: [],
      structure: {},
      finishSeconds: null,
      note: null,
      source: "none",
    };
  return {
    shade: null,
    colorNote: null,
    aromas: g.aromas
      .filter((a) => ALL_AROMAS.has(a))
      .map((aroma) => ({ aroma, note: `typisch für ${g.name}` })),
    structure: {
      acidity: g.traits.acidity,
      body: g.traits.body,
      ...(g.color === "red" ? { tannin: g.traits.tannin } : {}),
    },
    finishSeconds: null,
    note: g.note,
    source: "grape",
  };
}

/**
 * What experts typically find in this wine - best source first:
 * 1. at least 3 ratings of exactly this wine from the group,
 * 2. the stored AI profile (created once, shared by everyone),
 * 3. the grape profile from the learning chapter.
 */
export async function loadExpected(wine: GuideWine): Promise<Expected> {
  const [reviews, ai] = await Promise.all([
    fetchReviews(wine.wineId).catch(() => []),
    post<{ profile: WineProfile }>("/api/wine-profile", { vintageId: wine.vintageId })
      .then((r) => r.profile)
      .catch(() => null),
  ]);
  const base: Expected = ai
    ? {
        shade: ai.shade,
        colorNote: ai.color_note,
        aromas: ai.aromas,
        structure: Object.fromEntries(
          Object.entries(ai.structure).filter(([, v]) => typeof v === "number"),
        ) as Expected["structure"],
        finishSeconds: ai.finish_seconds,
        note: ai.note,
        source: "ai",
      }
    : fromGrape(wine);

  const others = reviews.filter((r) => !r.isMine);
  if (others.length < 3) return base;

  // The group's own impressions of exactly this wine come first.
  const count = new Map<string, number>();
  for (const r of others) for (const a of r.aromas) count.set(a, (count.get(a) ?? 0) + 1);
  const groupAromas = [...count.entries()]
    .filter(([, n]) => n >= 2)
    .sort((a, b) => b[1] - a[1])
    .map(([aroma, n]) => ({ aroma, note: `${n} aus eurer Runde haben das gefunden` }));
  const structure: Expected["structure"] = { ...base.structure };
  for (const key of ["sweetness", "acidity", "body", "tannin", "finish"] as StructureKey[]) {
    const values = others.flatMap((r) => (typeof r.structure?.[key] === "number" ? [r.structure[key]!] : []));
    if (values.length >= 3)
      structure[key] = Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
  }
  const aromas = [...groupAromas, ...base.aromas.filter((a) => !count.has(a.aroma))].slice(0, 6);
  return { ...base, aromas, structure, source: "community" };
}
