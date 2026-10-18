"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "@/components/app/session-provider";
import { getSupabase } from "@/lib/supabase";
import { labelUrl, saveLabel } from "@/lib/wine-ai";
import { demoCellar } from "./demo";
import type { CellarData, CellarEvent, CellarWine, NewBottles, Valuation } from "./types";

const today = () => new Date().toISOString().slice(0, 10);

// crypto.randomUUID only exists on https/localhost - the phone in the Wi-Fi uses plain http.
const uid = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, "0")).join("");

type Mode = "loading" | "demo" | "live";

/**
 * The cellar for the signed-in account (Supabase, protected by RLS), or the
 * sample cellar when nobody - or only a guest - is signed in. Both offer the
 * same actions, so the UI doesn't care which one it is.
 */
export function useCellar() {
  const { ready, session, isGuest, configured } = useSession();
  const [liveData, setLiveData] = useState<CellarData | null>(null);
  const [demoData, setDemoData] = useState<CellarData>(demoCellar);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const live = configured && ready && !!session && !isGuest;
  const mode: Mode = configured && !ready ? "loading" : live ? (liveData ? "live" : "loading") : "demo";
  const data = mode === "live" && liveData ? liveData : demoData;

  const apply = useCallback((result: Loaded | null) => {
    if (!result) return;
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setOrgId(result.orgId);
    setLiveData(result.data);
    setError(null);
  }, []);

  const reload = useCallback(async () => {
    if (session) apply(await loadCellar(session.user.id));
  }, [session, apply]);

  useEffect(() => {
    if (!live || !session) return;
    let active = true;
    loadCellar(session.user.id).then((result) => active && apply(result));
    return () => {
      active = false;
    };
  }, [live, session, apply]);

  // --- actions ----------------------------------------------------------------

  async function addBottles(input: NewBottles) {
    if (mode !== "live") {
      const id = `local-${uid()}`;
      const item: CellarWine = {
        id,
        producer: input.producer,
        name: input.name,
        vintage: input.vintage,
        color: input.color,
        grape: input.grape,
        region: null,
        classification: input.classification,
        quantity: input.quantity,
        purchasePrice: input.purchasePrice,
        purchasedOn: input.purchasedOn,
        drinkFrom: input.drinkFrom,
        drinkUntil: input.drinkUntil,
        rackId: input.rackId,
        compartment: input.compartment,
        row: input.row,
        labelUrl: input.labelPreview ?? null,
      };
      setDemoData((d) => ({
        ...d,
        items: [...d.items, item],
        events: [
          ...d.events,
          {
            id: `${id}-p`,
            itemId: id,
            kind: "purchase",
            quantity: input.quantity,
            unitPrice: input.purchasePrice,
            date: input.purchasedOn,
          },
        ],
      }));
      return true;
    }
    const supabase = getSupabase();
    if (!supabase || !orgId) return false;
    // Region and site from the label scan go into the catalogue first.
    if (input.regionId || input.siteId) {
      await supabase.rpc("ensure_wine_vintage", {
        p_producer: input.producer,
        p_name: input.name,
        p_color: input.color,
        p_vintage: input.vintage,
        p_grape_name: input.grape,
        p_region_id: input.regionId ?? null,
        p_site_id: input.siteId ?? null,
        p_classification: input.classification,
      });
    }
    const { data: itemId, error } = await supabase.rpc("add_cellar_bottles", {
      p_org_id: orgId,
      p_producer: input.producer,
      p_name: input.name,
      p_color: input.color,
      p_vintage: input.vintage,
      p_quantity: input.quantity,
      p_purchase_price: input.purchasePrice,
      p_purchased_on: input.purchasedOn,
      p_grape_name: input.grape,
      p_classification: input.classification,
      p_drink_from: input.drinkFrom,
      p_drink_until: input.drinkUntil,
      p_rack_id: input.rackId,
      p_storage_compartment: input.compartment,
      p_storage_row: input.row,
    });
    if (error) {
      setError("Die Flaschen konnten nicht gespeichert werden.");
      return false;
    }
    if (input.label && itemId) {
      const { data: item } = await supabase
        .from("cellar_items")
        .select("vintage_id")
        .eq("id", itemId)
        .single();
      if (item?.vintage_id) await saveLabel(item.vintage_id, input.label).catch(() => null);
    }
    await reload();
    return true;
  }

  async function openBottles(itemId: string, count: number, value: number | null) {
    if (mode !== "live") {
      setDemoData((d) => ({
        ...d,
        items: d.items.map((i) => (i.id === itemId ? { ...i, quantity: i.quantity - count } : i)),
        events: [
          ...d.events,
          {
            id: uid(),
            itemId,
            kind: "consume",
            quantity: -count,
            unitPrice: value,
            date: today(),
          },
        ],
      }));
      return true;
    }
    const supabase = getSupabase();
    if (!supabase) return false;
    const { error } = await supabase.rpc("open_cellar_bottle", {
      p_item_id: itemId,
      p_count: count,
      p_value: value,
    });
    if (error) {
      setError("Die Flasche konnte nicht ausgetragen werden.");
      return false;
    }
    await reload();
    return true;
  }

  async function setValue(itemId: string, value: number) {
    if (mode !== "live") {
      setDemoData((d) => ({
        ...d,
        valuations: [...d.valuations, { id: uid(), itemId, value, source: "manual", date: today() }],
      }));
      return true;
    }
    const supabase = getSupabase();
    if (!supabase || !orgId) return false;
    const { error } = await supabase
      .from("cellar_valuations")
      .insert({ cellar_item_id: itemId, org_id: orgId, value, source: "manual" });
    if (error) {
      setError("Der Wert konnte nicht gespeichert werden.");
      return false;
    }
    await reload();
    return true;
  }

  /** Fixes the price paid per bottle afterwards. */
  async function setPurchasePrice(itemId: string, price: number | null) {
    if (mode !== "live") {
      setDemoData((d) => ({
        ...d,
        items: d.items.map((i) => (i.id === itemId ? { ...i, purchasePrice: price } : i)),
        events: d.events.map((e) =>
          e.itemId === itemId && e.kind === "purchase" ? { ...e, unitPrice: price } : e,
        ),
      }));
      return true;
    }
    const supabase = getSupabase();
    if (!supabase) return false;
    const { error } = await supabase.rpc("set_purchase_price", { p_item_id: itemId, p_price: price });
    if (error) {
      setError("Der Kaufpreis konnte nicht gespeichert werden.");
      return false;
    }
    await reload();
    return true;
  }

  /** Creates a named rack; returns its id. */
  async function addRack(name: string, compartments: number, rows: number) {
    const clean = name.trim();
    if (!clean) return null;
    if (mode !== "live") {
      const id = `rack-${uid()}`;
      setDemoData((d) => ({ ...d, racks: [...d.racks, { id, name: clean, compartments, rows }] }));
      return id;
    }
    const supabase = getSupabase();
    if (!supabase || !orgId) return null;
    const { data: rack, error } = await supabase
      .from("cellar_racks")
      .insert({ org_id: orgId, name: clean, compartments, rows })
      .select("id")
      .single();
    if (error) {
      setError(
        error.code === "23505"
          ? "Ein Regal mit diesem Namen gibt es schon."
          : "Das Regal konnte nicht angelegt werden.",
      );
      return null;
    }
    await reload();
    return rack.id as string;
  }

  async function updateRack(id: string, changes: { name?: string; compartments?: number; rows?: number }) {
    if (mode !== "live") {
      setDemoData((d) => ({ ...d, racks: d.racks.map((r) => (r.id === id ? { ...r, ...changes } : r)) }));
      return true;
    }
    const supabase = getSupabase();
    if (!supabase) return false;
    const { error } = await supabase.from("cellar_racks").update(changes).eq("id", id);
    if (error) {
      setError(
        error.code === "23505"
          ? "Ein Regal mit diesem Namen gibt es schon."
          : "Das Regal konnte nicht geändert werden.",
      );
      return false;
    }
    await reload();
    return true;
  }

  async function loadDemoIntoAccount() {
    const supabase = getSupabase();
    if (!supabase || mode !== "live") return false;
    const { error } = await supabase.rpc("create_demo_cellar");
    if (error) {
      setError("Der Beispielkeller konnte nicht angelegt werden (sind die Seed-Daten eingespielt?).");
      return false;
    }
    await reload();
    return true;
  }

  return {
    mode,
    data,
    error,
    addBottles,
    openBottles,
    setValue,
    setPurchasePrice,
    addRack,
    updateRack,
    loadDemoIntoAccount,
  };
}

