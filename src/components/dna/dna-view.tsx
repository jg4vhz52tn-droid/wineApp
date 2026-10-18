"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { RadarChart } from "@/components/learn/radar-chart";
import { Button } from "@/components/ui/button";
import { Card, Eyebrow } from "@/components/ui/card";
import { AROMA_COLOR } from "@/config/aromas";
import { describeStructure, STRUCTURE_SCALES } from "@/config/tasting";
import { DIMENSIONS, fallbackText, sweetSpot, type Dna, type Ranked } from "@/lib/dna";

const fmt = (n: number) => n.toLocaleString("de-DE", { maximumFractionDigits: 1 });
const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);

/** Everything the DNA knows, from top (in words) to bottom (the blind nose). */
export function DnaView({
  dna,
  summary,
  onRewrite,
  rewriting = false,
}: {
  dna: Dna;
  summary: string | null;
  onRewrite?: () => void;
  rewriting?: boolean;
}) {
  if (!dna.ready) return <NotYet dna={dna} />;
  return (
    <div className="space-y-5">
      <Card
        className="space-y-3"
        style={{ background: "linear-gradient(150deg, var(--curtain), var(--surface) 75%)" }}
      >
        <Eyebrow>Deine Geschmacks-DNA</Eyebrow>
        <motion.p
          key={summary ?? "fallback"}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-display text-2xl leading-snug text-balance"
        >
          {summary ?? fallbackText(dna)}
        </motion.p>
        <p className="text-xs text-muted">Aus {dna.ratings} Bewertungen · nur für dich sichtbar</p>
        {onRewrite && (
          <Button variant="ghost" onClick={onRewrite} loading={rewriting}>
            ✦ {summary ? "Text neu schreiben" : "In Worten beschreiben"}
          </Button>
        )}
      </Card>

      <StructureCard dna={dna} />
      <Aromas dna={dna} />
      <RankedCard title="Rebsorten" items={dna.grapes ?? []} />
      <RankedCard title="Regionen" items={dna.regions ?? []} />
      <Prices dna={dna} />
      <Nose dna={dna} />
    </div>
  );
}

function NotYet({ dna }: { dna: Dna }) {
  return (
    <Card className="space-y-4">
      <Eyebrow>Deine Geschmacks-DNA</Eyebrow>
      <p className="font-display text-2xl leading-snug">
        Noch {dna.needed} {dna.needed === 1 ? "Bewertung" : "Bewertungen"} bis zu deiner DNA.
      </p>
      <div className="h-2 rounded-full bg-surface-2" aria-hidden>
        <motion.div
          className="h-full rounded-full bg-accent"
          initial={{ width: 0 }}
          animate={{ width: `${(dna.ratings / 5) * 100}%` }}
        />
      </div>
      <p className="text-sm text-muted">
        Jede Bewertung in „Meine Weine“ und jeder Rate-Bogen an einem Lagenabend zählt. Am besten mit Süße,
        Säure, Körper und Aromen – dann wird die DNA genauer.
      </p>
      <Link href="/keller/weine" className="text-sm font-medium text-accent">
        Geöffnete Weine bewerten →
      </Link>
    </Card>
  );
}

function StructureCard({ dna }: { dna: Dna }) {
  const mine = dna.structure ?? {};
  const group = dna.group_structure ?? {};
  const dims = DIMENSIONS.filter((d) => mine[d]);
  if (!dims.length) return null;
  const withGroup = dims.filter((d) => group[d]);
  const radarDims = withGroup.length >= 3 ? withGroup : dims;
  return (
    <Card className="space-y-4">
      <div>
        <h2 className="text-2xl">Dein Lieblingsprofil</h2>
        <p className="text-sm text-muted">So schmecken die Weine, die du am besten bewertest.</p>
      </div>
      {radarDims.length >= 3 && (
        <RadarChart
          axes={radarDims.map((d) => STRUCTURE_SCALES[d].label)}
          series={[
            {
              name: "Deine Lieblingsweine",
              values: radarDims.map((d) => mine[d]!.value),
              color: "var(--series-1)",
            },
            ...(withGroup.length >= 3
              ? [
                  {
                    name: "Schnitt deiner Runde",
                    values: radarDims.map((d) => group[d]!.value),
                    color: "var(--series-2)",
                  },
                ]
              : []),
          ]}
        />
      )}
      <ul className="space-y-2.5">
        {dims.map((d) => (
          <li key={d} className="space-y-1">
            <div className="flex items-baseline justify-between text-sm">
              <span className="font-medium">{STRUCTURE_SCALES[d].label}</span>
              <span className="text-muted">
                {describeStructure(d, mine[d]!.value)} ·{" "}
                <b className="font-display text-base text-fg tabular-nums">{fmt(mine[d]!.value)}</b>
                {group[d] && <span className="text-xs"> (Runde {fmt(group[d]!.value)})</span>}
              </span>
            </div>
            <div className="relative h-2 rounded-full bg-surface-2" aria-hidden>
              <div className="h-full rounded-full bg-series-1" style={{ width: `${mine[d]!.value * 10}%` }} />
              {group[d] && (
                <span
                  className="absolute -top-1 h-4 w-0.5 rounded bg-series-2"
                  style={{ left: `calc(${group[d]!.value * 10}% - 1px)` }}
                />
              )}
            </div>
          </li>
        ))}
      </ul>
      {Object.keys(group).length > 0 && (
        <p className="text-xs text-muted">
          <span className="mr-1 inline-block h-3 w-0.5 bg-series-2 align-middle" /> Strich = Schnitt deiner
          Runde
        </p>
      )}
    </Card>
  );
}

