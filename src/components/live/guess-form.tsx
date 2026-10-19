"use client";

import { useState } from "react";
import { AromaWheel } from "@/components/tasting/aroma-wheel";
import { StructureDials } from "@/components/tasting/structure-dials";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { SwitchRow } from "@/components/ui/switch";
import { TickDial } from "@/components/ui/tick-dial";
import { AromaFamilyPicker } from "@/components/tasting/aroma-family-picker";
import { PALATE } from "@/config/guided";
import { describeRating, STRUCTURE_SCALES } from "@/config/tasting";
import { submitGuess } from "@/lib/events/api";
import { COUNTRIES } from "@/lib/events/derive";
import type { Catalog, Glass, Guess, Structure } from "@/lib/events/types";
import { tick } from "@/lib/haptics";

const YEAR = new Date().getFullYear();
const MAIN_COUNTRIES = ["DE", "AT", "FR", "IT"];

/** The Rate-Bogen for one glass: thumbs, not keyboard. Can be changed until the reveal. */
export function GuessForm({
  eventId,
  glass,
  participantId,
  existing,
  catalog,
  pirateMode,
  beginner = false,
  onBeginnerChange,
  onSubmitted,
}: {
  eventId: string;
  glass: Glass;
  participantId: string;
  existing: Guess | undefined;
  catalog: Catalog | null;
  pirateMode: boolean;
  /** Einsteiger-Modus: fewer fields, families first, tips. Same scoring rules for everyone. */
  beginner?: boolean;
  onBeginnerChange?: (beginner: boolean) => void;
  onSubmitted: () => Promise<void>;
}) {
  const [structure, setStructure] = useState<Structure>(existing?.structure ?? {});
  const [aromas, setAromas] = useState<string[]>(existing?.aromas ?? []);
  const [grapeId, setGrapeId] = useState<string | null>(existing?.grapeId ?? null);
  const [country, setCountry] = useState<string | null>(existing?.countryCode ?? null);
  const [regionId, setRegionId] = useState<string | null>(existing?.regionId ?? null);
  const [siteId, setSiteId] = useState<string | null>(existing?.siteId ?? null);
  const [vintage, setVintage] = useState<number | null>(existing?.vintage ?? null);
  const [price, setPrice] = useState<number | null>(existing?.price ?? null);
  const [rating, setRating] = useState<number>(existing?.rating ?? 90);
  const [rated, setRated] = useState(existing?.rating != null);
  const [pirate, setPirate] = useState(existing?.markedPirate ?? false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(Boolean(existing));
  const [moreOrigin, setMoreOrigin] = useState(Boolean(existing?.regionId || existing?.siteId));

  const regionCountry = (id: string | null) => catalog?.regions.find((r) => r.id === id)?.countryCode ?? null;
  const countries = [...new Set([...MAIN_COUNTRIES, ...(catalog?.regions.map((r) => r.countryCode) ?? [])])];
  const regions = (catalog?.regions ?? []).filter((r) => !country || r.countryCode === country);
  const sites = (catalog?.sites ?? []).filter((s) => s.regionId === regionId);

  const dirty = () => setSaved(false);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await submitGuess(eventId, glass.id, participantId, existing?.id ?? null, {
        structure,
        aromas,
        grapeId,
        countryCode: country ?? regionCountry(regionId),
        regionId,
        siteId,
        vintage,
        price,
        rating: rated ? rating : null,
        markedPirate: pirateMode && pirate,
      });
      tick("major");
      setSaved(true);
      await onSubmitted();
    } catch {
      setError("Abgeben hat nicht geklappt – ist die Runde schon geschlossen?");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-7" onChangeCapture={dirty}>
      {onBeginnerChange && (
        <SwitchRow
          label="Einfacher Bogen"
          description={
            beginner
              ? "Weniger Felder, Tipps dazu – gezählt wird nach denselben Regeln."
              : "Für Einsteiger: weniger Felder und kleine Tipps."
          }
          checked={beginner}
          onChange={onBeginnerChange}
        />
      )}

      <section className="space-y-3">
        <h2 className="text-3xl">Was schmeckst du?</h2>
        <StructureDials
          dimensions={
            beginner ? ["sweetness", "acidity", "body"] : ["sweetness", "acidity", "body", "tannin", "finish"]
          }
          value={structure}
          onChange={(next) => {
            setStructure(next);
            dirty();
          }}
        />
        {beginner ? (
          <ul className="space-y-1 rounded-control bg-surface-2/60 px-4 py-3 text-xs leading-relaxed">
            {(["sweetness", "acidity", "body"] as const).map((k) => (
              <li key={k}>
                💡 <b className="font-medium">{STRUCTURE_SCALES[k].label}:</b> {PALATE[k].tip}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-muted">Tannin zählt nur bei Rotwein.</p>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="text-2xl">Aromen</h3>
        {beginner ? (
          <AromaFamilyPicker
            value={aromas}
            onChange={(next) => {
              setAromas(next);
              dirty();
            }}
          />
        ) : (
          <AromaWheel
            value={aromas}
            onChange={(next) => {
              setAromas(next);
              dirty();
            }}
          />
        )}
      </section>

      <section className="space-y-4">
        <h3 className="text-2xl">Woher kommt er?</h3>
        <Group label="Rebsorte">
          {(catalog?.grapes ?? []).map((g) => (
            <Chip
              key={g.id}
              selected={grapeId === g.id}
              onClick={() => {
                setGrapeId(grapeId === g.id ? null : g.id);
                dirty();
              }}
            >
              {g.name}
            </Chip>
          ))}
        </Group>
        <Group label="Land">
          {countries.map((code) => (
            <Chip
              key={code}
              selected={country === code}
              onClick={() => {
                setCountry(country === code ? null : code);
                if (regionCountry(regionId) !== code) {
                  setRegionId(null);
                  setSiteId(null);
                }
                dirty();
              }}
            >
              {COUNTRIES[code] ?? code}
            </Chip>
          ))}
        </Group>
        {beginner && !moreOrigin && (
          <button
            type="button"
            className="text-sm font-medium text-accent"
            onClick={() => setMoreOrigin(true)}
          >
            + Region und Lage raten (für Mutige)
          </button>
        )}
        {(!beginner || moreOrigin) && regions.length > 0 && (
          <Group label="Region">
            {regions.map((r) => (
              <Chip
                key={r.id}
                selected={regionId === r.id}
                onClick={() => {
                  setRegionId(regionId === r.id ? null : r.id);
                  setSiteId(null);
                  if (regionId !== r.id) setCountry(r.countryCode);
                  dirty();
                }}
              >
                {r.name}
              </Chip>
            ))}
          </Group>
        )}
        {(!beginner || moreOrigin) && sites.length > 0 && (
          <Group label="Lage">
            {sites.map((s) => (
              <Chip
                key={s.id}
                selected={siteId === s.id}
                onClick={() => {
                  setSiteId(siteId === s.id ? null : s.id);
                  dirty();
                }}
              >
                {s.name}
              </Chip>
            ))}
          </Group>
        )}
        {beginner && (
          <p className="text-xs text-muted">
            💡 Jahrgang und Preis einfach schätzen – auch knapp daneben gibt es Punkte. Junge Weißweine sind
            meist 1–3 Jahre alt.
          </p>
        )}
        <TickDial
          label="Jahrgang"
          format={String}
          value={vintage ?? YEAR - 3}
          onChange={(v) => {
            setVintage(v);
            dirty();
          }}
          min={1960}
          max={YEAR}
          step={1}
          majorEvery={5}
          describe={() => (vintage === null ? "Wischen zum Schätzen" : "dein Tipp")}
        />
        <TickDial
          label="Preis pro Flasche in €"
          value={price ?? 25}
          onChange={(v) => {
            setPrice(v);
            dirty();
          }}
          min={5}
          max={200}
          step={1}
          majorEvery={10}
          mediumEvery={5}
          format={String}
          describe={() => (price === null ? "Wischen zum Schätzen" : "dein Tipp")}
        />
      </section>

      <section className="space-y-3">
        <h3 className="text-2xl">Deine Bewertung</h3>
        {beginner && (
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
                selected={rated && rating === value}
                className="justify-center"
                onClick={() => {
                  setRating(value);
                  setRated(true);
                  dirty();
                }}
              >
                {label}
              </Chip>
            ))}
          </div>
        )}
        <TickDial
          label="Punkte"
          value={rating}
          onChange={(v) => {
            setRating(v);
            setRated(true);
            dirty();
          }}
          min={50}
          max={100}
          step={0.5}
          majorEvery={5}
          mediumEvery={1}
          describe={(v) => (rated ? describeRating(v) : "Wischen zum Bewerten")}
        />
      </section>

      {pirateMode && (
        <SwitchRow
          label="Das ist der Pirat!"
          description="Passt dieser Wein nicht ins Thema?"
          checked={pirate}
          onChange={(v) => {
            setPirate(v);
            dirty();
          }}
        />
      )}

      <div className="sticky bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-10 space-y-2">
        <Button block size="lg" onClick={submit} loading={busy} variant={saved ? "secondary" : "primary"}>
          {saved
            ? "✓ Abgegeben – erneut speichern"
            : existing
              ? "Änderung abgeben"
              : `Glas ${glass.number} abgeben`}
        </Button>
        {error && (
          <p role="alert" className="rounded-control bg-surface px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}
      </div>
      {saved && (
        <p className="text-center text-sm text-muted">Bis zum Aufdecken kannst du noch alles ändern.</p>
      )}
    </div>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}
