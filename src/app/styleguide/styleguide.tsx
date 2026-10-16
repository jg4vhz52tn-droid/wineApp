"use client";

import Link from "next/link";
import { useState } from "react";
import { useAppearance } from "@/components/app/appearance-provider";
import { Bottle } from "@/components/tasting/bottle";
import { CountUp } from "@/components/tasting/count-up";
import { Curtain } from "@/components/tasting/curtain";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, Eyebrow } from "@/components/ui/card";
import { Chip, Pill } from "@/components/ui/chip";
import { TextField } from "@/components/ui/field";
import { CalendarIcon, PinIcon } from "@/components/ui/icons";
import { Segmented } from "@/components/ui/segmented";
import { Sheet } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { LOOK_LABELS, type Look, type ThemePreference } from "@/lib/appearance";

const SWATCHES = [
  ["bg", "Hintergrund"],
  ["surface", "Fläche"],
  ["surface-2", "Fläche 2"],
  ["fg", "Text"],
  ["muted", "Text leise"],
  ["accent", "Akzent"],
  ["wine", "Wein"],
  ["curtain", "Vorhang"],
] as const;

const AROMAS = ["Pfirsich", "Zitrus", "Grüner Apfel", "Schiefer", "Honig", "Petrol", "Kräuter", "Aprikose"];

const LEADERBOARD = [
  { name: "Anna", points: 412 },
  { name: "Tim", points: 388 },
  { name: "Jonas", points: 351 },
  { name: "Mira", points: 290 },
];

