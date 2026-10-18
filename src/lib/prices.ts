"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";

export type PricePoint = {
  id: string;
  price: number;
  shop: string | null;
  url: string | null;
  observedAt: string;
  source: string;
};

async function load(vintageId: string): Promise<PricePoint[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data } = await supabase
    .from("price_history")
    .select("id, price, shop, url, observed_at, source")
    .eq("vintage_id", vintageId)
    .order("observed_at")
    .limit(500);
  return (data ?? []).map((r) => ({
    id: r.id,
    price: Number(r.price),
    shop: r.shop,
    url: r.url,
    observedAt: r.observed_at,
    source: r.source,
  }));
}

/** Every price ever found for this vintage (by anyone) - the market history. */
export function usePriceHistory(vintageId: string | null | undefined) {
  const [history, setHistory] = useState<PricePoint[]>([]);
  const reload = useCallback(async () => {
    if (vintageId) setHistory(await load(vintageId));
  }, [vintageId]);

  useEffect(() => {
    if (!vintageId) return;
    let active = true;
    load(vintageId).then((rows) => active && setHistory(rows));
    return () => {
      active = false;
    };
  }, [vintageId]);

  return { history: vintageId ? history : [], reload };
}

/** Cheapest offer per day - one point per lookup for the chart. */
export function marketSeries(history: PricePoint[]) {
  const byDay = new Map<string, number>();
  for (const p of history) {
    const day = p.observedAt.slice(0, 10);
    byDay.set(day, Math.min(byDay.get(day) ?? Infinity, p.price));
  }
  return [...byDay.entries()].map(([day, price]) => ({ t: new Date(`${day}T12:00:00`).getTime(), price }));
}
