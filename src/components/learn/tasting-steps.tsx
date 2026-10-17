"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, Eyebrow } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { Segmented } from "@/components/ui/segmented";
import { COLOR_SCALES, describeFinish, NOSE_WORDS, TONGUE_TASTES } from "@/config/learn/tasting-learn";
import { cn } from "@/lib/cn";
import { tick } from "@/lib/haptics";

const STEPS = ["Sehen", "Schwenken", "Riechen", "Schmecken", "Abgang"] as const;

export function TastingSteps() {
  const [step, setStep] = useState(0);
  return (
    <div className="space-y-4">
      <div role="tablist" aria-label="Schritte" className="grid grid-cols-5 gap-1">
        {STEPS.map((name, i) => (
          <button
            key={name}
            type="button"
            role="tab"
            aria-selected={i === step}
            onClick={() => {
              tick("minor");
              setStep(i);
            }}
            className={cn(
              "flex h-14 flex-col items-center justify-center rounded-control text-[0.7rem] font-medium transition",
              i === step ? "bg-accent text-accent-fg" : "bg-surface-2 text-muted",
            )}
          >
            <span className="font-display text-lg leading-none">{i + 1}</span>
            {name}
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {step === 0 && <Look />}
          {step === 1 && <Swirl />}
          {step === 2 && <Nose />}
          {step === 3 && <Tongue />}
          {step === 4 && <Finish />}
        </motion.div>
      </AnimatePresence>
      {step < STEPS.length - 1 && (
        <Button variant="secondary" block onClick={() => setStep((s) => s + 1)}>
          Weiter: {STEPS[step + 1]} →
        </Button>
      )}
    </div>
  );
}

function Look() {
  const [kind, setKind] = useState<"weiss" | "rot">("weiss");
  const [index, setIndex] = useState(1);
  const scale = COLOR_SCALES[kind];
  const color = scale[index];
  return (
    <Card className="space-y-4">
      <Eyebrow>Sehen</Eyebrow>
      <p className="leading-relaxed">
        Halt das Glas schräg vor etwas Weißes und schau auf den Rand: Die Farbe erzählt von Alter, Ausbau und
        Konzentration.
      </p>
      <Segmented<"weiss" | "rot">
        label="Weinfarbe"
        value={kind}
        onChange={(k) => {
          setKind(k);
          setIndex(1);
        }}
        options={[
          { value: "weiss", label: "Weißwein" },
          { value: "rot", label: "Rotwein" },
        ]}
      />
      <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label="Farbton">
        {scale.map((c, i) => (
          <button
            key={c.name}
            type="button"
            role="radio"
            aria-checked={i === index}
            onClick={() => {
              tick("minor");
              setIndex(i);
            }}
            className={cn(
              "space-y-1.5 rounded-control p-1.5 text-center text-[0.7rem] leading-tight transition",
              i === index ? "bg-surface-2 ring-2 ring-accent" : "",
            )}
          >
            <span
              className="mx-auto block aspect-square w-full rounded-full border border-border"
              style={{
                background: `radial-gradient(circle at 50% 45%, ${c.hex}, ${c.hex} 55%, color-mix(in oklab, ${c.hex}, white 45%) 100%)`,
              }}
            />
            {c.name}
          </button>
        ))}
      </div>
      <p className="rounded-control bg-surface-2/70 p-4 text-sm leading-relaxed" aria-live="polite">
        <strong>{color.name}:</strong> {color.meaning}
      </p>
    </Card>
  );
}

function Swirl() {
  const [swirling, setSwirling] = useState(false);
  const reduce = useReducedMotion();
  return (
    <Card className="space-y-4">
      <Eyebrow>Schwenken</Eyebrow>
      <div className="flex items-center gap-5">
        <svg viewBox="0 0 80 120" className="h-36 w-24 shrink-0" aria-hidden>
          <defs>
            <clipPath id="swirl-bowl">
              <path d="M14 8h52l-3 34a23 23 0 0 1-46 0z" />
            </clipPath>
          </defs>
          <g clipPath="url(#swirl-bowl)">
            <motion.g
              animate={
                swirling && !reduce ? { rotate: [0, 8, 0, -8, 0], y: [0, -3, 0, -3, 0] } : { rotate: 0, y: 0 }
              }
              transition={{ duration: 1.2, repeat: swirling ? Infinity : 0, ease: "easeInOut" }}
              style={{ originX: "40px", originY: "50px" }}
            >
              <rect x="-10" y="34" width="100" height="40" fill="#8e1b33" />
              <ellipse cx="40" cy="34" rx="30" ry="3" fill="#a3324a" />
            </motion.g>
            {/* Tears running down after swirling */}
            {swirling &&
              [24, 34, 46, 56].map((x, i) => (
                <motion.path
                  key={x}
                  d={`M${x} 16v14`}
                  stroke="#8e1b33"
                  strokeOpacity="0.45"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 1.6, delay: 0.6 + i * 0.25 }}
                />
              ))}
          </g>
          <path
            d="M14 8h52l-3 34a23 23 0 0 1-46 0zM40 65v45M26 114h28"
            fill="none"
            stroke="var(--muted)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        <div className="space-y-2 text-sm leading-relaxed">
          <p>Kreisen lassen bringt Luft an den Wein – die Aromen werden freigesetzt.</p>
          <p className="text-muted">
            Die „Kirchenfenster“ am Glas zeigen Alkohol und Glyzerin – kein Qualitätsmerkmal, aber ein Hinweis
            auf Kraft.
          </p>
        </div>
      </div>
      <Button
        block
        variant={swirling ? "secondary" : "primary"}
        onClick={() => {
          tick("medium");
          setSwirling(!swirling);
        }}
      >
        {swirling ? "Stopp" : "Schwenken"}
      </Button>
    </Card>
  );
}

function Nose() {
  const [words, setWords] = useState<string[]>([]);
  return (
    <Card className="space-y-4">
      <Eyebrow>Riechen</Eyebrow>
      <div className="grid gap-3 text-sm leading-relaxed">
        <p>
          <strong>Erste Nase:</strong> erst am ruhenden Glas – die flüchtigsten, zartesten Aromen.
        </p>
        <p>
          <strong>Zweite Nase:</strong> nach dem Schwenken – jetzt kommt mehr. Kurz und mehrmals schnuppern
          ist besser als lange einatmen.
        </p>
      </div>
      <p className="text-sm font-medium">Wonach riecht dein Wein gerade?</p>
      <div className="flex flex-wrap gap-2">
        {NOSE_WORDS.map((w) => (
          <Chip
            key={w}
            selected={words.includes(w)}
            onClick={() => {
              tick("minor");
              setWords((list) => (list.includes(w) ? list.filter((x) => x !== w) : [...list, w]));
            }}
          >
            {w}
          </Chip>
        ))}
      </div>
      <p className="rounded-control bg-surface-2/70 p-4 font-display text-xl leading-snug" aria-live="polite">
        {words.length
          ? `„In der Nase ${words.slice(0, -1).join(", ")}${words.length > 1 ? " und " : ""}${words.at(-1)}.“`
          : "Tipp Begriffe an – so entsteht deine erste Notiz."}
      </p>
    </Card>
  );
}

function Tongue() {
  const [truth, setTruth] = useState(false);
  const zones = [
    { d: "M60 20c-16 0-26 10-26 22h52c0-12-10-22-26-22z", taste: "süß", color: "#e9b5cd" },
    { d: "M34 42c-2 14 0 30 4 44l10-2c-4-14-6-28-4-42z", taste: "salzig", color: "#b5c0c8" },
    { d: "M86 42c2 14 0 30-4 44l-10-2c4-14 6-28 4-42z", taste: "salzig", color: "#b5c0c8" },
    { d: "M38 86c4 20 8 34 22 40 14-6 18-20 22-40z", taste: "bitter", color: "#9fcaa8" },
    { d: "M44 42c-2 14 0 28 4 42h24c4-14 6-28 4-42z", taste: "sauer", color: "#e6d27a" },
  ];
  return (
    <Card className="space-y-4">
      <Eyebrow>Schmecken</Eyebrow>
      <Segmented<"mythos" | "wahrheit">
        label="Zungenkarte"
        value={truth ? "wahrheit" : "mythos"}
        onChange={(v) => {
          tick("minor");
          setTruth(v === "wahrheit");
        }}
        options={[
          { value: "mythos", label: "Die alte Zungenkarte" },
          { value: "wahrheit", label: "Wie es wirklich ist" },
        ]}
      />
      <div className="flex items-center gap-5">
        <svg viewBox="0 0 120 140" className="h-40 w-32 shrink-0" aria-hidden>
          <path
            d="M60 14c-30 0-34 30-30 60 4 34 14 56 30 60 16-4 26-26 30-60 4-30 0-60-30-60z"
            fill="#e7959b"
          />
          {zones.map((z, i) => (
            <motion.path
              key={i}
              d={z.d}
              initial={false}
              animate={{ fill: truth ? "#e7959b" : z.color, opacity: truth ? 0 : 0.95 }}
              transition={{ duration: 0.5 }}
            />
          ))}
          <path d="M60 30v84" stroke="#000" strokeOpacity="0.15" strokeWidth="2" strokeLinecap="round" />
          {truth &&
            [
              [44, 44],
              [74, 52],
              [52, 78],
              [70, 96],
              [48, 104],
              [64, 66],
              [78, 82],
            ].map(([cx, cy], i) => (
              <motion.circle
                key={i}
                cx={cx}
                cy={cy}
                r="3"
                fill="#fff"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 0.85, scale: 1 }}
                transition={{ delay: i * 0.05 }}
              />
            ))}
        </svg>
        <div className="space-y-2 text-sm leading-relaxed" aria-live="polite">
          {truth ? (
            <>
              <p>Die Karte ist ein Mythos: Alle fünf Grundgeschmäcker schmeckst du überall auf der Zunge.</p>
              <p className="flex flex-wrap gap-1.5">
                {TONGUE_TASTES.map((t) => (
                  <span key={t} className="rounded-full bg-surface-2 px-2.5 py-1 text-xs">
                    {t}
                  </span>
                ))}
              </p>
            </>
          ) : (
            <p>
              So stand es lange in Schulbüchern: vorne süß, an den Seiten salzig und sauer, hinten bitter.
              Stimmt das?
            </p>
          )}
        </div>
      </div>
      <ul className="grid gap-2 text-sm">
        <li>
          <strong>Säure</strong> – das Wasser läuft dir im Mund zusammen.
        </li>
        <li>
          <strong>Tannin</strong> – Zähne und Zahnfleisch fühlen sich trocken an.
        </li>
        <li>
          <strong>Alkohol</strong> – eine angenehme (oder brennende) Wärme im Rachen.
        </li>
        <li>
          <strong>Körper</strong> – wie schwer der Wein im Mund liegt, von Wasser bis Sahne.
        </li>
      </ul>
    </Card>
  );
}