export function Styleguide() {
  const { look, theme, setLook, setTheme } = useAppearance();
  const [sheet, setSheet] = useState(false);
  const [revealed, setRevealed] = useState(false);

  return (
    <main className="mx-auto w-full max-w-5xl px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-16">
      {/* Sticky switcher so both looks can be compared on the phone. */}
      <div className="sticky top-0 z-30 -mx-5 mb-8 space-y-2 border-b border-border bg-bg/90 px-5 py-3 backdrop-blur-xl">
        <Segmented<Look>
          label="Look"
          value={look}
          onChange={setLook}
          options={[
            { value: "a", label: LOOK_LABELS.a },
            { value: "b", label: LOOK_LABELS.b },
          ]}
        />
        <Segmented<ThemePreference>
          label="Hell oder dunkel"
          value={theme}
          onChange={setTheme}
          options={[
            { value: "system", label: "Auto" },
            { value: "light", label: "Hell" },
            { value: "dark", label: "Dunkel" },
          ]}
        />
      </div>

      <header className="mb-12 space-y-3">
        <Eyebrow>Designsystem</Eyebrow>
        <h1 className="text-5xl leading-[1.02] sm:text-6xl">Premium-Weinbar trifft Produktdesign.</h1>
        <p className="max-w-xl text-muted">
          Zwei Looks zur Auswahl – jeweils hell und dunkel. Unten siehst du Bausteine und drei echte Screens.{" "}
          <Link href="/abende" className="text-accent underline-offset-4 hover:underline">
            Zur App
          </Link>
        </p>
      </header>

      <div className="grid gap-12 lg:grid-cols-[1fr_1fr]">
        <div className="space-y-12">
          <Section title="Farben">
            <div className="grid grid-cols-4 gap-3">
              {SWATCHES.map(([token, label]) => (
                <div key={token} className="space-y-1.5">
                  <div
                    className="aspect-square rounded-control border border-border"
                    style={{ background: `var(--${token})` }}
                  />
                  <p className="text-xs text-muted">{label}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Typografie">
            <p className="font-display text-5xl leading-none">Scharzhofberg</p>
            <p className="font-display text-3xl">Riesling Kabinett 2021</p>
            <p className="text-lg">Fließtext: Kühle Saar, grauer Schiefer, rassige Säure.</p>
            <p className="text-sm text-muted">Leiser Text für Zusatzinfos und Hinweise.</p>
          </Section>

          <Section title="Buttons & Chips">
            <div className="flex flex-wrap gap-3">
              <Button>Aufdecken</Button>
              <Button variant="wine">Ich bin dabei</Button>
              <Button variant="secondary">Später</Button>
              <Button variant="ghost">Abbrechen</Button>
              <Button loading>Speichern</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Chip selected>Riesling</Chip>
              <Chip>Silvaner</Chip>
              <Chip>Grauburgunder</Chip>
              <Pill>Pirat an Bord</Pill>
            </div>
          </Section>

          <Section title="Eingaben">
            <TextField label="Dein Name" placeholder="So sehen dich die anderen" />
            <Button variant="secondary" onClick={() => setSheet(true)}>
              Bottom-Sheet öffnen
            </Button>
          </Section>
        </div>

        <div className="space-y-12">
          <Section title="Screen · Einladung">
            <Phone>
              <Eyebrow>Tim lädt ein</Eyebrow>
              <h2 className="text-4xl leading-[1.02]">Riesling quer durch die Lagen</h2>
              <p className="text-muted">Große Rieslinge von Saar bis Pfalz – und ein Pirat</p>
              <div className="flex gap-2">
                <Pill>Blindverkostung</Pill>
                <Pill>7 Zusagen von 12</Pill>
              </div>
              <Card className="space-y-2 p-4 text-sm">
                <p className="flex items-center gap-3">
                  <CalendarIcon className="text-accent" /> Freitag, 23. Oktober, 19:00 Uhr
                </p>
                <p className="flex items-center gap-3">
                  <PinIcon className="text-accent" /> Bei uns im Wohnzimmer
                </p>
              </Card>
              <div className="grid grid-cols-2 gap-3">
                <Button size="lg">Ich bin dabei</Button>
                <Button size="lg" variant="secondary">
                  Leider nicht
                </Button>
              </div>
            </Phone>
          </Section>

          <Section title="Screen · Glas 3, verhüllt & aufgedeckt">
            <Phone>
              <div className="flex items-center justify-between">
                <Eyebrow>Glas 3 von 8</Eyebrow>
                <Pill>{revealed ? "Aufgedeckt" : "Runde läuft"}</Pill>
              </div>
              <Curtain revealed={revealed}>
                <div className="flex h-72 items-end justify-center bg-surface-2 pt-6">
                  <Bottle
                    className="h-64 w-24"
                    label={
                      <>
                        <span className="text-[0.55rem] tracking-widest text-muted uppercase">
                          Egon Müller
                        </span>
                        <span className="font-display text-[0.8rem] leading-tight text-fg">
                          Scharzhofberg
                        </span>
                        <span className="text-[0.55rem] text-muted">2021</span>
                      </>
                    }
                  />
                </div>
              </Curtain>
              <div className="flex items-center justify-between rounded-control bg-surface-2 px-4 py-3">
                <span className="text-sm text-muted">Deine Punkte</span>
                <span className="font-display text-3xl">
                  <CountUp value={revealed ? 87 : 0} />
                </span>
              </div>
              <Button
                block
                size="lg"
                variant={revealed ? "secondary" : "primary"}
                onClick={() => setRevealed(!revealed)}
              >
                {revealed ? "Wieder verhüllen" : "Aufdecken"}
              </Button>
            </Phone>
          </Section>

          <Section title="Screen · Rate-Bogen">
            <Phone>
              <RatingSheetPreview />
            </Phone>
          </Section>

          <Section title="Screen · Leaderboard">
            <Phone>
              <h2 className="text-3xl">Zwischenstand</h2>
              <ol className="space-y-2">
                {LEADERBOARD.map((row, index) => (
                  <li
                    key={row.name}
                    className="flex items-center gap-3 rounded-control bg-surface-2 px-3 py-2.5 first:bg-accent first:text-accent-fg"
                  >
                    <span className="w-5 text-center font-display text-xl">{index + 1}</span>
                    <Avatar name={row.name} className="size-9" />
                    <span className="flex-1 font-medium">{row.name}</span>
                    <span className="font-display text-2xl">
                      <CountUp value={row.points} />
                    </span>
                  </li>
                ))}
              </ol>
            </Phone>
          </Section>
        </div>
      </div>

      <Sheet open={sheet} onClose={() => setSheet(false)} title="Bist du sicher?">
        <p className="mb-5 text-muted">Bottom-Sheets lassen sich nach unten wegwischen.</p>
        <div className="grid grid-cols-2 gap-3">
          <Button variant="secondary" onClick={() => setSheet(false)}>
            Abbrechen
          </Button>
          <Button onClick={() => setSheet(false)}>Weiter</Button>
        </div>
      </Sheet>
    </main>
  );
}

function RatingSheetPreview() {
  const [structure, setStructure] = useState({ sweetness: 3, acidity: 8, body: 4 });
  const [aromas, setAromas] = useState<string[]>(["Pfirsich", "Schiefer"]);
  const [rating, setRating] = useState(91);
  const toggle = (aroma: string) =>
    setAromas((current) =>
      current.includes(aroma) ? current.filter((a) => a !== aroma) : [...current, aroma],
    );

  return (
    <>
      <h2 className="text-3xl">Was schmeckst du?</h2>
      <Slider
        label="Süße"
        value={structure.sweetness}
        onChange={(sweetness) => setStructure({ ...structure, sweetness })}
        ends={["knochentrocken", "edelsüß"]}
      />
      <Slider
        label="Säure"
        value={structure.acidity}
        onChange={(acidity) => setStructure({ ...structure, acidity })}
        ends={["mild", "rassig"]}
      />
      <Slider
        label="Körper"
        value={structure.body}
        onChange={(body) => setStructure({ ...structure, body })}
        ends={["leicht", "wuchtig"]}
      />
      <div className="space-y-2">
        <p className="text-sm font-medium">Aromen</p>
        <div className="flex flex-wrap gap-2">
          {AROMAS.map((aroma) => (
            <Chip key={aroma} selected={aromas.includes(aroma)} onClick={() => toggle(aroma)}>
              {aroma}
            </Chip>
          ))}
        </div>
      </div>
      <Slider
        label="Deine Bewertung"
        value={rating}
        onChange={setRating}
        min={50}
        max={100}
        ends={["50", "100"]}
      />
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="border-b border-border pb-2 font-sans text-sm font-medium tracking-wide text-muted">
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

/** A phone-sized frame so screens look the same on desktop as on the phone. */
function Phone({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-[390px] space-y-4 rounded-[2rem] border border-border bg-bg p-5 shadow-[0_20px_60px_-20px_rgb(0_0_0/0.4)]">
      {children}
    </div>
  );
}
