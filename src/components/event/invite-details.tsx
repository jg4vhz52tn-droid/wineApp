"use client";

import { useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { CalendarIcon, RouteIcon, ShareIcon } from "@/components/ui/icons";
import { downloadIcs, mapsUrl } from "@/lib/calendar";

type InviteDetailsProps = {
  eventId: string;
  title: string;
  startsAt: string | null;
  location: string | null;
  description: string | null;
  /** Path of the invite link, e.g. "/e/abc123". */
  invitePath: string;
  /** Names of confirmed guests - null when this person may not see them yet. */
  guests: string[] | null;
  confirmed: number;
};

function countdown(startsAt: string) {
  const start = new Date(startsAt);
  const today = new Date();
  const days = Math.round(
    (Date.UTC(start.getFullYear(), start.getMonth(), start.getDate()) -
      Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())) /
      86_400_000,
  );
  if (days < 0) return "Schon vorbei – hoffentlich war’s schön";
  if (days === 0) return "Heute ist es so weit";
  if (days === 1) return "Morgen geht’s los";
  return `Noch ${days} Tage`;
}

/** What's inside the ticket once it's torn open. */
export function InviteDetails({
  eventId,
  title,
  startsAt,
  location,
  description,
  invitePath,
  guests,
  confirmed,
}: InviteDetailsProps) {
  const [shared, setShared] = useState(false);

  const inviteUrl = () => new URL(invitePath, window.location.origin).toString();

  async function share() {
    const url = inviteUrl();
    const data = { title, text: `Komm mit zum Lagenabend: ${title}`, url };
    try {
      if (navigator.share) await navigator.share(data);
      else {
        await navigator.clipboard.writeText(url);
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      }
    } catch {
      // Share sheet closed - nothing to do.
    }
  }

  return (
    <div className="space-y-6">
      {startsAt && <p className="font-display text-3xl leading-tight">{countdown(startsAt)}</p>}

      <section className="space-y-3">
        <h3 className="font-sans text-sm font-medium text-muted">Wer ist dabei</h3>
        {guests && guests.length > 0 ? (
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2.5">
              {guests.slice(0, 5).map((name) => (
                <Avatar key={name} name={name} className="size-10 ring-2 ring-surface" />
              ))}
            </div>
            <p className="min-w-0 text-sm leading-snug">
              {guests.slice(0, 3).join(", ")}
              {guests.length > 3 && ` und ${guests.length - 3} weitere`}
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted">
            {confirmed} {confirmed === 1 ? "Zusage" : "Zusagen"} bisher. Sag zu, dann siehst du, wer kommt.
          </p>
        )}
      </section>

      <div className="grid grid-cols-3 gap-2">
        {startsAt && (
          <Action
            icon={<CalendarIcon />}
            label="Kalender"
            onClick={() =>
              downloadIcs({ id: eventId, title, start: startsAt, location, description, url: inviteUrl() })
            }
          />
        )}
        {location && <Action icon={<RouteIcon />} label="Route" href={mapsUrl(location)} />}
        <Action icon={<ShareIcon />} label={shared ? "Kopiert" : "Teilen"} onClick={share} />
      </div>
    </div>
  );
}

function Action({
  icon,
  label,
  onClick,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  href?: string;
}) {
  const className =
    "flex h-20 flex-col items-center justify-center gap-1.5 rounded-control bg-surface-2 text-sm font-medium text-fg transition active:scale-95 [&_svg]:text-accent";
  return href ? (
    <a href={href} target="_blank" rel="noreferrer" className={className}>
      {icon}
      {label}
    </a>
  ) : (
    <button type="button" onClick={onClick} className={className}>
      {icon}
      {label}
    </button>
  );
}
