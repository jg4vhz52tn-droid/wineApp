"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useSession } from "@/components/app/session-provider";
import { PriceCheck } from "@/components/cellar/price-check";
import { AromaWheel } from "@/components/tasting/aroma-wheel";
import { Bottle } from "@/components/tasting/bottle";
import { StructureDials } from "@/components/tasting/structure-dials";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, Eyebrow } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { TextArea } from "@/components/ui/field";
import { SwitchRow } from "@/components/ui/switch";
import { TickDial } from "@/components/ui/tick-dial";
import { AROMA_COLOR } from "@/config/aromas";
import { bottleShapeFor } from "@/config/bottles";
import { describeRating, STRUCTURE_SCALES, type StructureKey } from "@/config/tasting";
import { tick } from "@/lib/haptics";
import { usePriceHistory } from "@/lib/prices";
import { deleteReview, fetchReviews, fetchWine, saveReview, type Review, type WineDetail } from "@/lib/wines";

const fmt = (n: number) => n.toLocaleString("de-DE", { maximumFractionDigits: 1 });
const dateFmt = new Intl.DateTimeFormat("de-DE", { day: "numeric", month: "short", year: "numeric" });

export function WineScreen() {
  const { id } = useParams<{ id: string }>();
  const { ready, session, isGuest } = useSession();
  const [wine, setWine] = useState<WineDetail | null | undefined>(undefined);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [vintageId, setVintageId] = useState<string | null>(null);

  const loadReviews = useCallback(() => fetchReviews(id).then(setReviews), [id]);

  useEffect(() => {
    if (!session) return;
    let active = true;
    fetchWine(id).then((w) => {
      if (!active) return;
      setWine(w);
      setVintageId((current) => current ?? w?.vintageIds[0]?.id ?? null);
    });
    fetchReviews(id).then((r) => active && setReviews(r));
    return () => {
      active = false;
    };
  }, [id, session]);

  const prices = usePriceHistory(vintageId);

  if (ready && !session) {
    return <p className="pt-20 text-center text-muted">Bitte melde dich an, um Weine zu sehen.</p>;
  }
  if (wine === undefined) return <p className="pt-20 text-center text-muted">Lade …</p>;
  if (wine === null) return <p className="pt-20 text-center text-muted">Wein nicht gefunden.</p>;

  const rated = reviews.filter((r) => r.rating !== null);
  const avg = rated.length ? rated.reduce((s, r) => s + r.rating!, 0) / rated.length : null;
  const aromaCount = new Map<string, number>();
  for (const r of reviews) for (const a of r.aromas) aromaCount.set(a, (aromaCount.get(a) ?? 0) + 1);
  const topAromas = [...aromaCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  const vintage = wine.vintageIds.find((v) => v.id === vintageId)?.vintage ?? null;

  return (
    <div className="space-y-6">
      <Link href="/keller/weine" className="text-sm text-muted">
        ← Meine Weine
      </Link>

      <div className="flex gap-4">
        <Bottle
          shape={bottleShapeFor(wine.color)}
          label={{
            producer: wine.producer,
            name: wine.name ?? wine.producer,
            vintage: vintage ?? undefined,
            photo: wine.labelUrl,
          }}
          className="h-52 w-28 shrink-0"
        />
        <div className="min-w-0 space-y-2 pt-2">
          <Eyebrow>{wine.producer}</Eyebrow>
          <h1 className="text-3xl leading-tight">{wine.name ?? wine.producer}</h1>
          <p className="text-sm text-muted">
            {[wine.grape, wine.region, wine.classification].filter(Boolean).join(" · ")}
          </p>
          {avg !== null ? (
            <p className="flex items-baseline gap-2">
              <span className="font-display text-4xl text-accent tabular-nums">{fmt(avg)}</span>
              <span className="text-xs text-muted">
                Ø aus {rated.length} {rated.length === 1 ? "Bewertung" : "Bewertungen"}
              </span>
            </p>
          ) : (
            <p className="text-sm text-muted">Noch keine Bewertungen – sei die erste Stimme.</p>
          )}
        </div>
      </div>

      {topAromas.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Das schmecken die anderen</p>
          <div className="flex flex-wrap gap-1.5">
            {topAromas.map(([aroma, n]) => (
              <span
                key={aroma}
                className="rounded-full px-3 py-1 text-xs font-medium text-[#1a0f12]"
                style={{ background: AROMA_COLOR.get(aroma) ?? "var(--surface-2)" }}
              >
                {aroma} {n > 1 && <span className="opacity-60">×{n}</span>}
              </span>
            ))}
          </div>
        </div>
      )}

      {wine.vintageIds.length > 1 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Jahrgang</p>
          <div className="flex flex-wrap gap-2">
            {wine.vintageIds.map((v) => (
              <Chip key={v.id} selected={vintageId === v.id} onClick={() => setVintageId(v.id)}>
                {v.vintage ?? "ohne"}
              </Chip>
            ))}
          </div>
        </div>
      )}

      {!isGuest && (
        <PriceCheck
          wine={{ vintageId, producer: wine.producer, name: wine.name, vintage }}
          history={prices.history}
          onFound={prices.reload}
        />
      )}

      {vintageId && (
        <ReviewForm
          key={vintageId}
          vintageId={vintageId}
          vintage={vintage}
          red={wine.color === "red"}
          onSaved={async () => {
            await loadReviews();
          }}
        />
      )}

      <section className="space-y-3">
        <h2 className="text-2xl">Bewertungen</h2>
        {reviews.length === 0 ? (
          <p className="text-sm text-muted">Noch niemand hat diesen Wein bewertet.</p>
        ) : (
          <ul className="space-y-3">
            {reviews.map((r) => (
              <ReviewCard
                key={r.id}
                review={r}
                onDelete={async () => {
                  await deleteReview(r.id).catch(() => null);
                  await loadReviews();
                }}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function ReviewForm({
  vintageId,
  vintage,
  red,
  onSaved,
}: {
  vintageId: string;
  vintage: number | null;
  red: boolean;
  onSaved: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(90);
  const [rated, setRated] = useState(false);
  const [structure, setStructure] = useState<Partial<Record<StructureKey, number>>>({});
  const [aromas, setAromas] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <Button block size="lg" onClick={() => setOpen(true)}>
        {vintage ? `Jahrgang ${vintage} bewerten` : "Bewerten"}
      </Button>
    );
  }

  return (
    <Card className="space-y-5">
      <h2 className="text-2xl">Deine Bewertung{vintage ? ` · ${vintage}` : ""}</h2>
      <TickDial
        label="Punkte"
        value={rating}
        onChange={(v) => {
          setRating(v);
          setRated(true);
        }}
        min={50}
        max={100}
        step={0.5}
        majorEvery={5}
        mediumEvery={1}
        describe={(v) => (rated ? describeRating(v) : "Wischen zum Bewerten")}
      />
      <StructureDials
        dimensions={
          red
            ? ["sweetness", "acidity", "body", "tannin", "finish"]
            : ["sweetness", "acidity", "body", "finish"]
        }
        value={structure}
        onChange={setStructure}
      />
      <div className="space-y-2">
        <p className="text-sm font-medium">Aromen</p>
        <AromaWheel value={aromas} onChange={setAromas} />
      </div>
      <TextArea
        label="Kommentar"
        value={note}
        maxLength={4000}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Wie hat er geschmeckt? Wozu habt ihr ihn getrunken?"
      />
      <SwitchRow
        label="Für alle sichtbar"
        description={
          isPublic ? "Andere sehen deine Punkte, Aromen und den Kommentar mit deinem Namen." : "Nur für dich."
        }
        checked={isPublic}
        onChange={setIsPublic}
      />
      <div className="grid grid-cols-2 gap-2">
        <Button variant="ghost" onClick={() => setOpen(false)}>
          Abbrechen
        </Button>
        <Button
          loading={busy}
          disabled={!rated && !note.trim() && aromas.length === 0}
          onClick={async () => {
            setBusy(true);
            setError(null);
            try {
              await saveReview({
                vintageId,
                rating: rated ? rating : null,
                note,
                aromas,
                structure,
                isPublic,
              });
              tick("major");
              setOpen(false);
              await onSaved();
            } catch {
              setError("Speichern hat nicht geklappt.");
            } finally {
              setBusy(false);
            }
          }}
        >
          Speichern
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </Card>
  );
}

function ReviewCard({ review: r, onDelete }: { review: Review; onDelete: () => Promise<void> }) {
  const structure = Object.entries(r.structure ?? {}) as [StructureKey, number][];
  return (
    <li className="space-y-2.5 rounded-card border border-border bg-surface p-4">
      <div className="flex items-center gap-3">
        <Avatar name={r.author} className="size-9" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{r.isMine ? "Du" : r.author}</p>
          <p className="text-xs text-muted">
            {dateFmt.format(new Date(`${r.tastedOn}T12:00:00`))}
            {r.vintage ? ` · Jahrgang ${r.vintage}` : ""}
            {r.isMine && !r.isPublic ? " · nur für dich" : ""}
          </p>
        </div>
        {r.rating !== null && (
          <span className="font-display text-3xl text-accent tabular-nums">{fmt(r.rating)}</span>
        )}
      </div>
      {r.note && <p className="leading-relaxed whitespace-pre-line">{r.note}</p>}
      {r.aromas.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {r.aromas.map((a) => (
            <span
              key={a}
              className="rounded-full px-2.5 py-0.5 text-xs font-medium text-[#1a0f12]"
              style={{ background: AROMA_COLOR.get(a) ?? "var(--surface-2)" }}
            >
              {a}
            </span>
          ))}
        </div>
      )}
      {structure.length > 0 && (
        <p className="text-xs text-muted">
          {structure.map(([k, v]) => `${STRUCTURE_SCALES[k].label} ${fmt(v)}`).join(" · ")}
        </p>
      )}
      {r.isMine && (
        <button type="button" className="text-xs text-muted underline underline-offset-4" onClick={onDelete}>
          Löschen
        </button>
      )}
    </li>
  );
}
