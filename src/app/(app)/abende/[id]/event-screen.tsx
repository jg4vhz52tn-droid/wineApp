"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { NotConfigured } from "@/components/app/not-configured";
import { PageHeader } from "@/components/app/page-header";
import { useSession } from "@/components/app/session-provider";
import { CostsPanel } from "@/components/event/costs-panel";
import { EventForm } from "@/components/event/event-form";
import { GlassList } from "@/components/event/glass-list";
import { GuestPanel } from "@/components/event/guest-panel";
import { buttonClasses } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/chip";
import { Segmented } from "@/components/ui/segmented";
import { deleteEvent, updateEvent } from "@/lib/events/api";
import type { EventData } from "@/lib/events/types";
import { useEvent } from "@/lib/events/use-event";
import { formatEventDate } from "@/lib/format";

type Tab = "plan" | "guests" | "costs";

export function EventScreen() {
  const { id } = useParams<{ id: string }>();
  const { configured, ready, session } = useSession();
  const { data, catalog, reload } = useEvent(session ? id : null);
  const [tab, setTab] = useState<Tab>("plan");
  const [editing, setEditing] = useState(false);
  const router = useRouter();

  if (!configured) return <NotConfigured />;
  if (!ready || (session && data === undefined))
    return <p className="pt-20 text-center text-muted">Lade …</p>;
  if (!session || !data) {
    return (
      <div className="space-y-3 pt-20 text-center">
        <h1 className="text-3xl">Abend nicht gefunden</h1>
        <Link href="/abende" className="text-accent underline underline-offset-4">
          Zu deinen Abenden
        </Link>
      </div>
    );
  }

  const { event } = data;
  const isHost = event.organizerId === session.user.id;
  const me = data.participants.find((p) => p.userId === session.user.id);
  const host = data.participants.find((p) => p.role === "organizer");

  return (
    <div className="space-y-6">
      <Link href="/abende" className="text-sm text-muted">
        ← Abende
      </Link>
      <PageHeader
        eyebrow={isHost ? "Du lädst ein" : `${host?.name ?? "Gastgeber"} lädt ein`}
        title={event.title}
      >
        {event.theme && <span className="block">{event.theme}</span>}
        <span className="block">
          {formatEventDate(event.startsAt)}
          {event.location ? ` · ${event.location}` : ""}
        </span>
      </PageHeader>

      <MainAction data={data} isHost={isHost} />

      <Segmented
        label="Bereich"
        value={tab}
        onChange={setTab}
        options={
          isHost
            ? [
                { value: "plan", label: "Planen" },
                { value: "guests", label: "Gäste" },
                { value: "costs", label: "Kosten" },
              ]
            : [
                { value: "plan", label: "Abend" },
                { value: "costs", label: "Kosten" },
              ]
        }
      />

      {tab === "plan" && isHost && (
        <div className="space-y-6">
          {editing ? (
            <Card>
              <EventForm
                initial={event}
                organizerName={host?.name ?? null}
                submitLabel="Änderungen speichern"
                onSubmit={async (input) => {
                  await updateEvent(event.id, input);
                  await reload();
                  setEditing(false);
                }}
              />
            </Card>
          ) : (
            <Card className="flex items-center justify-between gap-3">
              <div className="min-w-0 space-y-1.5">
                <div className="flex flex-wrap gap-1.5">
                  {event.pirateMode && <Pill>Pirat an Bord</Pill>}
                  <Pill>{event.isBlind ? "Blind" : "Offen"}</Pill>
                  <Pill>
                    {event.participantLimit ? `${event.participantLimit} Plätze` : "ohne Platzlimit"}
                  </Pill>
                </div>
                {event.invitationText && (
                  <p className="line-clamp-2 text-sm text-muted">{event.invitationText}</p>
                )}
              </div>
              <button
                type="button"
                className="shrink-0 text-sm font-medium text-accent"
                onClick={() => setEditing(true)}
              >
                Bearbeiten
              </button>
            </Card>
          )}
          <GlassList data={data} catalog={catalog} onChange={reload} />
          <button
            type="button"
            className="w-full py-3 text-sm text-danger"
            onClick={async () => {
              if (!window.confirm("Diesen Abend mit allen Gläsern, Tipps und Punkten löschen?")) return;
              await deleteEvent(event.id).catch(() => null);
              router.push("/abende");
            }}
          >
            Abend löschen
          </button>
        </div>
      )}

      {tab === "plan" && !isHost && (
        <Card className="space-y-3">
          {event.invitationText && (
            <p className="leading-relaxed whitespace-pre-line text-muted">{event.invitationText}</p>
          )}
          <p className="text-sm">
            {data.glasses.length} {data.glasses.length === 1 ? "Glas" : "Gläser"}
            {event.pirateMode ? " · ein Pirat hat sich eingeschlichen" : ""}
          </p>
          <Link href={`/e/${event.inviteCode}`} className="text-sm font-medium text-accent">
            Einladung & Zusage ansehen →
          </Link>
        </Card>
      )}

      {tab === "guests" && isHost && <GuestPanel data={data} onChange={reload} />}
      {tab === "costs" && (
        <CostsPanel data={data} myParticipantId={me?.id} isOrganizer={isHost} onChange={reload} />
      )}
    </div>
  );
}

function MainAction({ data, isHost }: { data: EventData; isHost: boolean }) {
  const { event, glasses } = data;
  const live = `/abende/${event.id}/live`;
  if (event.status === "finished") {
    return (
      <div className="grid grid-cols-2 gap-2">
        <Link href={`/abende/${event.id}/rueckblick`} className={buttonClasses({ size: "lg" })}>
          Rückblick
        </Link>
        <Link href={live} className={buttonClasses({ size: "lg", variant: "secondary" })}>
          Alle Gläser
        </Link>
      </div>
    );
  }
  if (event.status === "live") {
    return (
      <Link href={live} className={buttonClasses({ size: "lg", block: true })}>
        ● Zur Live-Verkostung
      </Link>
    );
  }
  if (!isHost) {
    return (
      <Link href={live} className={buttonClasses({ size: "lg", block: true, variant: "secondary" })}>
        Zur Verkostung (startet am Abend)
      </Link>
    );
  }
  return glasses.length > 0 ? (
    <Link href={live} className={buttonClasses({ size: "lg", block: true })}>
      Verkostung starten
    </Link>
  ) : (
    <p className="rounded-control bg-surface-2/60 px-4 py-3 text-sm text-muted">
      Leg unten die Gläser an – danach kannst du die Verkostung starten.
    </p>
  );
}
