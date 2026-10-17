"use client";

import { getSupabase } from "@/lib/supabase";
import type {
  Catalog,
  CostItem,
  EventData,
  EventInfo,
  EventInput,
  GlassInput,
  Guess,
  NewWine,
  Participant,
  Secret,
  Structure,
} from "./types";

// All reads go straight to Supabase; RLS decides what comes back. A guest gets
// no answer key and no foreign guesses before a glass is revealed.

type Row = Record<string, unknown>;
const num = (value: unknown) => (value === null || value === undefined ? null : Number(value));

function toEvent(r: Row): EventInfo {
  return {
    id: r.id as string,
    title: r.title as string,
    theme: (r.theme as string) ?? null,
    startsAt: (r.starts_at as string) ?? null,
    location: (r.location as string) ?? null,
    invitationText: (r.invitation_text as string) ?? null,
    participantLimit: num(r.participant_limit),
    status: r.status as EventInfo["status"],
    isBlind: Boolean(r.is_blind),
    pirateMode: Boolean(r.pirate_mode),
    inviteCode: r.invite_code as string,
    organizerId: r.organizer_id as string,
    photoPath: (r.photo_path as string) ?? null,
  };
}

function toParticipant(r: Row): Participant {
  return {
    id: r.id as string,
    userId: (r.user_id as string) ?? null,
    name: r.display_name as string,
    role: r.role as Participant["role"],
    rsvp: r.rsvp as Participant["rsvp"],
  };
}

function toSecret(r: Row): Secret {
  const v = r.wine_vintages as Row | null;
  const w = (v?.wines as Row | null) ?? null;
  return {
    glassId: r.event_wine_id as string,
    isPirate: Boolean(r.is_pirate),
    price: num(r.price),
    broughtBy: (r.brought_by as string) ?? null,
    referenceStructure: (r.reference_structure as Structure) ?? null,
    referenceAromas: (r.reference_aromas as string[]) ?? [],
    wine:
      v && w
        ? {
            vintageId: r.vintage_id as string,
            wineId: w.id as string,
            producer: w.producer as string,
            name: (w.name as string) ?? null,
            color: w.color as NonNullable<Secret["wine"]>["color"],
            vintage: num(v.vintage),
            classification: (w.classification as string) ?? null,
            grapeId: (w.grape_variety_id as string) ?? null,
            regionId: (w.region_id as string) ?? null,
            siteId: (w.site_id as string) ?? null,
          }
        : null,
  };
}

function toGuess(r: Row): Guess {
  return {
    id: r.id as string,
    glassId: r.event_wine_id as string,
    participantId: r.participant_id as string,
    structure: (r.structure as Structure) ?? {},
    aromas: (r.aromas as string[]) ?? [],
    grapeId: (r.grape_variety_id as string) ?? null,
    countryCode: (r.country_code as string) ?? null,
    regionId: (r.region_id as string) ?? null,
    siteId: (r.site_id as string) ?? null,
    vintage: num(r.vintage),
    price: num(r.price),
    rating: num(r.rating),
    markedPirate: Boolean(r.marked_pirate),
  };
}

const SECRET_COLUMNS =
  "event_wine_id, vintage_id, is_pirate, price, brought_by, reference_structure, reference_aromas, " +
  "wine_vintages(vintage, wines(id, producer, name, color, classification, grape_variety_id, region_id, site_id))";

