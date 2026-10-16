"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { NotConfigured } from "@/components/app/not-configured";
import { PageHeader } from "@/components/app/page-header";
import { useSession } from "@/components/app/session-provider";
import { Button, buttonClasses } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/chip";
import { ArrowRightIcon } from "@/components/ui/icons";
import { APP_TAGLINE } from "@/config/app";
import { formatEventDate } from "@/lib/format";
import { getSupabase } from "@/lib/supabase";

type EventRow = {
  id: string;
  title: string;
  theme: string | null;
  starts_at: string | null;
  invite_code: string;
  organizer_id: string;
  pirate_mode: boolean;
};

async function fetchEvents(): Promise<EventRow[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data } = await supabase
    .from("events")
    .select("id, title, theme, starts_at, invite_code, organizer_id, pirate_mode")
    .order("starts_at", { ascending: true, nullsFirst: false });
  return data ?? [];
}

export function EventList() {
  const { ready, session, configured, isGuest } = useSession();
  const [events, setEvents] = useState<EventRow[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <>
      <PageHeader eyebrow="Lagenabende" title="Deine Abende" />

      {events === null ? (
        <p className="text-muted">Lade …</p>
      ) : events.length === 0 ? (
        <Card className="space-y-4">
          <p className="font-display text-2xl">Noch kein Abend geplant</p>
          <p className="text-sm text-muted">
            Abende anlegen kommt in Phase 1. Zum Ausprobieren kannst du einen Demo-Abend mit acht Rieslingen
            anlegen.
          </p>
          {!isGuest && (
            <Button onClick={createDemo} loading={creating} block>
              Demo-Abend anlegen
            </Button>
          )}
        </Card>
      ) : (
        <ul className="space-y-3">
          {events.map((event) => (
            <li key={event.id}>
              <Card className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {event.organizer_id === session.user.id && <Pill>Du lädst ein</Pill>}
                  {event.pirate_mode && <Pill>Pirat an Bord</Pill>}
                </div>
                <div>
                  <h2 className="text-2xl leading-tight">{event.title}</h2>
                  {event.theme && <p className="text-sm text-muted">{event.theme}</p>}
                </div>
                <p className="text-sm">{formatEventDate(event.starts_at)}</p>
                <Link
                  href={`/e/${event.invite_code}`}
                  className="inline-flex items-center gap-2 text-sm font-medium text-accent"
                >
                  Einladung ansehen <ArrowRightIcon className="size-4" />
                </Link>
              </Card>
            </li>
          ))}
        </ul>
      )}
      {error && (
        <p role="alert" className="mt-4 text-sm text-danger">
          {error}
        </p>
      )}
    </>
  );
}
