"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { NotConfigured } from "@/components/app/not-configured";
import { PageHeader } from "@/components/app/page-header";
import { useSession } from "@/components/app/session-provider";
import { PatchTile } from "@/components/event/patch-gallery";
import { Avatar } from "@/components/ui/avatar";
import { Button, buttonClasses } from "@/components/ui/button";
import { Card, Eyebrow } from "@/components/ui/card";
import { Pill } from "@/components/ui/chip";
import { APP_TAGLINE } from "@/config/app";
import { formatEventDate } from "@/lib/format";
import { getSupabase } from "@/lib/supabase";

type EventRow = {
  id: string;
  title: string;
  theme: string | null;
  starts_at: string | null;
  location: string | null;
  invite_code: string;
  organizer_id: string;
  pirate_mode: boolean;
  status: "draft" | "planned" | "live" | "finished";
  event_participants: { id: string; display_name: string; rsvp: string; role: string }[];
  event_wines: { id: string }[];
  scores: { participant_id: string; points: number }[];
};

async function fetchEvents(): Promise<EventRow[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data } = await supabase
    .from("events")
    .select(
      "id, title, theme, starts_at, location, invite_code, organizer_id, pirate_mode, status, " +
        "event_participants(id, display_name, rsvp, role), event_wines(id), scores(participant_id, points)",
    )
    .order("starts_at", { ascending: true, nullsFirst: false });
  return (data ?? []) as unknown as EventRow[];
}

const noop = () => () => {};

function daysUntil(iso: string | null) {
  if (!iso) return null;
  const start = new Date(iso);
  const today = new Date();
  return Math.round(
    (Date.UTC(start.getFullYear(), start.getMonth(), start.getDate()) -
      Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())) /
      86_400_000,
  );
}

function winnerOf(event: EventRow) {
  const totals = new Map<string, number>();
  for (const s of event.scores) totals.set(s.participant_id, (totals.get(s.participant_id) ?? 0) + s.points);
  const [best] = [...totals.entries()].sort((a, b) => b[1] - a[1]);
  if (!best) return null;
  const name = event.event_participants.find((p) => p.id === best[0])?.display_name;
  return name ? { name, points: best[1] } : null;
}

export function EventList() {
  const { ready, session, configured, isGuest } = useSession();
  const [events, setEvents] = useState<EventRow[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mounted = useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );

  const load = useCallback(() => fetchEvents().then(setEvents), []);

  useEffect(() => {
    if (!session) return;
    let active = true;
    fetchEvents().then((rows) => active && setEvents(rows));
    return () => {
      active = false;
    };
  }, [session]);

  async function createDemo() {
    const supabase = getSupabase();
    if (!supabase) return;
    setCreating(true);
    setError(null);
    const { error } = await supabase.rpc("create_demo_event");
    if (error) setError("Demo-Abend konnte nicht angelegt werden (sind die Seed-Daten eingespielt?).");
    await load();
    setCreating(false);
  }

  if (!configured) {
    return (
      <>
        <PageHeader eyebrow="Lagenabende" title={APP_TAGLINE} />
        <NotConfigured />
      </>
    );
  }

  if (!ready) return null;

  if (!session) {
    return (
      <>
        <PageHeader eyebrow="Lagenabende" title={APP_TAGLINE}>
          Abende organisieren, blind verkosten, gemeinsam raten – und am Ende wissen, wer die beste Nase hat.
        </PageHeader>
        <Link href="/login" className={buttonClasses({ size: "lg", block: true })}>
          Anmelden
        </Link>
      </>
    );
  }

  const upcoming = (events ?? []).filter((e) => e.status !== "finished");
  const past = (events ?? []).filter((e) => e.status === "finished").reverse();
  const [next, ...later] = upcoming;

  return (
    <>
      <div className="mb-6 flex items-end justify-between gap-3">
        <div className="space-y-1">
          <Eyebrow>Lagenabende</Eyebrow>
          <h1 className="text-[2.5rem] leading-[1.05]">Abende</h1>
        </div>
        {!isGuest && (
          <Link href="/abende/neu" className={buttonClasses({ variant: "secondary" })}>
            + Neu
          </Link>
        )}
      </div>

      {events === null ? (
        <p className="text-muted">Lade …</p>
      ) : events.length === 0 ? (
        <Card className="space-y-4">
          <p className="font-display text-2xl">Noch kein Abend geplant</p>
          <p className="text-sm text-muted">
            Leg deinen ersten Lagenabend an – oder probier es mit einem Demo-Abend mit acht Rieslingen und
            einem Piraten aus.
          </p>
          {!isGuest && (
            <div className="grid gap-2">
              <Link href="/abende/neu" className={buttonClasses({ block: true })}>
                Abend planen
              </Link>
              <Button variant="ghost" onClick={createDemo} loading={creating} block>
                Demo-Abend anlegen
              </Button>
            </div>
          )}
        </Card>
      ) : (
        <div className="space-y-6">
          {next && <NextEvent event={next} mine={next.organizer_id === session.user.id} mounted={mounted} />}

          {later.length > 0 && (
            <section className="space-y-2">
              <h2 className="font-sans text-sm font-medium text-muted">Danach</h2>
              {later.map((event) => (
                <EventRowCard
                  key={event.id}
                  event={event}
                  right={<Pill>{formatShort(event.starts_at)}</Pill>}
                />
              ))}
            </section>
          )}

          {past.length > 0 && (
            <section className="space-y-2">
              <h2 className="font-sans text-sm font-medium text-muted">Vergangene Abende</h2>
              {past.map((event) => {
                const winner = winnerOf(event);
                return (
                  <EventRowCard
                    key={event.id}
                    event={event}
                    href={`/abende/${event.id}/rueckblick`}
                    sub={winner ? `Gewinner: ${winner.name} · ${winner.points} P.` : undefined}
                    right={<Pill>Rückblick</Pill>}
                  />
                );
              })}
            </section>
          )}

          <PatchTile />

          {!isGuest && past.length === 0 && (
            <Button variant="ghost" onClick={createDemo} loading={creating} block>
              Demo-Abend anlegen
            </Button>
          )}
        </div>
      )}
      {error && (
        <p role="alert" className="mt-4 text-sm text-danger">
          {error}
        </p>
      )}
    </>
  );
}