export async function fetchEventData(eventId: string): Promise<EventData | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const [event, participants, glasses, secrets, guesses, scores, costs, progress] = await Promise.all([
    supabase.from("events").select("*").eq("id", eventId).maybeSingle(),
    supabase.from("event_participants").select("*").eq("event_id", eventId).order("joined_at"),
    supabase.from("event_wines").select("*").eq("event_id", eventId).order("glass_number"),
    supabase.from("event_wine_secrets").select(SECRET_COLUMNS).eq("event_id", eventId),
    supabase.from("guesses").select("*").eq("event_id", eventId),
    supabase
      .from("scores")
      .select("event_wine_id, participant_id, points, breakdown")
      .eq("event_id", eventId),
    supabase.from("cost_items").select("*").eq("event_id", eventId).order("created_at"),
    supabase.rpc("glass_progress", { p_event_id: eventId }),
  ]);
  if (!event.data) return null;

  const handedIn: Record<string, string[]> = {};
  for (const row of (progress.data ?? []) as Row[]) {
    (handedIn[row.event_wine_id as string] ??= []).push(row.participant_id as string);
  }

  return {
    event: toEvent(event.data),
    participants: (participants.data ?? []).map(toParticipant),
    glasses: (glasses.data ?? []).map((r) => ({
      id: r.id,
      number: r.glass_number,
      status: r.status,
      openedAt: r.opened_at,
      revealedAt: r.revealed_at,
    })),
    secrets: ((secrets.data ?? []) as unknown as Row[]).map(toSecret),
    guesses: (guesses.data ?? []).map(toGuess),
    scores: (scores.data ?? []).map((r) => ({
      glassId: r.event_wine_id,
      participantId: r.participant_id,
      points: r.points,
      breakdown: r.breakdown ?? {},
    })),
    costs: (costs.data ?? []).map((r): CostItem => ({
      id: r.id,
      paidBy: r.paid_by,
      glassId: r.event_wine_id,
      description: r.description,
      amount: Number(r.amount),
      createdBy: r.created_by,
    })),
    progress: handedIn,
  };
}

let catalogCache: Promise<Catalog> | null = null;

/** Grapes, regions and sites for the Rate-Bogen. Public reference data, loaded once. */
export function fetchCatalog(): Promise<Catalog> {
  const supabase = getSupabase();
  if (!supabase) return Promise.resolve({ grapes: [], regions: [], sites: [] });
  catalogCache ??= Promise.all([
    supabase.from("grape_varieties").select("id, name, color").order("name"),
    supabase.from("regions").select("id, name, country_code").order("name"),
    supabase.from("vineyard_sites").select("id, name, village, region_id").order("name"),
  ]).then(([grapes, regions, sites]) => {
    if (grapes.error || regions.error || sites.error) catalogCache = null;
    return {
      grapes: grapes.data ?? [],
      regions: (regions.data ?? []).map((r) => ({ id: r.id, name: r.name, countryCode: r.country_code })),
      sites: (sites.data ?? []).map((s) => ({
        id: s.id,
        name: s.name,
        village: s.village,
        regionId: s.region_id,
      })),
    };
  });
  return catalogCache;
}

/** Forget the cached catalogue, e.g. after the organizer added a new grape. */
export function refreshCatalog() {
  catalogCache = null;
}

// --- organizer ---------------------------------------------------------------

function eventColumns(input: EventInput) {
  return {
    title: input.title.trim(),
    theme: input.theme?.trim() || null,
    starts_at: input.startsAt,
    location: input.location?.trim() || null,
    invitation_text: input.invitationText?.trim() || null,
    participant_limit: input.participantLimit,
    is_blind: input.isBlind,
    pirate_mode: input.pirateMode,
  };
}

export async function createEvent(input: EventInput) {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase.from("events").insert(eventColumns(input)).select("id").single();
  if (error) throw error;
  return data.id as string;
}

export async function updateEvent(eventId: string, input: EventInput) {
  const supabase = getSupabase();
  if (!supabase) return;
  const { error } = await supabase.from("events").update(eventColumns(input)).eq("id", eventId);
  if (error) throw error;
}

export async function setEventStatus(eventId: string, status: EventInfo["status"]) {
  const { error } = await getSupabase()!.from("events").update({ status }).eq("id", eventId);
  if (error) throw error;
}

export async function deleteEvent(eventId: string) {
  const { error } = await getSupabase()!.from("events").delete().eq("id", eventId);
  if (error) throw error;
}

export async function ensureWine(wine: NewWine) {
  const { data, error } = await getSupabase()!.rpc("ensure_wine_vintage", {
    p_producer: wine.producer,
    p_name: wine.name,
    p_color: wine.color,
    p_vintage: wine.vintage,
    p_grape_name: wine.grape,
    p_region_id: wine.regionId,
    p_site_id: wine.siteId,
    p_classification: wine.classification,
  });
  if (error) throw error;
  refreshCatalog();
  return data as string;
}

