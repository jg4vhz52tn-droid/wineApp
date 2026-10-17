"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { fetchCatalog, fetchEventData } from "./api";
import type { Catalog, EventData } from "./types";

const LIVE_TABLES = ["event_wines", "event_participants", "scores", "cost_items"] as const;

/**
 * Everything about one evening, kept live: Supabase Realtime pushes changes
 * (glass poured, revealed, someone joined) and the hook reloads. While the
 * evening runs it also polls every few seconds - that covers "who has handed
 * in" and phones whose live connection dropped (screen lock, bad Wi-Fi).
 */
export function useEvent(eventId: string | null, { live = false }: { live?: boolean } = {}) {
  const [data, setData] = useState<EventData | null | undefined>(undefined);
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reload = useCallback(async () => {
    if (!eventId) return;
    const next = await fetchEventData(eventId);
    setData(next);
  }, [eventId]);

  useEffect(() => {
    fetchCatalog().then(setCatalog);
  }, []);

  useEffect(() => {
    if (!eventId) return;
    let active = true;
    fetchEventData(eventId).then((next) => active && setData(next));

    const supabase = getSupabase();
    if (!supabase) return;
    const schedule = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        fetchEventData(eventId).then((next) => active && setData(next));
      }, 120);
    };
    let channel = supabase.channel(`event:${eventId}`);
    for (const table of LIVE_TABLES) {
      channel = channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table, filter: `event_id=eq.${eventId}` },
        schedule,
      );
    }
    channel = channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table: "events", filter: `id=eq.${eventId}` },
      schedule,
    );
    channel.subscribe();

    const onVisible = () => document.visibilityState === "visible" && schedule();
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      active = false;
      if (timer.current) clearTimeout(timer.current);
      document.removeEventListener("visibilitychange", onVisible);
      supabase.removeChannel(channel);
    };
  }, [eventId]);

  useEffect(() => {
    if (!eventId || !live) return;
    let active = true;
    const id = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      fetchEventData(eventId).then((next) => active && setData(next));
    }, 4000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [eventId, live]);

  return { data, catalog, reload };
}
