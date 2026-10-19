"use client";

import { getSupabase } from "@/lib/supabase";

// "Deine Sinne": eye, nose and palate grow with guided tastings and evenings.

export type ProgressStats = Record<string, number>;
export type Badge = {
  code: string;
  title: string;
  description: string;
  icon: string | null;
  awardedAt: string | null;
};
export type NewBadge = { code: string; title: string; description: string; icon: string | null };

export type Sense = {
  key: "eye" | "nose" | "palate";
  label: string;
  xp: number;
  level: number;
  name: string;
  /** 0..1 towards the next level. */
  progress: number;
  next: number | null;
  how: string;
};

const LEVELS = [0, 40, 120, 250, 450, 700];
const NAMES = ["Neugierig", "Entdecker", "Geübt", "Kenner", "Feinschmecker", "Meister"];

function sense(key: Sense["key"], label: string, xp: number, how: string): Sense {
  let level = 0;
  while (level < LEVELS.length - 1 && xp >= LEVELS[level + 1]) level++;
  const next = LEVELS[level + 1] ?? null;
  const progress = next === null ? 1 : (xp - LEVELS[level]) / (next - LEVELS[level]);
  return { key, label, xp, level: level + 1, name: NAMES[level], progress, next, how };
}

export function senses(s: ProgressStats): Sense[] {
  const n = (k: string) => Number(s[k] ?? 0);
  return [
    sense(
      "eye",
      "Auge",
      n("guided") * 10 + n("shade_matches") * 15,
      "Farben einschätzen in geführten Verkostungen",
    ),
    sense(
      "nose",
      "Nase",
      n("aromas_found") * 6 + n("blind_grape_hits") * 10,
      "Aromen finden – und Rebsorten blind erkennen",
    ),
    sense(
      "palate",
      "Gaumen",
      n("palate_close") * 8 + n("finish_measured") * 5 + n("blind_structure_points"),
      "Süße, Säure, Körper und Abgang treffen",
    ),
  ];
}

export async function fetchProgress(userId: string) {
  const supabase = getSupabase();
  if (!supabase) return null;
  const [stats, all, mine] = await Promise.all([
    supabase.rpc("my_progress_stats"),
    supabase.from("badges").select("id, code, title, description, icon").order("code"),
    supabase.from("user_badges").select("badge_id, awarded_at").eq("user_id", userId),
  ]);
  const awarded = new Map((mine.data ?? []).map((b) => [b.badge_id as string, b.awarded_at as string]));
  const badges: Badge[] = (all.data ?? []).map((b) => ({
    code: b.code,
    title: b.title,
    description: b.description,
    icon: b.icon,
    awardedAt: awarded.get(b.id) ?? null,
  }));
  badges.sort((a, b) => Number(!!b.awardedAt) - Number(!!a.awardedAt));
  return { stats: (stats.data ?? {}) as ProgressStats, badges };
}

/** Hands out every badge you have earned; returns the new ones. */
export async function awardBadges(): Promise<NewBadge[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data } = await supabase.rpc("award_badges");
  return (data ?? []) as NewBadge[];
}
