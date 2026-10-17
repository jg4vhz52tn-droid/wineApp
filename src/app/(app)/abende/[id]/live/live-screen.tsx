"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { NotConfigured } from "@/components/app/not-configured";
import { useSession } from "@/components/app/session-provider";
import { PatchCard } from "@/components/event/patch-card";
import { GuessForm } from "@/components/live/guess-form";
import { Leaderboard } from "@/components/live/leaderboard";
import { RevealResult } from "@/components/live/reveal-result";
import { VeiledBottle } from "@/components/tasting/veiled-bottle";
import { Avatar } from "@/components/ui/avatar";
import { Button, buttonClasses } from "@/components/ui/button";
import { Pill } from "@/components/ui/chip";
import { bottleShapeFor } from "@/config/bottles";
import { roundAction, setEventStatus } from "@/lib/events/api";
import {
  currentGlass,
  grapeName,
  leaderboard,
  nextPendingGlass,
  ownGuess,
  players,
  secretFor,
  siteName,
  wineDetails,
  wineTitle,
} from "@/lib/events/derive";
import type { Catalog, EventData, Glass } from "@/lib/events/types";
import { useEvent } from "@/lib/events/use-event";
import { cn } from "@/lib/cn";
import { tick } from "@/lib/haptics";

export function LiveScreen() {
  const { id } = useParams<{ id: string }>();
  const { configured, ready, session } = useSession();
  const { data, catalog, reload } = useEvent(session ? id : null, { live: true });

  if (!configured) return <NotConfigured />;
  if (!ready || (session && data === undefined))
    return <p className="pt-20 text-center text-muted">Lade …</p>;
  if (!session || !data) {
    return (
      <div className="space-y-4 pt-20 text-center">
        <h1 className="text-3xl">Kein Zugang</h1>
        <p className="text-muted">Öffne den Einladungslink, um bei diesem Abend mitzumachen.</p>
      </div>
    );
  }

  const isHost = data.event.organizerId === session.user.id;
  const me = data.participants.find((p) => p.userId === session.user.id);
  if (!isHost && !me) {
    return (
      <div className="space-y-4 pt-20 text-center">
        <h1 className="text-3xl">Du bist noch nicht dabei</h1>
        <Link href={`/e/${data.event.inviteCode}`} className={buttonClasses({ block: true })}>
          Zur Einladung
        </Link>
      </div>
    );
  }

  return <Live data={data} catalog={catalog} reload={reload} isHost={isHost} meId={me?.id} />;
}