type Loaded = { orgId: string | null; data: CellarData } | { error: string };

async function loadCellar(userId: string): Promise<Loaded | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const [profile, items, events, valuations, racks] = await Promise.all([
    supabase.from("profiles").select("personal_org_id").eq("id", userId).maybeSingle(),
    supabase
      .from("cellar_items")
      .select(
        "id, quantity, purchase_price, purchased_on, drink_from, drink_until, rack_id, storage_compartment, storage_row, vintage_id, wine_vintages(vintage, wine_id, wines(producer, name, color, classification, label_path, grape_varieties(name), regions(name)))",
      )
      .order("purchased_on"),
    supabase.from("cellar_events").select("id, cellar_item_id, kind, quantity, unit_price, happened_on"),
    supabase.from("cellar_valuations").select("id, cellar_item_id, value, source, valued_on"),
    supabase.from("cellar_racks").select("id, name, compartments, rows").order("name"),
  ]);
  if (items.error || events.error || valuations.error || racks.error)
    return { error: "Der Keller konnte nicht geladen werden." };
  return {
    orgId: profile.data?.personal_org_id ?? null,
    data: {
      asOf: Date.now(),
      racks: racks.data ?? [],
      items: (items.data ?? []).map(mapItem),
      events: (events.data ?? []).map((e) => ({
        id: e.id,
        itemId: e.cellar_item_id,
        kind: e.kind,
        quantity: e.quantity,
        unitPrice: e.unit_price === null ? null : Number(e.unit_price),
        date: e.happened_on,
      })),
      valuations: (valuations.data ?? []).map((v) => ({
        id: v.id,
        itemId: v.cellar_item_id,
        value: Number(v.value),
        source: v.source,
        date: v.valued_on,
      })),
    },
  };
}

