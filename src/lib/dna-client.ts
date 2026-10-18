"use client";

import type { Dna } from "@/lib/dna";
import { getSupabase } from "@/lib/supabase";
import { post } from "@/lib/wine-ai";

export async function fetchDna(): Promise<{ dna: Dna; summary: string | null } | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const [{ data, error }, profile] = await Promise.all([
    supabase.rpc("taste_dna"),
    supabase.from("taste_profiles").select("summary").maybeSingle(),
  ]);
  if (error || !data) return null;
  return { dna: data as Dna, summary: (profile.data?.summary as string) ?? null };
}

/** Asks the server to write the short DNA text (Gemini, free tier). */
export function writeDnaText() {
  return post<{ text: string }>("/api/dna-text", {});
}