const short = new Intl.DateTimeFormat("de-DE", { day: "numeric", month: "short", timeZone: "Europe/Berlin" });
const formatShort = (iso: string | null) => (iso ? short.format(new Date(iso)) : "offen");

function NextEvent({ event, mine, mounted }: { event: EventRow; mine: boolean; mounted: boolean }) {
  const days = mounted ? daysUntil(event.starts_at) : null;
  const yes = event.event_participants.filter((p) => p.rsvp === "yes");
  const live = event.status === "live";
  const label = live
    ? "Läuft gerade"
    : days === null
      ? "Nächster Lagenabend"
      : days <= 0
        ? "Nächster Lagenabend · heute"
        : days === 1
          ? "Nächster Lagenabend · morgen"
          : `Nächster Lagenabend · in ${days} Tagen`;

  return (
    <div className="space-y-3">
      <Link
        href={`/abende/${event.id}`}
        className="block space-y-3 rounded-card border p-5"
        style={{
          background: "linear-gradient(150deg, var(--curtain), var(--surface) 70%)",
          borderColor: "color-mix(in srgb, var(--accent) 35%, transparent)",
        }}
      >
        <p
          className={`text-xs font-medium tracking-[0.14em] uppercase ${live ? "text-danger" : "text-accent"}`}
        >
          {live ? "● " : ""}
          {label}
        </p>
        <div>
          <h2 className="text-3xl leading-tight">{event.title}</h2>
          <p className="text-sm text-muted">
            {formatEventDate(event.starts_at)}
            {event.location ? ` · ${event.location}` : ""} · {event.event_wines.length} Gläser
          </p>
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="flex -space-x-2">
            {yes.slice(0, 5).map((p) => (
              <Avatar key={p.id} name={p.display_name} className="size-8 text-xs ring-2 ring-surface" />
            ))}
          </div>
          <span className="flex flex-wrap justify-end gap-1.5">
            {mine && <Pill>Du lädst ein</Pill>}
            {event.pirate_mode && <Pill>Pirat an Bord</Pill>}
            <Pill className="bg-accent/15 text-accent">
              {yes.length} {yes.length === 1 ? "Zusage" : "Zusagen"}
            </Pill>
          </span>
        </div>
      </Link>
      <div className="grid grid-cols-2 gap-2">
        <Link href={`/abende/${event.id}/live`} className={buttonClasses({ size: "lg" })}>
          {live ? "Zur Verkostung" : mine ? "Runde starten" : "Verkostung"}
        </Link>
        <Link
          href={mine ? `/abende/${event.id}` : `/e/${event.invite_code}`}
          className={buttonClasses({ size: "lg", variant: "secondary" })}
        >
          {mine ? "Planen & Einladen" : "Einladung"}
        </Link>
      </div>
    </div>
  );
}

function EventRowCard({
  event,
  href,
  sub,
  right,
}: {
  event: EventRow;
  href?: string;
  sub?: string;
  right?: React.ReactNode;
}) {
  return (
    <Link
      href={href ?? `/abende/${event.id}`}
      className="flex items-center justify-between gap-3 rounded-card border border-border bg-surface p-4"
    >
      <span className="min-w-0">
        <span className="block truncate font-medium">{event.title}</span>
        <span className="block truncate text-sm text-muted">{sub ?? formatEventDate(event.starts_at)}</span>
      </span>
      {right}
    </Link>
  );
}