type Row = {
  id: string;
  quantity: number;
  purchase_price: number | string | null;
  purchased_on: string | null;
  drink_from: number | null;
  drink_until: number | null;
  rack_id: string | null;
  storage_compartment: string | null;
  storage_row: string | null;
  vintage_id: string | null;
  wine_vintages: unknown;
};

type JoinedVintage = {
  vintage: number | null;
  wine_id: string;
  wines: {
    label_path: string | null;
    producer: string;
    name: string | null;
    color: CellarWine["color"];
    classification: string | null;
    grape_varieties: { name: string } | null;
    regions: { name: string } | null;
  } | null;
} | null;

function mapItem(row: Row): CellarWine {
  const v = row.wine_vintages as JoinedVintage;
  const w = v?.wines;
  return {
    id: row.id,
    producer: w?.producer ?? "Unbekannt",
    name: w?.name ?? "",
    vintage: v?.vintage ?? null,
    color: w?.color ?? "white",
    grape: w?.grape_varieties?.name ?? null,
    region: w?.regions?.name ?? null,
    classification: w?.classification ?? null,
    quantity: row.quantity,
    purchasePrice: row.purchase_price === null ? null : Number(row.purchase_price),
    purchasedOn: row.purchased_on ?? today(),
    drinkFrom: row.drink_from,
    drinkUntil: row.drink_until,
    rackId: row.rack_id,
    compartment: row.storage_compartment,
    row: row.storage_row,
    vintageId: row.vintage_id,
    wineId: v?.wine_id ?? null,
    labelUrl: labelUrl(w?.label_path),
  };
}

export type { CellarEvent, Valuation };