export async function saveGlass(eventId: string, glass: GlassInput) {
  const { data, error } = await getSupabase()!.rpc("save_event_glass", {
    p_event_id: eventId,
    p_glass_number: glass.number,
    p_vintage_id: glass.vintageId,
    p_price: glass.price,
    p_is_pirate: glass.isPirate,
    p_brought_by: glass.broughtBy,
    p_reference_structure: glass.referenceStructure,
    p_reference_aromas: glass.referenceAromas,
  });
  if (error) throw error;
  return data as string;
}

export async function deleteGlass(glassId: string) {
  const { error } = await getSupabase()!.from("event_wines").delete().eq("id", glassId);
  if (error) throw error;
}

export async function reorderGlasses(eventId: string, order: string[]) {
  const { error } = await getSupabase()!.rpc("reorder_event_glasses", {
    p_event_id: eventId,
    p_order: order,
  });
  if (error) throw error;
}

export async function roundAction(action: "open_glass" | "close_glass" | "reveal_glass", glassId: string) {
  const { error } = await getSupabase()!.rpc(action, { p_event_wine_id: glassId });
  if (error) throw error;
}

export async function addOfflineGuest(eventId: string, name: string) {
  const { error } = await getSupabase()!
    .from("event_participants")
    .insert({ event_id: eventId, display_name: name.trim(), rsvp: "yes" });
  if (error) throw error;
}

export async function setParticipantRsvp(participantId: string, rsvp: Participant["rsvp"]) {
  const { error } = await getSupabase()!.from("event_participants").update({ rsvp }).eq("id", participantId);
  if (error) throw error;
}

export async function removeParticipant(participantId: string) {
  const { error } = await getSupabase()!.from("event_participants").delete().eq("id", participantId);
  if (error) throw error;
}

export async function addCost(
  eventId: string,
  item: { paidBy: string | null; description: string; amount: number; glassId?: string | null },
) {
  const { error } = await getSupabase()!
    .from("cost_items")
    .insert({
      event_id: eventId,
      paid_by: item.paidBy,
      description: item.description.trim(),
      amount: item.amount,
      event_wine_id: item.glassId ?? null,
    });
  if (error) throw error;
}

export async function deleteCost(id: string) {
  const { error } = await getSupabase()!.from("cost_items").delete().eq("id", id);
  if (error) throw error;
}

// --- guests --------------------------------------------------------------------

export type GuessInput = Omit<Guess, "id" | "glassId" | "participantId">;

/** Hands in (or changes) the own guess while the glass is open. */
export async function submitGuess(
  eventId: string,
  glassId: string,
  participantId: string,
  existingId: string | null,
  guess: GuessInput,
) {
  const supabase = getSupabase()!;
  const columns = {
    structure: guess.structure,
    aromas: guess.aromas,
    grape_variety_id: guess.grapeId,
    country_code: guess.countryCode,
    region_id: guess.regionId,
    site_id: guess.siteId,
    vintage: guess.vintage,
    price: guess.price,
    rating: guess.rating,
    marked_pirate: guess.markedPirate,
  };
  const { error } = existingId
    ? await supabase.from("guesses").update(columns).eq("id", existingId)
    : await supabase
        .from("guesses")
        .insert({ ...columns, event_id: eventId, event_wine_id: glassId, participant_id: participantId });
  if (error) throw error;
}

// --- picking wines for a glass ------------------------------------------------

export type WineChoice = {
  vintageId: string;
  producer: string;
  name: string | null;
  vintage: number | null;
  color: NewWine["color"];
  price: number | null;
  source: "cellar" | "catalogue";
  quantity?: number;
};

