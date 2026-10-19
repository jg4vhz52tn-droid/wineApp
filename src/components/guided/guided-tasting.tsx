"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Bottle } from "@/components/tasting/bottle";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { SwitchRow } from "@/components/ui/switch";
import { TickDial } from "@/components/ui/tick-dial";
import { AROMA_COLOR, AROMA_FAMILIES } from "@/config/aromas";
import { bottleShapeFor } from "@/config/bottles";
import { AROMA_TIPS, colorFamily, finishToScale, PALATE, SERVING, SHADES } from "@/config/guided";
import { describeRating, describeStructure, STRUCTURE_SCALES, type StructureKey } from "@/config/tasting";
import { cn } from "@/lib/cn";
import type { Expected, GuideWine } from "@/lib/guided";
import type { NewBadge } from "@/lib/senses";
import { NewBadges } from "@/components/senses/senses";
import { tick } from "@/lib/haptics";

export type GuidedResult = {
  rating: number;
  structure: Partial<Record<StructureKey, number>>;
  aromas: string[];
  isPublic: boolean;
  guided: {
    shade: string | null;
    shadeMatch: boolean | null;
    found: string[];
    foundAfterHint: string[];
    notFound: string[];
    ownExtra: string[];
    finishSeconds: number | null;
    /** Your palate next to the typical value - for "Deine Sinne". */
    palate: Partial<Record<StructureKey, { mine: number; expected: number }>>;
    finishExpected: number | null;
  };
};

const fmt = (n: number) => n.toLocaleString("de-DE", { maximumFractionDigits: 1 });
const SOURCE: Record<Expected["source"], string> = {
  community: "Nach den Bewertungen eurer Runde",
  ai: "So beschreiben Kenner diesen Wein typischerweise (KI-Einschätzung)",
  grape: "Typisch für die Rebsorte – zu genau diesem Wein wissen wir noch nichts",
  none: "Zu diesem Wein gibt es noch keine Vergleichswerte – du legst sie gerade an",
};

type Step = "prep" | "look" | "nose1" | "nose2" | "palate" | "finish" | "verdict" | "done";
const PHASES: { label: string; steps: Step[] }[] = [
  { label: "Sehen", steps: ["prep", "look"] },
  { label: "Riechen", steps: ["nose1", "nose2"] },
  { label: "Schmecken", steps: ["palate", "finish"] },
  { label: "Urteil", steps: ["verdict", "done"] },
];

