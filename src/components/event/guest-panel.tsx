"use client";

import { useState, useSyncExternalStore } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { TextField } from "@/components/ui/field";
import { QrCode } from "@/components/ui/qr-code";
import { addOfflineGuest, removeParticipant, setParticipantRsvp } from "@/lib/events/api";
import type { EventData, Participant } from "@/lib/events/types";
import { formatEventDate } from "@/lib/format";
import { cn } from "@/lib/cn";

const noop = () => () => {};
const RSVP_LABEL = { yes: "dabei", no: "abgesagt", pending: "offen" } as const;

/** Share text through the phone's share sheet (WhatsApp, Signal …) or copy it. */
async function shareText(text: string, url: string) {
  try {
    if (navigator.share) {
      await navigator.share({ text, url });
      return "shared";
    }
    await navigator.clipboard.writeText(`${text}\n${url}`);
    return "copied";
  } catch {
    return null;
  }
}

/** Organizer: who's coming, live - plus link, QR code, reminder and follow-up. */
export function GuestPanel({ data, onChange }: { data: EventData; onChange: () => Promise<void> }) {
  const origin = useSyncExternalStore(
    noop,
    () => window.location.origin,
    () => "",
  );
  const [name, setName] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const { event, participants } = data;
  const inviteUrl = `${origin}/e/${event.inviteCode}`;
  const counts = {
    yes: participants.filter((p) => p.rsvp === "yes").length,
    no: participants.filter((p) => p.rsvp === "no").length,
    pending: participants.filter((p) => p.rsvp === "pending").length,
  };

  function flash(result: string | null) {
    if (!result) return;
    setToast(result === "copied" ? "Text und Link kopiert – jetzt im Chat einfügen." : "Geteilt.");
    setTimeout(() => setToast(null), 2500);
  }

  const when = formatEventDate(event.startsAt);
  const reminder = `Kurze Erinnerung: ${event.title} – ${when}${event.location ? `, ${event.location}` : ""}. Sagst du noch kurz zu oder ab?`;
  const followUp = `Danke für den schönen Abend „${event.title}“! Hier ist der Rückblick mit Gewinner, Lieblingswein und allen Punkten:`;
  const recapUrl = `${origin}/abende/${event.id}/rueckblick`;

  return (
    <div className="space-y-5">
      <Card className="space-y-4">
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm tabular-nums">
          <span className="text-success">● {counts.yes} dabei</span>
          <span className="text-danger">● {counts.no} abgesagt</span>
          <span className="text-muted">● {counts.pending} offen</span>
          {event.participantLimit && <span className="text-muted">von {event.participantLimit} Plätzen</span>}
        </div>
        <ul className="divide-y divide-border">
          {participants.map((p) => (
            <GuestRow key={p.id} participant={p} onChange={onChange} />
          ))}
        </ul>
        <form
          className="flex items-end gap-2"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!name.trim()) return;
            await addOfflineGuest(event.id, name).catch(() => null);
            setName("");
            await onChange();
          }}
        >
          <TextField
            className="flex-1"
            label="Gast ohne Handy hinzufügen"
            value={name}
            maxLength={40}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
          />
          <Button type="submit" variant="secondary" disabled={!name.trim()}>
            Hinzufügen
          </Button>
        </form>
      </Card>

      <Card className="space-y-4">
        <h3 className="text-xl">Einladen</h3>
        <div className="flex items-center gap-4">
          {origin && (
            <QrCode value={inviteUrl} label="QR-Code der Einladung" className="size-32 shrink-0 p-1" />
          )}
          <p className="text-sm text-muted">
            QR-Code am Tisch zeigen oder den Link in den Gruppenchat schicken. Gäste brauchen keine App und
            kein Konto.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Chip
            onClick={async () => flash(await shareText(`Komm mit zum Lagenabend: ${event.title}`, inviteUrl))}
          >
            Einladung teilen
          </Chip>
          <Chip
            onClick={async () => {
              await navigator.clipboard?.writeText(inviteUrl).catch(() => null);
              flash("copied");
            }}
          >
            Link kopieren
          </Chip>
          <a
            className="inline-flex h-11 items-center rounded-full border border-border bg-surface px-4 text-sm font-medium"
            href={`https://wa.me/?text=${encodeURIComponent(`Komm mit zum Lagenabend: ${event.title}\n${inviteUrl}`)}`}
            target="_blank"
            rel="noreferrer"
          >
            WhatsApp
          </a>
        </div>
        <div className="flex flex-wrap gap-2 border-t border-border pt-4">
          <Chip onClick={async () => flash(await shareText(reminder, inviteUrl))}>Erinnerung senden</Chip>
          <Chip onClick={async () => flash(await shareText(followUp, recapUrl))}>
            Follow-up nach dem Abend
          </Chip>
        </div>
        <p className="text-xs text-muted">
          Erinnerung und Follow-up gehen über dein Teilen-Menü, z. B. in die WhatsApp-Gruppe.
        </p>
        {toast && (
          <p role="status" className="text-sm text-accent">
            {toast}
          </p>
        )}
      </Card>
    </div>
  );
}

function GuestRow({ participant: p, onChange }: { participant: Participant; onChange: () => Promise<void> }) {
  const offline = p.userId === null;
  return (
    <li className="flex items-center gap-3 py-2.5">
      <Avatar name={p.name} className="size-9" />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{p.name}</span>
        <span className="text-xs text-muted">
          {p.role === "organizer" ? "Gastgeber" : offline ? "ohne Handy" : "per Link"}
        </span>
      </span>
      {p.role === "guest" && offline ? (
        <button
          type="button"
          className="text-xs text-muted underline underline-offset-4"
          onClick={async () => {
            await removeParticipant(p.id).catch(() => null);
            await onChange();
          }}
        >
          entfernen
        </button>
      ) : null}
      <button
        type="button"
        disabled={p.role === "organizer"}
        onClick={async () => {
          // The organizer can correct an answer, e.g. after a phone call.
          const next = p.rsvp === "yes" ? "no" : p.rsvp === "no" ? "pending" : "yes";
          await setParticipantRsvp(p.id, next).catch(() => null);
          await onChange();
        }}
        className={cn(
          "rounded-full px-3 py-1 text-xs font-medium",
          p.rsvp === "yes" && "bg-success/15 text-success",
          p.rsvp === "no" && "bg-danger/15 text-danger",
          p.rsvp === "pending" && "bg-surface-2 text-muted",
        )}
      >
        {RSVP_LABEL[p.rsvp]}
      </button>
    </li>
  );
}