export async function fetchWineChoices(): Promise<WineChoice[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const [cellar, catalogue] = await Promise.all([
    supabase
      .from("cellar_items")
      .select("quantity, purchase_price, vintage_id, wine_vintages(vintage, wines(producer, name, color))")
      .gt("quantity", 0),
    supabase.from("wine_vintages").select("id, vintage, wines(producer, name, color)").limit(500),
  ]);
  const fromCellar = ((cellar.data ?? []) as unknown as Row[]).flatMap((r): WineChoice[] => {
    const v = r.wine_vintages as Row | null;
    const w = v?.wines as Row | null;
    if (!v || !w) return [];
    return [
      {
        vintageId: r.vintage_id as string,
        producer: w.producer as string,
        name: (w.name as string) ?? null,
        vintage: num(v.vintage),
        color: w.color as WineChoice["color"],
        price: num(r.purchase_price),
        source: "cellar",
        quantity: Number(r.quantity),
      },
    ];
  });
  const inCellar = new Set(fromCellar.map((c) => c.vintageId));
  const fromCatalogue = ((catalogue.data ?? []) as unknown as Row[]).flatMap((r): WineChoice[] => {
    const w = r.wines as Row | null;
    if (!w || inCellar.has(r.id as string)) return [];
    return [
      {
        vintageId: r.id as string,
        producer: w.producer as string,
        name: (w.name as string) ?? null,
        vintage: num(r.vintage),
        color: w.color as WineChoice["color"],
        price: null,
        source: "catalogue",
      },
    ];
  });
  const byName = (a: WineChoice, b: WineChoice) =>
    `${a.producer} ${a.name}`.localeCompare(`${b.producer} ${b.name}`, "de");
  return [...fromCellar.sort(byName), ...fromCatalogue.sort(byName)];
}

// --- evening photo ----------------------------------------------------------------

const PHOTO_BUCKET = "event-photos";

/** Shrinks a camera photo to max. 1600 px JPEG - small uploads, and the location data is gone. */
async function shrink(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("image"))), "image/jpeg", 0.85),
  );
}

const randomId = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(8)), (b) => b.toString(16).padStart(2, "0")).join("");

export async function uploadEventPhoto(eventId: string, file: File) {
  const supabase = getSupabase()!;
  const blob = await shrink(file);
  const path = `${eventId}/${randomId()}.jpg`;
  const { error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(path, blob, { contentType: "image/jpeg" });
  if (error) throw error;
  const { error: setError } = await supabase.rpc("set_event_photo", { p_event_id: eventId, p_path: path });
  if (setError) throw setError;
  return path;
}

/** Short-lived links to private photos (they expire after an hour). */
export async function photoUrls(paths: string[]): Promise<Record<string, string>> {
  const supabase = getSupabase();
  if (!supabase || paths.length === 0) return {};
  const { data } = await supabase.storage.from(PHOTO_BUCKET).createSignedUrls(paths, 3600);
  return Object.fromEntries(
    (data ?? []).flatMap((d) => (d.path && d.signedUrl ? [[d.path, d.signedUrl]] : [])),
  );
}

export type PatchInfo = {
  eventId: string;
  title: string;
  startsAt: string | null;
  location: string | null;
  /** Places 1-3 by points. */
  podium: string[];
  /** Everyone who said yes. */
  guests: string[];
  photoPath: string | null;
};

/** Every finished evening you were part of - the patches for the collection. */
export async function fetchPatches(): Promise<PatchInfo[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data } = await supabase
    .from("events")
    .select(
      "id, title, starts_at, location, photo_path, event_participants(id, display_name, rsvp), scores(participant_id, points)",
    )
    .eq("status", "finished")
    .order("starts_at", { ascending: false });
  return ((data ?? []) as unknown as Row[]).map((e) => {
    const totals = new Map<string, number>();
    for (const s of (e.scores as Row[]) ?? [])
      totals.set(
        s.participant_id as string,
        (totals.get(s.participant_id as string) ?? 0) + Number(s.points),
      );
    const people = (e.event_participants as Row[]) ?? [];
    const podium = [...totals.entries()]
      .filter(([, points]) => points > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .flatMap(([id]) => {
        const name = people.find((p) => p.id === id)?.display_name as string | undefined;
        return name ? [name] : [];
      });
    return {
      eventId: e.id as string,
      title: e.title as string,
      startsAt: (e.starts_at as string) ?? null,
      location: (e.location as string) ?? null,
      podium,
      guests: people.filter((p) => p.rsvp === "yes").map((p) => p.display_name as string),
      photoPath: (e.photo_path as string) ?? null,
    };
  });
}
