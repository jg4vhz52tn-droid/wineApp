"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { useParams } from "next/navigation";
import { useState } from "react";
import { NotConfigured } from "@/components/app/not-configured";
import { useSession } from "@/components/app/session-provider";
import { PatchCard } from "@/components/event/patch-card";
import { Leaderboard } from "@/components/live/leaderboard";
import { Bottle } from "@/components/tasting/bottle";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, Eyebrow } from "@/components/ui/card";
import { bottleShapeFor } from "@/config/bottles";
import {
  foundPirate,
  grapeHits,
  leaderboard,
  observations,
  splitCosts,
  wineDetails,
  wineRanking,
  wineTitle,
  type BoardRow,
} from "@/lib/events/derive";
import type { Catalog, EventData } from "@/lib/events/types";
import { useEvent } from "@/lib/events/use-event";
import { cn } from "@/lib/cn";

const fmt1 = (n: number) => n.toLocaleString("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const euro = (n: number) => n.toLocaleString("de-DE", { style: "currency", currency: "EUR" });

export function Recap() {
  const { id } = useParams<{ id: string }>();
  const { configured, ready, session } = useSession();
  const { data, catalog, reload } = useEvent(session ? id : null);

  if (!configured) return <NotConfigured />;
  if (!ready || (session && data === undefined))
    return <p className="pt-20 text-center text-muted">Lade …</p>;
  if (!session || !data) {
    return (
      <div className="space-y-3 pt-20 text-center">
        <h1 className="text-3xl">Rückblick nicht verfügbar</h1>
        <p className="text-muted">Den Rückblick sehen alle, die beim Abend dabei waren.</p>
      </div>
    );
  }
  return (
    <RecapContent
      data={data}
      catalog={catalog}
      meId={data.participants.find((p) => p.userId === session.user.id)?.id}
      onChange={reload}
    />
  );
}

export function RecapContent({
  data,
  catalog,
  meId,
  onChange,
}: {
  data: EventData;
  catalog: Catalog | null;
  meId?: string;
  /** Without it (styleguide) there is no photo button. */
  onChange?: () => Promise<void>;
}) {
  const board = leaderboard(data);
  const ranking = wineRanking(data);
  const favorite = ranking[0];
  const notes = observations(data, catalog);
  const costs = splitCosts(data.costs, data.participants);
  const revealed = data.glasses.filter((g) => g.status === "revealed").length;
  const winner = board[0];
  const myDebts = costs.transfers.filter((t) => t.from.id === meId);
  const [shared, setShared] = useState(false);

  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: `Rückblick: ${data.event.title}`, url });
      else {
        await navigator.clipboard.writeText(url);
        setShared(true);
      }
    } catch {
      // closed
    }
  }

  return (
    <div className="space-y-6">
      <Link href={`/abende/${data.event.id}`} className="text-sm text-muted">
        ← {data.event.title}
      </Link>
      <header className="space-y-1">
        <Eyebrow>Rückblick</Eyebrow>
        <h1 className="text-[2.5rem] leading-[1.05]">{data.event.title}</h1>
        <p className="text-muted">
          {revealed} von {data.glasses.length} Gläsern aufgedeckt · {board.length} Gäste
        </p>
      </header>

      {winner && winner.total > 0 ? (
        <Card className="space-y-5 overflow-hidden">
          <div>
            <p className="text-xs font-medium tracking-[0.14em] text-accent uppercase">
              Beste Nase des Abends
            </p>
            <h2 className="mt-1 font-display text-6xl leading-none">
              {winner.participant.name} <span className="text-accent">♛</span>
            </h2>
            <p className="mt-2 text-sm text-muted">
              {winner.total} Punkte · {grapeHits(data, winner.participant.id)} von {revealed} Rebsorten
              erkannt
              {foundPirate(data, winner.participant.id) ? " · hat den Piraten entlarvt" : ""}
            </p>
          </div>
          <Podium rows={board.slice(0, 3)} />
        </Card>
      ) : (
        <Card>
          <p className="text-muted">
            Noch keine Punkte – der Rückblick füllt sich mit jedem aufgedeckten Glas.
          </p>
        </Card>
      )}

      {favorite && (
        <Card className="flex items-center gap-4">
          <div className="relative shrink-0">
            <span aria-hidden className="absolute -top-3 left-1/2 -translate-x-1/2 text-2xl text-accent">
              ♛
            </span>
            <Bottle
              shape={bottleShapeFor(favorite.secret?.wine?.color ?? "white")}
              label={
                favorite.secret?.wine
                  ? {
                      producer: favorite.secret.wine.producer,
                      name: favorite.secret.wine.name ?? "",
                      vintage: favorite.secret.wine.vintage ?? undefined,
                      photo: favorite.secret.wine.labelUrl,
                    }
                  : null
              }
              className="h-40 w-auto"
            />
          </div>
          <div className="min-w-0 space-y-1">
            <p className="text-xs font-medium tracking-[0.14em] text-accent uppercase">
              Lieblingswein der Runde
            </p>
            <h3 className="text-2xl leading-tight">{wineTitle(favorite.secret?.wine)}</h3>
            <p className="text-sm text-muted">
              Glas {favorite.glass.number} · {wineDetails(favorite.secret?.wine, catalog)}
            </p>
            <p className="flex items-baseline gap-2 pt-1">
              <span className="font-display text-4xl text-accent">{fmt1(favorite.avg)}</span>
              <span className="text-xs text-muted">
                Ø Bewertung
                {favorite.favorites > 0 && ` · für ${favorite.favorites} der Favorit`}
              </span>
            </p>
          </div>
        </Card>
      )}

      {ranking.length > 1 && <WineBars ranking={ranking} />}

      {notes.map((note) => (
        <Card key={note.text} className="space-y-1.5">
          <p className="text-xs font-medium tracking-[0.14em] text-muted uppercase">Beobachtung</p>
          <p className="font-display text-2xl leading-tight">„{note.text}“</p>
          <p className="text-sm text-muted">{note.detail}</p>
        </Card>
      ))}

      <Leaderboard rows={board} me={meId} title="Endstand" />

      <PatchCard
        event={data.event}
        podium={board
          .filter((r) => r.total > 0)
          .slice(0, 3)
          .map((r) => r.participant.name)}
        guests={data.participants.filter((p) => p.rsvp === "yes").map((p) => p.name)}
        canEdit={Boolean(onChange)}
        onChange={onChange ?? (async () => {})}
      />

      {costs.total > 0 && (
        <Card className="space-y-2">
          <p className="text-xs font-medium tracking-[0.14em] text-muted uppercase">Kostenteilung</p>
          <p className="text-sm">
            {euro(costs.total)} insgesamt · {euro(costs.share)} pro Person
          </p>
          {myDebts.map((t) => (
            <p key={t.to.id} className="text-sm">
              Du schuldest {t.to.name} <b className="font-medium">{euro(t.amount)}</b>
            </p>
          ))}
          <Link href={`/abende/${data.event.id}`} className="text-sm text-accent">
            Details →
          </Link>
        </Card>
      )}

      <Button block variant="secondary" onClick={share}>
        {shared ? "Link kopiert" : "Rückblick teilen"}
      </Button>
      <p className="text-center text-xs text-muted">Sichtbar für alle, die beim Abend dabei waren.</p>
    </div>
  );
}

