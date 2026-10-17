"use client";

import Link from "next/link";
import { useState } from "react";
import { useAppearance } from "@/components/app/appearance-provider";
import { InviteDetails } from "@/components/event/invite-details";
import { InvitationTicket } from "@/components/event/invitation-ticket";
import { AromaWheel } from "@/components/tasting/aroma-wheel";
import { CountUp } from "@/components/tasting/count-up";
import { VeiledBottle, type RevealedBottle } from "@/components/tasting/veiled-bottle";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/card";
import { Chip, Pill } from "@/components/ui/chip";
import { TextField } from "@/components/ui/field";
import { Segmented } from "@/components/ui/segmented";
import { Sheet } from "@/components/ui/sheet";
import { TickDial } from "@/components/ui/tick-dial";
import { STRUCTURE_SCALES, describeRating, describeStructure, type StructureKey } from "@/config/tasting";
import type { ThemePreference } from "@/lib/appearance";
import { cn } from "@/lib/cn";

const SWATCHES = [
  ["bg", "Hintergrund"],
  ["surface", "Fläche"],
  ["surface-2", "Fläche 2"],
  ["fg", "Text"],
  ["muted", "Text leise"],
  ["accent", "Messing"],
  ["wine", "Wein"],
  ["curtain", "Samt"],
] as const;

const LEADERBOARD = [
  { name: "Tim", points: 412 },
  { name: "Jonas", points: 388 },
  { name: "Matti", points: 351 },
  { name: "Sophie", points: 290 },
  { name: "Ben", points: 254 },
];

const SAMPLE_WINES: { id: string; chip: string; bottle: RevealedBottle }[] = [
  {
    id: "riesling",
    chip: "Riesling",
    bottle: {
      shape: "flute",
      label: { producer: "Egon Müller", name: "Scharzhofberger Riesling", vintage: 2021 },
    },
  },
  {
    id: "silvaner",
    chip: "Silvaner (Pirat)",
    bottle: {
      shape: "flute",
      label: { producer: "Horst Sauer", name: "Escherndorfer Lump Silvaner", vintage: 2022 },
    },
  },
  {
    id: "pinot",
    chip: "Spätburgunder",
    bottle: {
      shape: "burgundy",
      label: { producer: "Rudolf Fürst", name: "Bürgstadter Centgrafenberg", vintage: 2019 },
    },
  },
  {
    id: "bordeaux",
    chip: "Lemberger",
    bottle: {
      shape: "burgundy",
      label: { producer: "Aldinger", name: "Lemberger Fellbacher Lämmler", vintage: 2020 },
    },
  },
];

const SAMPLE_GUESTS = ["Tim", "Jonas", "Matti", "Sophie", "Ben", "Lena", "Paul"];