function Live({
  data,
  catalog,
  reload,
  isHost,
  meId,
}: {
  data: EventData;
  catalog: Catalog | null;
  reload: () => Promise<void>;
  isHost: boolean;
  meId: string | undefined;
}) {
  const router = useRouter();
  const glass = currentGlass(data.glasses);
  const secret = glass ? secretFor(data, glass.id) : undefined;
  const revealed = glass?.status === "revealed";
  const wine = secret?.wine;
  const board = leaderboard(data, revealed ? glass?.id : null);
  const finished = data.event.status === "finished";

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <Link href={`/abende/${data.event.id}`} className="text-sm text-muted">
          ← {data.event.title}
        </Link>
        {finished ? (
          <Pill>Beendet</Pill>
        ) : (
          <Pill className="border border-danger/60 bg-transparent text-danger">● LIVE</Pill>
        )}
      </header>

      <GlassRail glasses={data.glasses} current={glass} />

      {glass ? (
        <div className="space-y-3">
          <div
            className="flex justify-center rounded-card py-6"
            style={{
              background:
                "radial-gradient(70% 55% at 50% 15%, color-mix(in oklab, var(--accent) 14%, transparent), transparent 70%), var(--surface-2)",
            }}
          >
            <VeiledBottle
              key={glass.id}
              revealed={revealed}
              glass={glass.number}
              bottle={
                wine
                  ? {
                      shape: bottleShapeFor(wine.color),
                      label: {
                        producer: wine.producer,
                        name: wine.name ?? "",
                        vintage: wine.vintage ?? undefined,
                      },
                    }
                  : null
              }
              className="h-72"
            />
          </div>
          <div className="text-center" aria-live="polite">
            {revealed ? (
              <>
                <h1 className="text-3xl leading-tight">{wineTitle(wine)}</h1>
                <p className="text-sm text-muted">
                  {wineDetails(wine, catalog)}
                  {secret?.price ? ` · ${Math.round(secret.price)} €` : ""}
                  {data.event.pirateMode ? (secret?.isPirate ? " · der Pirat!" : " · kein Pirat") : ""}
                </p>
              </>
            ) : (
              <>
                <h1 className="text-3xl">Glas {glass.number}</h1>
                <p className="text-sm text-muted">
                  {glass.status === "closed"
                    ? "Abgabe geschlossen – gleich wird aufgedeckt"
                    : "Was meinst du?"}
                </p>
                {isHost && wine && (
                  <p className="mt-1 text-xs text-muted">Nur du siehst: {wineTitle(wine)}</p>
                )}
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3 pt-6 text-center">
          <h1 className="text-3xl">Gleich geht’s los</h1>
          <p className="text-muted">
            {isHost
              ? "Schenk das erste Glas ein und starte die Runde."
              : "Warte, bis der Gastgeber das erste Glas einschenkt."}
          </p>
        </div>
      )}

      {glass && glass.status !== "revealed" && <Progress data={data} glass={glass} />}

      {isHost && !finished && <HostControls data={data} glass={glass} reload={reload} />}

      {!isHost && glass?.status === "open" && meId && (
        <GuessForm
          key={glass.id}
          eventId={data.event.id}
          glass={glass}
          participantId={meId}
          existing={ownGuess(data, glass.id, meId)}
          catalog={catalog}
          pirateMode={data.event.pirateMode}
          onSubmitted={reload}
        />
      )}

      {revealed && glass && (
        <>
          {!isHost && (
            <RevealResult
              secret={secret}
              guess={ownGuess(data, glass.id, meId)}
              score={data.scores.find((s) => s.glassId === glass.id && s.participantId === meId)}
              catalog={catalog}
              pirateMode={data.event.pirateMode}
            />
          )}
          <NewCard wine={wine} catalog={catalog} />
          <Leaderboard rows={board} me={meId} />
        </>
      )}

      {data.glasses.some((g) => g.status !== "pending") && (
        <PatchCard
          event={data.event}
          podium={board
            .filter((r) => r.total > 0)
            .slice(0, 3)
            .map((r) => r.participant.name)}
          guests={data.participants.filter((p) => p.rsvp === "yes").map((p) => p.name)}
          canEdit
          onChange={reload}
        />
      )}

      {finished && (
        <Button block size="lg" onClick={() => router.push(`/abende/${data.event.id}/rueckblick`)}>
          Zum Rückblick
        </Button>
      )}
    </div>
  );
}

function GlassRail({ glasses, current }: { glasses: Glass[]; current: Glass | null }) {
  if (glasses.length === 0) return null;
  return (
    <ol className="flex [scrollbar-width:none] gap-1.5 overflow-x-auto" aria-label="Gläser">
      {glasses.map((g) => (
        <li
          key={g.id}
          aria-current={g.id === current?.id ? "step" : undefined}
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-full font-display text-lg",
            g.id === current?.id
              ? "bg-accent text-accent-fg"
              : g.status === "revealed"
                ? "bg-surface-2 text-fg"
                : "border border-border text-muted",
          )}
        >
          {g.number}
        </li>
      ))}
      <li className="flex items-center pl-2 text-sm whitespace-nowrap text-muted">
        Glas {current?.number ?? 0} von {glasses.length}
      </li>
    </ol>
  );
}