/** Step by step through one glass: look, smell, taste, judge - with a comparison after each step. */
export function GuidedTasting({
  wine,
  expected,
  onSave,
}: {
  wine: GuideWine;
  expected: Expected;
  /** May return badges earned with this tasting. */
  onSave: (result: GuidedResult) => Promise<NewBadge[] | void>;
}) {
  const family = wine.color === "sparkling" ? "white" : colorFamily(wine.color);
  const shades = SHADES[family];
  const red = wine.color === "red";
  const dims: StructureKey[] = red
    ? ["sweetness", "acidity", "body", "tannin"]
    : ["sweetness", "acidity", "body"];
  const serving = SERVING[wine.color === "sparkling" ? "sparkling" : family];

  const [step, setStep] = useState<Step>("prep");
  const [shade, setShade] = useState<string | null>(null);
  const [lookShown, setLookShown] = useState(false);
  const [families, setFamilies] = useState<string[]>([]);
  const [picked, setPicked] = useState<string[]>([]);
  const [noseShown, setNoseShown] = useState(false);
  const [afterHint, setAfterHint] = useState<string[]>([]);
  const [notFound, setNotFound] = useState<string[]>([]);
  const [dimIndex, setDimIndex] = useState(0);
  const [structure, setStructure] = useState<Partial<Record<StructureKey, number>>>({});
  const [dimShown, setDimShown] = useState(false);
  const [finishSeconds, setFinishSeconds] = useState<number | null>(null);
  const [rating, setRating] = useState(88);
  const [isPublic, setIsPublic] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newBadges, setNewBadges] = useState<NewBadge[]>([]);

  const expectedAromas = expected.aromas.map((a) => a.aroma);
  const found = picked.filter((a) => expectedAromas.includes(a));
  const ownExtra = picked.filter((a) => !expectedAromas.includes(a));
  const missed = expectedAromas.filter((a) => !picked.includes(a));
  const go = (next: Step) => {
    tick("minor");
    setStep(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const phase = PHASES.findIndex((p) => p.steps.includes(step));

  async function save() {
    setBusy(true);
    setError(null);
    try {
      const fresh = await onSave({
        rating,
        structure: {
          ...structure,
          ...(finishSeconds !== null ? { finish: finishToScale(finishSeconds) } : {}),
        },
        aromas: [...new Set([...picked, ...afterHint])],
        isPublic,
        guided: {
          shade,
          shadeMatch: expected.shade ? shade === expected.shade : null,
          found,
          foundAfterHint: afterHint,
          notFound,
          ownExtra,
          finishSeconds,
          palate: Object.fromEntries(
            (Object.keys(structure) as StructureKey[])
              .filter((k) => expected.structure[k] !== undefined)
              .map((k) => [k, { mine: structure[k]!, expected: expected.structure[k]! }]),
          ),
          finishExpected: expected.finishSeconds,
        },
      });
      if (fresh) setNewBadges(fresh);
      tick("major");
      go("done");
    } catch {
      setError("Speichern hat nicht geklappt. Bitte noch einmal versuchen.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* progress */}
      <ol className="grid grid-cols-4 gap-1.5" aria-label="Fortschritt">
        {PHASES.map((p, i) => (
          <li key={p.label} className="space-y-1">
            <span className={cn("block h-1 rounded-full", i <= phase ? "bg-accent" : "bg-surface-2")} />
            <span
              className={cn("block text-[0.7rem] font-medium", i === phase ? "text-accent" : "text-muted")}
            >
              {p.label}
            </span>
          </li>
        ))}
      </ol>

      <AnimatePresence mode="wait">
        <motion.div
          key={step === "palate" ? `palate-${dimIndex}` : step}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.25 }}
          className="space-y-5"
        >
          {step === "prep" && (
            <>
              <div className="flex items-center gap-4">
                <Bottle
                  shape={bottleShapeFor(wine.color)}
                  label={{
                    producer: wine.producer,
                    name: wine.name ?? wine.producer,
                    vintage: wine.vintage ?? undefined,
                    photo: wine.labelUrl,
                  }}
                  className="h-44 w-24 shrink-0"
                />
                <div className="space-y-1">
                  <p className="text-xs font-medium tracking-[0.14em] text-accent uppercase">
                    Geführte Verkostung
                  </p>
                  <h1 className="text-3xl leading-tight">{wine.name ?? wine.producer}</h1>
                  <p className="text-sm text-muted">
                    {[wine.producer, wine.vintage, wine.grape].filter(Boolean).join(" · ")}
                  </p>
                </div>
              </div>
              <Tip title="Bevor es losgeht">
                <ul className="list-disc space-y-1 pl-4">
                  <li>
                    Temperatur: etwa <b className="font-medium">{serving.temp}</b>
                  </li>
                  <li>Glas: {serving.glass}</li>
                  <li>Nur einen Fingerbreit einschenken – dann kannst du gut schwenken.</li>
                  <li>Kein Kaugummi, kein Kaffee direkt vorher.</li>
                </ul>
              </Tip>
              <Button block size="lg" onClick={() => go("look")}>
                Los geht’s
              </Button>
            </>
          )}

          {step === "look" && (
            <>
              <StepTitle n={1} title="Welche Farbe siehst du?" />
              <Tip title="So geht’s">
                Halte das Glas schräg vor ein weißes Blatt Papier und schau in die Mitte und an den Rand.
              </Tip>
              <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Farbe">
                {shades.map((s) => {
                  const isExpected = lookShown && expected.shade === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      role="radio"
                      aria-checked={shade === s.id}
                      disabled={lookShown}
                      onClick={() => {
                        tick("minor");
                        setShade(s.id);
                      }}
                      className={cn(
                        "flex items-center gap-3 rounded-control border p-2.5 text-left text-sm transition",
                        shade === s.id ? "border-accent bg-accent/10" : "border-border bg-surface",
                        isExpected && "ring-2 ring-success",
                      )}
                    >
                      <span
                        className="size-9 shrink-0 rounded-full border border-black/10"
                        style={{ background: s.hex }}
                      />
                      <span className="leading-tight">{s.label}</span>
                    </button>
                  );
                })}
              </div>
              {lookShown ? (
                <>
                  <Compare
                    good={expected.shade ? shade === expected.shade : null}
                    title={
                      !expected.shade
                        ? "Notiert!"
                        : shade === expected.shade
                          ? "Genau so sehen das auch Kenner."
                          : `Typisch wäre eher: ${shades.find((s) => s.id === expected.shade)?.label}`
                    }
                  >
                    {expected.colorNote ?? shades.find((s) => s.id === (expected.shade ?? shade))?.means}
                    {shade && expected.shade && shade !== expected.shade && (
                      <>
                        {" "}
                        Deine Wahl „{shades.find((s) => s.id === shade)?.label}“ heißt:{" "}
                        {shades.find((s) => s.id === shade)?.means}.
                      </>
                    )}
                  </Compare>
                  <Button block size="lg" onClick={() => go("nose1")}>
                    Weiter zum Riechen
                  </Button>
                </>
              ) : (
                <Button block size="lg" disabled={!shade} onClick={() => setLookShown(true)}>
                  Vergleichen
                </Button>
              )}
            </>
          )}

          {step === "nose1" && (
            <>
              <StepTitle n={2} title="Erster Eindruck: Woran erinnert dich der Duft?" />
              <Tip title="So geht’s">
                Noch <b className="font-medium">nicht schwenken</b>. Nase kurz ins Glas, zweimal sanft
                schnuppern. Wähle grob, was dir einfällt – mehrere sind erlaubt.
              </Tip>
              <div className="flex flex-wrap gap-2">
                {AROMA_FAMILIES.map((f) => (
                  <Chip
                    key={f.id}
                    selected={families.includes(f.id)}
                    onClick={() =>
                      setFamilies((x) => (x.includes(f.id) ? x.filter((y) => y !== f.id) : [...x, f.id]))
                    }
                  >
                    <span
                      className="mr-1.5 inline-block size-2.5 rounded-full"
                      style={{ background: f.color }}
                    />
                    {f.name}
                  </Chip>
                ))}
              </div>
              <Button block size="lg" onClick={() => go("nose2")}>
                {families.length ? "Weiter" : "Ich weiß nicht – zeig mir alles"}
              </Button>
            </>
          )}

          {step === "nose2" && (
            <>
              <StepTitle n={3} title="Jetzt schwenken und genauer riechen" />
              {!noseShown && (
                <Tip title="So geht’s">
                  Das Glas am Stiel auf dem Tisch kreisen lassen, dann sofort riechen. Der Wein „öffnet“ sich.
                  Was genau riechst du?
                </Tip>
              )}
              {!noseShown ? (
                <>
                  <div className="space-y-3">
                    {AROMA_FAMILIES.filter((f) => !families.length || families.includes(f.id)).map((f) => (
                      <div key={f.id} className="space-y-1.5">
                        <p className="text-xs font-medium text-muted">{f.name}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {f.aromas.map((a) => (
                            <button
                              key={a}
                              type="button"
                              aria-pressed={picked.includes(a)}
                              onClick={() => {
                                tick("minor");
                                setPicked((x) => (x.includes(a) ? x.filter((y) => y !== a) : [...x, a]));
                              }}
                              className={cn(
                                "h-10 rounded-full border px-3.5 text-sm font-medium transition",
                                picked.includes(a)
                                  ? "border-transparent text-[#1a0f12]"
                                  : "border-border bg-surface",
                              )}
                              style={picked.includes(a) ? { background: f.color } : undefined}
                            >
                              {a}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button block size="lg" onClick={() => setNoseShown(true)}>
                    {picked.length ? "Vergleichen" : "Ich rieche nichts Bestimmtes – zeig mir Hilfe"}
                  </Button>
                </>
              ) : (
                <>
                  {expectedAromas.length === 0 ? (
                    <Compare good={null} title="Notiert!">
                      Zu diesem Wein gibt es noch keine Vergleichswerte. Deine Aromen helfen den Nächsten.
                    </Compare>
                  ) : (
                    <div className="space-y-2">
                      {found.map((a) => (
                        <AromaRow
                          key={a}
                          aroma={a}
                          state="found"
                          note={expected.aromas.find((x) => x.aroma === a)?.note ?? null}
                        />
                      ))}
                      {missed.map((a) => (
                        <AromaRow
                          key={a}
                          aroma={a}
                          state={afterHint.includes(a) ? "hint" : notFound.includes(a) ? "missed" : "open"}
                          note={expected.aromas.find((x) => x.aroma === a)?.note ?? null}
                          onFound={() => {
                            tick("medium");
                            setAfterHint((x) => [...x, a]);
                          }}
                          onNotFound={() => setNotFound((x) => [...x, a])}
                        />
                      ))}
                    </div>
                  )}
                  {ownExtra.length > 0 && (
                    <p className="rounded-control bg-surface-2/60 px-4 py-3 text-sm">
                      Du riechst außerdem <b className="font-medium">{ownExtra.join(", ")}</b> – spannend!
                      Riechen ist persönlich, das kommt mit in deine Notiz.
                    </p>
                  )}
                  <Button block size="lg" onClick={() => go("palate")}>
                    Weiter zum Schmecken
                  </Button>
                </>
              )}
            </>
          )}

          {step === "palate" && (
            <PalateStep
              key={dims[dimIndex]}
              n={4 + dimIndex}
              dim={dims[dimIndex]}
              value={structure[dims[dimIndex]]}
              expected={expected.structure[dims[dimIndex]]}
              shown={dimShown}
              onChange={(v) => setStructure((s) => ({ ...s, [dims[dimIndex]]: v }))}
              onCompare={() => setDimShown(true)}
              onNext={() => {
                setDimShown(false);
                if (dimIndex < dims.length - 1) {
                  tick("minor");
                  setDimIndex(dimIndex + 1);
                } else go("finish");
              }}
            />
          )}

          {step === "finish" && (
            <FinishStep
              n={4 + dims.length}
              expectedSeconds={expected.finishSeconds}
              expectedScale={expected.structure.finish}
              seconds={finishSeconds}
              onSeconds={setFinishSeconds}
              onNext={() => go("verdict")}
            />
          )}

          {step === "verdict" && (
            <>
              <StepTitle n={5 + dims.length} title="Und? Wie gefällt er dir?" />
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    ["Sofort wieder", 93],
                    ["Gut", 88],
                    ["Eher nicht", 82],
                  ] as const
                ).map(([label, value]) => (
                  <Chip
                    key={label}
                    selected={rating === value}
                    onClick={() => setRating(value)}
                    className="justify-center"
                  >
                    {label}
                  </Chip>
                ))}
              </div>
              <TickDial
                label="Feiner einstellen"
                value={rating}
                onChange={setRating}
                min={50}
                max={100}
                step={0.5}
                majorEvery={5}
                mediumEvery={1}
                describe={describeRating}
              />
              <SwitchRow
                label="Für alle sichtbar"
                description={isPublic ? "Andere sehen deine Bewertung mit Namen." : "Nur für dich."}
                checked={isPublic}
                onChange={setIsPublic}
              />
              <Button block size="lg" onClick={save} loading={busy}>
                Verkostung speichern
              </Button>
              {error && (
                <p role="alert" className="text-sm text-danger">
                  {error}
                </p>
              )}
            </>
          )}

          {step === "done" && (
            <Summary
              wine={wine}
              found={found.length + afterHint.length}
              total={expectedAromas.length}
              shadeMatch={expected.shade ? shade === expected.shade : null}
              structure={structure}
              expected={expected}
              rating={rating}
            />
          )}
          {step === "done" && <NewBadges badges={newBadges} />}
        </motion.div>
      </AnimatePresence>

      {step !== "done" && <p className="text-center text-xs text-muted">{SOURCE[expected.source]}</p>}
    </div>
  );
}

function StepTitle({ n, title }: { n: number; title: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium tracking-[0.14em] text-accent uppercase">Schritt {n}</p>
      <h2 className="text-3xl leading-tight">{title}</h2>
    </div>
  );
}

function Tip({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[1.5rem] border border-accent/30 bg-accent/5 px-4 py-3 text-sm leading-relaxed">
      <p className="mb-1 font-medium text-accent">💡 {title}</p>
      {children}
    </div>
  );
}

function Compare({
  good,
  title,
  children,
}: {
  good: boolean | null;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-[1.5rem] px-4 py-3 text-sm leading-relaxed",
        good === true ? "bg-success/10" : good === false ? "bg-warning/10" : "bg-surface-2/70",
      )}
      role="status"
    >
      <p className="font-medium">
        {good === true ? "✓ " : good === false ? "→ " : ""}
        {title}
      </p>
      {children && <p className="mt-1 text-muted">{children}</p>}
    </motion.div>
  );
}

function AromaRow({
  aroma,
  state,
  note,
  onFound,
  onNotFound,
}: {
  aroma: string;
  state: "found" | "hint" | "missed" | "open";
  note: string | null;
  onFound?: () => void;
  onNotFound?: () => void;
}) {
  const color = AROMA_COLOR.get(aroma) ?? "var(--surface-2)";
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "space-y-2 rounded-[1.5rem] border px-4 py-3",
        state === "found" || state === "hint" ? "border-success/40 bg-success/5" : "border-border bg-surface",
      )}
    >
      <div className="flex items-center gap-2">
        <span className="size-3 shrink-0 rounded-full" style={{ background: color }} />
        <b className="font-medium">{aroma}</b>
        <span className="ml-auto text-xs text-muted">
          {state === "found"
            ? "✓ gefunden"
            : state === "hint"
              ? "✓ mit Hilfe gefunden"
              : state === "missed"
                ? "diesmal nicht"
                : ""}
        </span>
      </div>
      {state === "found" && note && <p className="text-xs text-muted">Genau – {note}.</p>}
      {state === "open" && (
        <>
          <p className="text-sm">
            Kenner finden hier oft <b className="font-medium">{aroma}</b>. {AROMA_TIPS[aroma]} Riech noch
            einmal – am besten mit kurzen Zügen an der Glaskante.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" className="px-3 whitespace-nowrap" onClick={onFound}>
              ✓ Rieche ich
            </Button>
            <Button variant="ghost" className="px-3 whitespace-nowrap" onClick={onNotFound}>
              Finde ich nicht
            </Button>
          </div>
        </>
      )}
      {state === "missed" && <p className="text-xs text-muted">Völlig okay – jede Nase ist anders.</p>}
    </motion.div>
  );
}

