"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { photoUrls, uploadEventPhoto } from "@/lib/events/api";
import type { EventInfo } from "@/lib/events/types";
import { tick } from "@/lib/haptics";
import { EventPatch } from "./event-patch";

/** The evening's patch with a button to take (or change) the photo. */
export function PatchCard({
  event,
  winner,
  canEdit,
  onChange,
}: {
  event: EventInfo;
  winner: string | null;
  canEdit: boolean;
  onChange: () => Promise<void>;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!event.photoPath) return;
    let active = true;
    photoUrls([event.photoPath]).then((urls) => active && setUrl(urls[event.photoPath!] ?? null));
    return () => {
      active = false;
    };
  }, [event.photoPath]);

  async function pick(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      await uploadEventPhoto(event.id, file);
      tick("major");
      await onChange();
    } catch {
      setError("Das Foto konnte nicht hochgeladen werden. Bitte noch einmal versuchen.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <Card className="space-y-4 text-center">
      <p className="text-xs font-medium tracking-[0.14em] text-accent uppercase">Euer Abend-Patch</p>
      <EventPatch
        key={url ?? "none"}
        title={event.title}
        startsAt={event.startsAt}
        winner={winner}
        photoUrl={event.photoPath ? url : null}
        className="mx-auto w-full max-w-64"
      />
      <p className="text-sm text-muted">
        {event.photoPath
          ? "Liegt jetzt in der Sammlung von allen, die dabei waren."
          : "Ein Foto von der Runde oder der Flasche des Abends macht ihn zur Erinnerung."}
      </p>
      {canEdit && (
        <>
          <input
            ref={input}
            type="file"
            accept="image/*"
            className="sr-only"
            tabIndex={-1}
            aria-hidden
            onChange={(e) => pick(e.target.files?.[0])}
          />
          <Button
            block
            variant={event.photoPath ? "secondary" : "primary"}
            loading={busy}
            onClick={() => input.current?.click()}
          >
            {event.photoPath ? "Foto ändern" : "📷 Foto für den Patch"}
          </Button>
          <p className="text-xs text-muted">Nur für Leute dieses Abends sichtbar.</p>
        </>
      )}
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </Card>
  );
}