function Aromas({ dna }: { dna: Dna }) {
  const aromas = dna.aromas ?? [];
  if (!aromas.length) return null;
  const max = Math.max(...aromas.map((a) => a.n));
  return (
    <Card className="space-y-3">
      <h2 className="text-2xl">Deine Lieblingsaromen</h2>
      <ul className="space-y-2">
        {aromas.map((a) => (
          <li key={a.aroma} className="grid grid-cols-[7rem_1fr_auto] items-center gap-3 text-sm">
            <span className="truncate">{a.aroma}</span>
            <span className="h-3 rounded-full bg-surface-2" aria-hidden>
              <span
                className="block h-full rounded-full"
                style={{
                  width: `${(a.n / max) * 100}%`,
                  background: AROMA_COLOR.get(a.aroma) ?? "var(--series-1)",
                }}
              />
            </span>
            <span className="text-xs text-muted tabular-nums">{a.n}×</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function RankedCard({ title, items }: { title: string; items: Ranked[] }) {
  if (!items.length) return null;
  return (
    <Card className="space-y-3">
      <h2 className="text-2xl">{title}</h2>
      <ol className="divide-y divide-border">
        {items.slice(0, 6).map((g, i) => (
          <li key={g.name} className="flex items-center gap-3 py-2">
            <span className="w-5 font-display text-lg text-accent">{i + 1}</span>
            <span className="min-w-0 flex-1 truncate">{g.name}</span>
            <span className="text-xs text-muted">
              {g.n} {g.n === 1 ? "Wein" : "Weine"}
            </span>
            <span className="w-12 text-right font-display text-xl tabular-nums">{fmt(g.avg)}</span>
          </li>
        ))}
      </ol>
      {items.some((g) => g.n === 1) && (
        <p className="text-xs text-muted">Ab zwei Weinen wird es aussagekräftig.</p>
      )}
    </Card>
  );
}

function Prices({ dna }: { dna: Dna }) {
  const bands = dna.prices ?? [];
  if (bands.length < 2) return null;
  const spot = sweetSpot(dna);
  return (
    <Card className="space-y-3">
      <div>
        <h2 className="text-2xl">Dein Preis-Sweetspot</h2>
        {spot && (
          <p className="text-sm text-muted">
            Ab <b className="font-medium text-fg">{spot.band}</b> wird es für dich kaum noch besser.
          </p>
        )}
      </div>
      <ul className="space-y-2.5">
        {bands.map((b) => (
          <li key={b.band} className="grid grid-cols-[5.5rem_1fr_auto] items-center gap-3 text-sm">
            <span>{b.band}</span>
            <span className="h-2 rounded-full bg-surface-2" aria-hidden>
              <span
                className="block h-full rounded-full"
                style={{
                  width: `${Math.max(2, ((b.avg - 50) / 50) * 100)}%`,
                  background: b.band === spot?.band ? "var(--series-2)" : "var(--series-1)",
                }}
              />
            </span>
            <span className="font-medium tabular-nums">Ø {fmt(b.avg)}</span>
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted">
        <span style={{ color: "var(--series-2)" }}>●</span> Sweetspot · Ø Bewertung, Skala 50–100
      </p>
    </Card>
  );
}

function Nose({ dna }: { dna: Dna }) {
  const n = dna.nose;
  if (!n || n.glasses === 0) {
    return (
      <Card className="space-y-2">
        <h2 className="text-2xl">Deine Nase</h2>
        <p className="text-sm text-muted">
          Nach deinem ersten Lagenabend steht hier, wie gut du blind erkennst – und was du verwechselst.
        </p>
      </Card>
    );
  }
  return (
    <Card className="space-y-4">
      <div>
        <h2 className="text-2xl">Deine Nase</h2>
        <p className="text-sm text-muted">Aus {n.glasses} blind verkosteten Gläsern.</p>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <Stat
          label="Rebsorte erkannt"
          value={`${pct(n.grape_hits, n.grape_guesses)} %`}
          sub={`${n.grape_hits} von ${n.grape_guesses}`}
        />
        <Stat
          label="Jahrgang ±1"
          value={`${pct(n.vintage_close, n.vintage_guesses)} %`}
          sub={`${n.vintage_close} von ${n.vintage_guesses}`}
        />
        <Stat label="Ø Punkte" value={n.avg_points !== null ? fmt(n.avg_points) : "–"} sub="pro Glas" />
      </div>
      {n.confusions.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-sm font-medium">Typische Verwechslungen</p>
          <ul className="space-y-1 text-sm">
            {n.confusions.map((c) => (
              <li key={`${c.actual}-${c.guessed}`} className="rounded-control bg-surface-2/60 px-3 py-2">
                <b className="font-medium">{c.actual}</b> hältst du für{" "}
                <b className="font-medium">{c.guessed}</b>
                {c.n > 1 && <span className="text-muted"> ({c.n}×)</span>}
              </li>
            ))}
          </ul>
          <Link href="/lernen/rebsorten" className="text-sm font-medium text-accent">
            Rebsorten vergleichen und üben →
          </Link>
        </div>
      )}
    </Card>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-control bg-surface-2/70 px-2 py-3">
      <p className="text-[0.65rem] leading-tight text-muted">{label}</p>
      <p className="mt-1 font-display text-2xl tabular-nums">{value}</p>
      <p className="text-[0.65rem] text-muted">{sub}</p>
    </div>
  );
}