function PalateStep({
  n,
  dim,
  value,
  expected,
  shown,
  onChange,
  onCompare,
  onNext,
}: {
  n: number;
  dim: StructureKey;
  value: number | undefined;
  expected: number | undefined;
  shown: boolean;
  onChange: (v: number) => void;
  onCompare: () => void;
  onNext: () => void;
}) {
  const q = PALATE[dim];
  const diff = value !== undefined && expected !== undefined ? Math.abs(value - expected) : null;
  return (
    <>
      <StepTitle n={n} title={q.question} />
      <Tip title="So merkst du es">{q.tip}</Tip>
      <TickDial
        label={STRUCTURE_SCALES[dim].label}
        value={value ?? 5}
        onChange={(v) => onChange(Math.round(v * 10) / 10)}
        min={0}
        max={10}
        step={0.1}
        majorEvery={1}
        mediumEvery={0.5}
        describe={(v) => (value === undefined ? `Wischen: ${q.low} ↔ ${q.high}` : describeStructure(dim, v))}
      />
      {shown && expected !== undefined && value !== undefined && (
        <>
          <ScaleCompare mine={value} expected={expected} />
          <Compare
            good={diff !== null ? diff <= 1.5 : null}
            title={
              diff !== null && diff <= 1.5
                ? "Sehr gut eingeschätzt!"
                : `Typisch wäre eher ${describeStructure(dim, expected)} (${fmt(expected)}).`
            }
          >
            {diff !== null &&
              diff > 1.5 &&
              (value > expected
                ? "Du hast ihn etwas kräftiger wahrgenommen – das kann an Temperatur oder Glas liegen."
                : "Du hast ihn etwas zurückhaltender wahrgenommen – probier noch einen Schluck und achte genau darauf.")}
          </Compare>
        </>
      )}
      {shown || expected === undefined ? (
        <Button block size="lg" onClick={onNext} disabled={value === undefined}>
          Weiter
        </Button>
      ) : (
        <Button block size="lg" onClick={onCompare} disabled={value === undefined}>
          Vergleichen
        </Button>
      )}
    </>
  );
}