function Finish() {
  const [start, setStart] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState<number | null>(null);
  const frame = useRef(0);

  useEffect(() => {
    if (start === null) return;
    const loop = () => {
      setElapsed((performance.now() - start) / 1000);
      frame.current = requestAnimationFrame(loop);
    };
    frame.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame.current);
  }, [start]);

  function toggle() {
    if (start === null) {
      tick("medium");
      setResult(null);
      setElapsed(0);
      setStart(performance.now());
    } else {
      tick("major");
      setResult((performance.now() - start) / 1000);
      setStart(null);
    }
  }

  const shown = result ?? elapsed;
  return (
    <Card className="space-y-4">
      <Eyebrow>Abgang</Eyebrow>
      <p className="text-sm leading-relaxed">
        Wie lange bleibt der Geschmack, nachdem du geschluckt hast? Profis zählen in Sekunden – ein langer
        Abgang ist ein Zeichen für Qualität.
      </p>
      <p className="text-center font-display text-7xl leading-none tabular-nums" aria-live="off">
        {shown.toFixed(1).replace(".", ",")}
        <span className="text-3xl text-muted"> s</span>
      </p>
      {result !== null && (
        <p className="text-center text-sm" aria-live="polite">
          Abgang: <strong>{describeFinish(result)}</strong>
        </p>
      )}
      <Button block size="lg" variant={start === null ? "primary" : "wine"} onClick={toggle}>
        {start === null ? "Geschluckt – Uhr starten" : "Geschmack ist weg – stopp"}
      </Button>
    </Card>
  );
}