/** Who has handed in - names only, never what they guessed. */
function Progress({ data, glass }: { data: EventData; glass: Glass }) {
  const done = new Set(data.progress[glass.id] ?? []);
  const all = players(data);
  if (all.length === 0) return null;
  return (
    <div className="space-y-2 rounded-control bg-surface-2/60 px-4 py-3">
      <p className="text-sm">
        <b className="font-medium">{[...done].filter((id) => all.some((p) => p.id === id)).length}</b> von{" "}
        {all.length} haben abgegeben
      </p>
      <div className="flex flex-wrap gap-1.5">
        {all.map((p) => (
          <span key={p.id} className={cn("relative", !done.has(p.id) && "opacity-35")} title={p.name}>
            <Avatar name={p.name} className="size-8 text-xs" />
            {done.has(p.id) && (
              <span className="absolute -right-0.5 -bottom-0.5 flex size-4 items-center justify-center rounded-full bg-success text-[0.6rem] text-white">
                ✓
              </span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}

function HostControls({
  data,
  glass,
  reload,
}: {
  data: EventData;
  glass: Glass | null;
  reload: () => Promise<void>;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const next = nextPendingGlass(data.glasses);

  async function run(label: string, action: () => Promise<void>) {
    setBusy(label);
    setError(null);
    try {
      await action();
      tick(label === "reveal" ? "major" : "medium");
      await reload();
    } catch {
      setError("Das hat nicht geklappt. Bitte noch einmal versuchen.");
    } finally {
      setBusy(null);
    }
  }

  if (data.glasses.length === 0) {
    return (
      <Link href={`/abende/${data.event.id}`} className={buttonClasses({ block: true, size: "lg" })}>
        Erst Gläser anlegen
      </Link>
    );
  }

  return (
    <div className="space-y-2">
      {glass && (glass.status === "open" || glass.status === "closed") ? (
        <>
          <Button
            block
            size="lg"
            loading={busy === "reveal"}
            onClick={() => run("reveal", () => roundAction("reveal_glass", glass.id))}
          >
            Aufdecken
          </Button>
          {glass.status === "open" ? (
            <Button
              block
              variant="secondary"
              loading={busy === "close"}
              onClick={() => run("close", () => roundAction("close_glass", glass.id))}
            >
              Abgabe schließen
            </Button>
          ) : (
            <Button
              block
              variant="ghost"
              loading={busy === "open"}
              onClick={() => run("open", () => roundAction("open_glass", glass.id))}
            >
              Abgabe wieder öffnen
            </Button>
          )}
        </>
      ) : next ? (
        <Button
          block
          size="lg"
          loading={busy === "open"}
          onClick={() => run("open", () => roundAction("open_glass", next.id))}
        >
          Glas {next.number} einschenken
        </Button>
      ) : (
        <Button
          block
          size="lg"
          loading={busy === "finish"}
          onClick={() =>
            run("finish", async () => {
              await setEventStatus(data.event.id, "finished");
              router.push(`/abende/${data.event.id}/rueckblick`);
            })
          }
        >
          Abend beenden & Rückblick
        </Button>
      )}
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

/** Collectible cards the reveal just handed out. */
function NewCard({
  wine,
  catalog,
}: {
  wine: EventData["secrets"][number]["wine"] | undefined;
  catalog: Catalog | null;
}) {
  const names = [siteName(catalog, wine?.siteId ?? null), grapeName(catalog, wine?.grapeId ?? null)].filter(
    Boolean,
  );
  if (names.length === 0) return null;
  return (
    <div className="flex items-center justify-between gap-3 rounded-control border border-accent/60 px-4 py-3">
      <span className="text-sm">
        ✦ {names.length === 1 ? "Neue Sammelkarte" : "Neue Sammelkarten"}:{" "}
        <b className="font-medium">{names.join(" · ")}</b>
      </span>
    </div>
  );
}