function ScaleCompare({ mine, expected }: { mine: number; expected: number }) {
  return (
    <div className="space-y-1.5" aria-hidden>
      <div className="relative h-3 rounded-full bg-surface-2">
        <motion.span
          className="absolute -top-1 size-5 -translate-x-1/2 rounded-full border-2 border-surface bg-series-2"
          initial={{ left: `${mine * 10}%`, opacity: 0 }}
          animate={{ left: `${expected * 10}%`, opacity: 1 }}
          transition={{ type: "spring", damping: 20 }}
        />
        <span
          className="absolute -top-1 size-5 -translate-x-1/2 rounded-full border-2 border-surface bg-series-1"
          style={{ left: `${mine * 10}%` }}
        />
      </div>
      <p className="flex justify-between text-xs text-muted">
        <span>
          <span className="text-series-1">●</span> du {fmt(mine)}
        </span>
        <span>
          <span className="text-series-2">●</span> typisch {fmt(expected)}
        </span>
      </p>
    </div>
  );
}

function FinishStep({
  n,
  expectedSeconds,
  expectedScale,
  seconds,
  onSeconds,
  onNext,
}: {
  n: number;
  expectedSeconds: number | null;
  expectedScale: number | undefined;
  seconds: number | null;
  onSeconds: (s: number | null) => void;
  onNext: () => void;
}) {
  const started = useRef<number | null>(null);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearInterval(timer.current);
    },
    [],
  );

  function toggle() {
    if (!running) {
      tick("major");
      started.current = Date.now();
      setElapsed(0);
      setRunning(true);
      timer.current = setInterval(
        () => setElapsed((Date.now() - (started.current ?? Date.now())) / 1000),
        100,
      );
    } else {
      tick("major");
      if (timer.current) clearInterval(timer.current);
      setRunning(false);
      onSeconds(Math.round((Date.now() - (started.current ?? Date.now())) / 1000));
    }
  }

  const length = seconds === null ? null : seconds < 5 ? "kurz" : seconds <= 10 ? "mittel" : "lang";
  return (
    <>
      <StepTitle n={n} title="Wie lange bleibt der Geschmack?" />
      <Tip title="So geht’s">
        Nimm einen Schluck, behalte ihn kurz im Mund und schluck. Tipp dann auf{" "}
        <b className="font-medium">Start</b> – und auf <b className="font-medium">Stopp</b>, sobald der
        Geschmack verschwunden ist.
      </Tip>
      <button
        type="button"
        onClick={toggle}
        className={cn(
          "mx-auto flex size-44 flex-col items-center justify-center rounded-full border-4 transition active:scale-95",
          running ? "border-accent bg-accent/10" : "border-border bg-surface-2/70",
        )}
        aria-label={running ? "Stoppen" : "Starten"}
      >
        <span className="font-display text-6xl tabular-nums">
          {fmt(running ? Math.floor(elapsed) : (seconds ?? 0))}
        </span>
        <span className="text-sm text-muted">Sekunden</span>
        <span className="mt-1 text-sm font-semibold text-accent">
          {running ? "Stopp" : seconds === null ? "Start" : "Nochmal"}
        </span>
      </button>
      {seconds !== null && !running && (
        <Compare
          good={expectedSeconds !== null ? Math.abs(seconds - expectedSeconds) <= 4 : null}
          title={`${seconds} Sekunden – ein ${length}er Abgang.`}
        >
          {expectedSeconds
            ? `Typisch für diesen Wein sind etwa ${expectedSeconds} Sekunden.`
            : expectedScale !== undefined
              ? `Typisch ist ein ${describeStructure("finish", expectedScale)}er Abgang.`
              : "Lange Abgänge sind meist ein Zeichen für Qualität."}
        </Compare>
      )}
      <Button block size="lg" onClick={onNext} disabled={running}>
        {seconds === null ? "Überspringen" : "Weiter"}
      </Button>
    </>
  );
}