function Podium({ rows }: { rows: BoardRow[] }) {
  // 2 - 1 - 3, like a real podium.
  const order = [rows[1], rows[0], rows[2]].filter(Boolean);
  const height = (rank: number) => (rank === 1 ? 96 : rank === 2 ? 68 : 48);
  return (
    <div className="flex items-end justify-center gap-3" aria-label="Siegertreppchen">
      {order.map((row, i) => (
        <div key={row.participant.id} className="flex w-24 flex-col items-center gap-1.5">
          <Avatar
            name={row.participant.name}
            className={cn("size-11", row.rank === 1 && "bg-accent text-accent-fg")}
          />
          <span className="max-w-full truncate text-sm font-medium">{row.participant.name}</span>
          <span className="text-xs text-muted tabular-nums">{row.total} P.</span>
          <motion.span
            className="flex w-full items-start justify-center rounded-t-xl bg-surface-2 pt-2 font-display text-2xl"
            initial={{ height: 0 }}
            animate={{ height: height(row.rank) }}
            transition={{ delay: 0.2 + i * 0.15, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            {row.rank}
          </motion.span>
        </div>
      ))}
    </div>
  );
}

/** Average rating per wine on the 50-100 scale - one series, the favourite highlighted. */
function WineBars({ ranking }: { ranking: ReturnType<typeof wineRanking> }) {
  const [table, setTable] = useState(false);
  return (
    <Card className="space-y-3">
      <div className="flex items-baseline justify-between">
        <p className="text-xs font-medium tracking-[0.14em] text-muted uppercase">
          Ranking der Weine · Ø Bewertung
        </p>
        <button type="button" className="text-xs text-accent" onClick={() => setTable(!table)}>
          {table ? "Balken" : "Tabelle"}
        </button>
      </div>
      {table ? (
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-muted">
            <tr>
              <th className="py-1 font-normal">Glas</th>
              <th className="py-1 font-normal">Wein</th>
              <th className="py-1 text-right font-normal">Ø</th>
              <th className="py-1 text-right font-normal">Stimmen</th>
            </tr>
          </thead>
          <tbody>
            {ranking.map((r) => (
              <tr key={r.glass.id} className="border-t border-border">
                <td className="py-1.5">{r.glass.number}</td>
                <td className="py-1.5">{wineTitle(r.secret?.wine)}</td>
                <td className="py-1.5 text-right tabular-nums">{fmt1(r.avg)}</td>
                <td className="py-1.5 text-right tabular-nums">{r.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <ol className="space-y-2.5">
          {ranking.map((r, i) => (
            <li key={r.glass.id} className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 text-sm">
              <span className="truncate">
                <span className="text-muted">Glas {r.glass.number} · </span>
                {wineTitle(r.secret?.wine)}
              </span>
              <span className="font-medium tabular-nums">{fmt1(r.avg)}</span>
              <span className="col-span-2 h-2 rounded-full bg-surface-2">
                <motion.span
                  className="block h-full rounded-full"
                  style={{ background: i === 0 ? "var(--series-2)" : "var(--series-1)" }}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(2, ((r.avg - 50) / 50) * 100)}%` }}
                  transition={{ delay: 0.1 * i, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                />
              </span>
            </li>
          ))}
        </ol>
      )}
      <p className="text-xs text-muted">
        <span style={{ color: "var(--series-2)" }}>●</span> Lieblingswein der Runde · Skala 50–100 Punkte
      </p>
    </Card>
  );
}