export function Styleguide() {
  const { theme, setTheme } = useAppearance();
  const [sheet, setSheet] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [wine, setWine] = useState(SAMPLE_WINES[0]);

  return (
    <main className="mx-auto w-full max-w-5xl px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-16">
      <div className="sticky top-0 z-30 -mx-5 mb-8 border-b border-border bg-bg/90 px-5 py-3 backdrop-blur-xl">
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
          Dunkel &amp; edel, in Hell und Dunkel. Unten siehst du Bausteine und die wichtigsten Screens.{" "}
          <Link href="/abende" className="text-accent underline-offset-4 hover:underline">
            Zur App
          </Link>
        </p>
      </header>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
        <div className="space-y-12">
          <Section title="Screen · Einladung">
            <InvitationTicket
              organizerName="Tim"
              title="Riesling quer durch die Lagen"
              theme="Große Rieslinge von Saar bis Pfalz – und ein Pirat"
              startsAt="2026-10-23T17:00:00Z"
              location="Bei uns im Wohnzimmer"
              isBlind
              confirmed={7}
              limit={12}
            >
              <InviteDetails
                eventId="demo"
                title="Riesling quer durch die Lagen"
                startsAt="2026-10-23T17:00:00Z"
                location="Bei uns im Wohnzimmer"
                description="Acht Gläser, acht Lagen, ein Abend."
                invitePath="/e/demo"
                guests={SAMPLE_GUESTS}
                confirmed={7}
              />
            </InvitationTicket>
            <div className="grid grid-cols-2 gap-3">
              <Button size="lg">Ich bin dabei</Button>
              <Button size="lg" variant="secondary">
                Leider nicht
              </Button>
            </div>
          </Section>

          <Section title="Screen · Glas 3, verhüllt & aufgedeckt">
            <Phone>
              <div className="flex items-center justify-between">
                <Eyebrow>Glas 3 von 8</Eyebrow>
                <Pill>{revealed ? "Aufgedeckt" : "Runde läuft"}</Pill>
              </div>
              <div
                className="flex justify-center rounded-card py-6"
                style={{
                  background:
                    "radial-gradient(70% 55% at 50% 15%, color-mix(in oklab, var(--accent) 14%, transparent), transparent 70%), var(--surface-2)",
                }}
              >
                <VeiledBottle revealed={revealed} glass={3} bottle={wine.bottle} className="h-80" />
              </div>
              <div className="flex flex-wrap gap-2" aria-label="Beispielwein">
                {SAMPLE_WINES.map((sample) => (
                  <Chip
                    key={sample.id}
                    selected={sample.id === wine.id}
                    onClick={() => {
                      setRevealed(false);
                      setWine(sample);
                    }}
                  >
                    {sample.chip}
                  </Chip>
                ))}
              </div>
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

          <Section title="Screen · Zwischenstand">
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

        <div className="space-y-12">
          <Section title="Screen · Rate-Bogen">
            <Phone>
              <RatingSheetPreview />
            </Phone>
          </Section>

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

          <Section title="Buttons & Eingaben">
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
            </div>
            <TextField label="Dein Name" placeholder="So sehen dich die anderen" />
            <Button variant="secondary" onClick={() => setSheet(true)}>
              Bottom-Sheet öffnen
            </Button>
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

const DIMENSIONS: StructureKey[] = ["sweetness", "acidity", "body", "finish"];

function RatingSheetPreview() {
  const [structure, setStructure] = useState<Record<StructureKey, number>>({
    sweetness: 2,
    acidity: 8,
    body: 4,
    finish: 7,
    tannin: 0,
  });
  const [active, setActive] = useState<StructureKey>("acidity");
  const [aromas, setAromas] = useState<string[]>(["Pfirsich", "Schiefer"]);
  const [rating, setRating] = useState(91);

  return (
    <>
      <h2 className="text-3xl">Was schmeckst du?</h2>

      <div role="tablist" aria-label="Struktur" className="grid grid-cols-4 gap-1.5">
        {DIMENSIONS.map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={active === key}
            onClick={() => setActive(key)}
            className={cn(
              "flex h-14 flex-col items-center justify-center rounded-control text-xs font-medium transition",
              active === key ? "bg-accent text-accent-fg" : "bg-surface-2 text-muted",
            )}
          >
            {STRUCTURE_SCALES[key].label}
            <span className="font-display text-lg leading-none">
              {structure[key].toLocaleString("de-DE")}
            </span>
          </button>
        ))}
      </div>

      <TickDial
        key={active}
        label={STRUCTURE_SCALES[active].label}
        value={structure[active]}
        onChange={(value) => setStructure((current) => ({ ...current, [active]: value }))}
        min={0}
        max={10}
        step={0.1}
        majorEvery={1}
        mediumEvery={0.5}
        describe={(value) => describeStructure(active, value)}
      />

      <div className="space-y-3 pt-2">
        <h3 className="text-2xl">Aromen</h3>
        <AromaWheel value={aromas} onChange={setAromas} />
      </div>

      <div className="space-y-3 pt-2">
        <h3 className="text-2xl">Deine Bewertung</h3>
        <TickDial
          label="Punkte"
          value={rating}
          onChange={setRating}
          min={50}
          max={100}
          step={0.5}
          majorEvery={5}
          mediumEvery={1}
          describe={describeRating}
        />
      </div>
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