function Summary({
  wine,
  found,
  total,
  shadeMatch,
  structure,
  expected,
  rating,
}: {
  wine: GuideWine;
  found: number;
  total: number;
  shadeMatch: boolean | null;
  structure: Partial<Record<StructureKey, number>>;
  expected: Expected;
  rating: number;
}) {
  const close = (Object.keys(structure) as StructureKey[]).filter(
    (k) => expected.structure[k] !== undefined && Math.abs(structure[k]! - expected.structure[k]!) <= 1.5,
  ).length;
  const judged = (Object.keys(structure) as StructureKey[]).filter(
    (k) => expected.structure[k] !== undefined,
  ).length;
  return (
    <motion.div
      initial={{ scale: 0.96, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="space-y-5"
    >
      <div className="space-y-1 text-center">
        <p className="text-4xl">🍷</p>
        <h2 className="text-3xl">Toll verkostet!</h2>
        <p className="text-muted">{wine.name ?? wine.producer}</p>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <Result label="Farbe" value={shadeMatch === null ? "notiert" : shadeMatch ? "✓ getroffen" : "fast"} />
        <Result label="Aromen" value={total ? `${found} von ${total}` : `${found}`} />
        <Result label="Gaumen" value={judged ? `${close} von ${judged}` : "notiert"} />
      </div>
      <div className="flex items-baseline justify-between rounded-[1.5rem] bg-surface-2/70 px-5 py-4">
        <span className="text-sm text-muted">Deine Bewertung · {describeRating(rating)}</span>
        <span className="font-display text-5xl text-accent tabular-nums">{fmt(rating)}</span>
      </div>
      {expected.note && <p className="text-sm leading-relaxed text-muted">{expected.note}</p>}
      <p className="text-sm">
        Gespeichert in <b className="font-medium">Meine Weine</b> – und deine Geschmacks-DNA ist wieder ein
        Stück genauer.
      </p>
    </motion.div>
  );
}

function Result({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-control bg-surface-2/70 px-2 py-3">
      <p className="text-[0.65rem] text-muted">{label}</p>
      <p className="mt-1 font-display text-lg">{value}</p>
    </div>
  );
}
