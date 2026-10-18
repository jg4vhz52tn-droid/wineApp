"use client";

import type { StructureKey } from "@/config/tasting";
import type { WineColor } from "@/lib/cellar/types";
import { getSupabase } from "@/lib/supabase";
import { labelUrl } from "@/lib/wine-ai";

// "Meine Weine": everything you have in the cellar or rated - plus what
// everyone else thinks of it.

type Row = Record<string, unknown>;

export type WineSummary = {
  wineId: string;
  producer: string;
  name: string | null;
  color: WineColor;
  grape: string | null;
  region: string | null;
  labelUrl: string | null;
  vintages: number[];
  inCellar: number;
  myRating: number | null;
  avgRating: number | null;
  ratings: number;
};

const WINE = "id, producer, name, color, label_path, classification, grape_varieties(name), regions(name)";

function toSummary(w: Row): WineSummary {
  return {
    wineId: w.id as string,
    producer: w.producer as string,
    name: (w.name as string) ?? null,
    color: w.color as WineColor,
    grape: ((w.grape_varieties as Row | null)?.name as string) ?? null,
    region: ((w.regions as Row | null)?.name as string) ?? null,
    labelUrl: labelUrl(w.label_path as string | null),
    vintages: [],
    inCellar: 0,
    myRating: null,
    avgRating: null,
    ratings: 0,
  };
}

export async function fetchMyWines(userId: string): Promise<WineSummary[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const [cellar, notes] = await Promise.all([
    supabase.from("cellar_items").select(`quantity, wine_vintages(vintage, wines(${WINE}))`),
    supabase
      .from("tasting_notes")
      .select(`rating, created_at, wine_vintages(vintage, wines(${WINE}))`)
      .eq("user_id", userId)
      .order("created_at"),
  ]);
  const byWine = new Map<string, WineSummary>();
  const add = (v: Row | null) => {
    const w = v?.wines as Row | null;
    if (!w) return null;
    const entry = byWine.get(w.id as string) ?? toSummary(w);
    byWine.set(entry.wineId, entry);
    const vintage = v?.vintage as number | null;
    if (vintage && !entry.vintages.includes(vintage)) entry.vintages.push(vintage);
    return entry;
  };
  for (const row of (cellar.data ?? []) as unknown as Row[]) {
    const entry = add(row.wine_vintages as Row | null);
    if (entry) entry.inCellar += Number(row.quantity);
  }
  for (const row of (notes.data ?? []) as unknown as Row[]) {
    const entry = add(row.wine_vintages as Row | null);
    if (entry && row.rating !== null) entry.myRating = Number(row.rating);
  }
  const list = [...byWine.values()];
  if (list.length) {
    const { data } = await supabase.rpc("wine_rating_summary", { p_wine_ids: list.map((w) => w.wineId) });
    for (const s of (data ?? []) as Row[]) {
      const entry = byWine.get(s.wine_id as string);
      if (entry) {
        entry.avgRating = s.avg_rating === null ? null : Number(s.avg_rating);
        entry.ratings = Number(s.ratings);
      }
    }
  }
  return list.sort((a, b) => `${a.producer} ${a.name}`.localeCompare(`${b.producer} ${b.name}`, "de"));
}

export type WineDetail = WineSummary & {
  classification: string | null;
  vintageIds: { id: string; vintage: number | null }[];
};

export async function fetchWine(wineId: string): Promise<WineDetail | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data } = await supabase
    .from("wines")
    .select(`${WINE}, wine_vintages(id, vintage)`)
    .eq("id", wineId)
    .maybeSingle();
  if (!data) return null;
  const w = data as unknown as Row;
  const vintageIds = ((w.wine_vintages as Row[]) ?? [])
    .map((v) => ({ id: v.id as string, vintage: (v.vintage as number) ?? null }))
    .sort((a, b) => (b.vintage ?? 0) - (a.vintage ?? 0));
  return {
    ...toSummary(w),
    classification: (w.classification as string) ?? null,
    vintageIds,
    vintages: vintageIds.flatMap((v) => (v.vintage ? [v.vintage] : [])),
  };
}

export type Review = {
  id: string;
  author: string;
  isMine: boolean;
  vintage: number | null;
  rating: number | null;
  note: string | null;
  aromas: string[];
  structure: Partial<Record<StructureKey, number>> | null;
  tastedOn: string;
  isPublic: boolean;
};

export async function fetchReviews(wineId: string): Promise<Review[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data } = await supabase.rpc("wine_reviews", { p_wine_id: wineId });
  return ((data ?? []) as Row[]).map((r) => ({
    id: r.id as string,
    author: r.author as string,
    isMine: Boolean(r.is_mine),
    vintage: (r.vintage as number) ?? null,
    rating: r.rating === null ? null : Number(r.rating),
    note: (r.note as string) ?? null,
    aromas: (r.aromas as string[]) ?? [],
    structure: (r.structure as Review["structure"]) ?? null,
    tastedOn: r.tasted_on as string,
    isPublic: Boolean(r.is_public),
  }));
}

export async function saveReview(input: {
  vintageId: string;
  rating: number | null;
  note: string;
  aromas: string[];
  structure: Partial<Record<StructureKey, number>>;
  isPublic: boolean;
}) {
  const { error } = await getSupabase()!
    .from("tasting_notes")
    .insert({
      vintage_id: input.vintageId,
      rating: input.rating,
      note: input.note.trim() || null,
      aromas: input.aromas,
      structure: Object.keys(input.structure).length ? input.structure : null,
      is_public: input.isPublic,
    });
  if (error) throw error;
}

export async function deleteReview(id: string) {
  const { error } = await getSupabase()!.from("tasting_notes").delete().eq("id", id);
  if (error) throw error;
}
