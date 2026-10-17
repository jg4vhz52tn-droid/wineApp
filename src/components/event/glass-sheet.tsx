"use client";

import { useEffect, useMemo, useState } from "react";
import { AromaWheel } from "@/components/tasting/aroma-wheel";
import { StructureDials } from "@/components/tasting/structure-dials";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { TextField } from "@/components/ui/field";
import { Segmented } from "@/components/ui/segmented";
import { Sheet } from "@/components/ui/sheet";
import { SwitchRow } from "@/components/ui/switch";
import { TickDial } from "@/components/ui/tick-dial";
import type { StructureKey } from "@/config/tasting";
import type { WineColor } from "@/lib/cellar/types";
import { cn } from "@/lib/cn";
import { ensureWine, fetchWineChoices, type WineChoice } from "@/lib/events/api";
import { COLOR_LABEL } from "@/lib/events/derive";
import type { Catalog, GlassInput, Participant, Secret, Structure } from "@/lib/events/types";

const YEAR = new Date().getFullYear();
const COLORS: WineColor[] = ["white", "red", "rose", "sparkling", "sweet"];
const CLASSES = ["Gutswein", "Ortswein", "Erste Lage", "GG", "Kabinett", "Spätlese", "Auslese"];
type Source = "cellar" | "catalogue" | "new";

export type GlassDraft = { number: number; secret?: Secret };

/** Organizer: which wine goes into glass N - from the cellar, the catalogue or new. */
export function GlassSheet({
  draft,
  eventId,
  participants,
  pirateMode,
  catalog,
  onClose,
  onSave,
}: {
  draft: GlassDraft | null;
  eventId: string;
  participants: Participant[];
  pirateMode: boolean;
  catalog: Catalog | null;
  onClose: () => void;
  onSave: (eventId: string, glass: GlassInput) => Promise<void>;
}) {
  return (
    <Sheet open={draft !== null} onClose={onClose} title={draft ? `Glas ${draft.number}` : ""}>
      {draft && (
        <GlassForm
          key={`${draft.number}-${draft.secret?.glassId ?? "new"}`}
          draft={draft}
          eventId={eventId}
          participants={participants}
          pirateMode={pirateMode}
          catalog={catalog}
          onSave={async (glass) => {
            await onSave(eventId, glass);
            onClose();
          }}
        />
      )}
    </Sheet>
  );
}

function GlassForm({
  draft,
  participants,
  pirateMode,
  catalog,
  onSave,
}: {
  draft: GlassDraft;
  eventId: string;
  participants: Participant[];
  pirateMode: boolean;
  catalog: Catalog | null;
  onSave: (glass: GlassInput) => Promise<void>;
}) {
  const secret = draft.secret;
  const [source, setSource] = useState<Source>(secret?.wine ? "catalogue" : "cellar");
  const [choices, setChoices] = useState<WineChoice[] | null>(null);
  const [query, setQuery] = useState("");
  const [vintageId, setVintageId] = useState<string | null>(secret?.wine?.vintageId ?? null);

  const [producer, setProducer] = useState("");
  const [name, setName] = useState("");
  const [color, setColor] = useState<WineColor>("white");
  const [grape, setGrape] = useState<string | null>(null);
  const [regionId, setRegionId] = useState<string | null>(null);
  const [siteId, setSiteId] = useState<string | null>(null);
  const [classification, setClassification] = useState<string | null>(null);
  const [vintage, setVintage] = useState(YEAR - 3);

  const [price, setPrice] = useState(secret?.price ? String(secret.price).replace(".", ",") : "");
  const [pirate, setPirate] = useState(secret?.isPirate ?? false);
  const [broughtBy, setBroughtBy] = useState<string | null>(secret?.broughtBy ?? null);
  const [withReference, setWithReference] = useState(
    Boolean(secret?.referenceStructure || secret?.referenceAromas.length),
  );
  const [structure, setStructure] = useState<Structure>(secret?.referenceStructure ?? {});
  const [aromas, setAromas] = useState<string[]>(secret?.referenceAromas ?? []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchWineChoices().then(setChoices);
  }, []);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (choices ?? [])
      .filter((c) => (source === "cellar" ? c.source === "cellar" : true))
      .filter((c) => !q || `${c.producer} ${c.name ?? ""} ${c.vintage ?? ""}`.toLowerCase().includes(q))
      .slice(0, 40);
  }, [choices, query, source]);

  const chosen = choices?.find((c) => c.vintageId === vintageId);
  const isRed = source === "new" ? color === "red" : (chosen?.color ?? secret?.wine?.color) === "red";
  const dims: StructureKey[] = isRed
    ? ["sweetness", "acidity", "body", "tannin"]
    : ["sweetness", "acidity", "body"];
  const parsedPrice = price.trim() ? Number(price.replace(",", ".")) : null;
  const valid =
    (source === "new" ? producer.trim().length > 0 : vintageId !== null) &&
    (parsedPrice === null || (!Number.isNaN(parsedPrice) && parsedPrice >= 0));
  const sites = catalog?.sites.filter((s) => s.regionId === regionId) ?? [];
  const yes = participants.filter((p) => p.rsvp === "yes");

  async function save() {
    if (!valid) return;
    setBusy(true);
    setError(null);
    try {
      const id =
        source === "new"
          ? await ensureWine({ producer, name, color, vintage, grape, regionId, siteId, classification })
          : vintageId;
      const cleanStructure = Object.fromEntries(
        Object.entries(structure).filter(([key]) => dims.includes(key as StructureKey)),
      );
      await onSave({
        number: draft.number,
        vintageId: id,
        price: parsedPrice,
        isPirate: pirateMode && pirate,
        broughtBy,
        referenceStructure: withReference && Object.keys(cleanStructure).length ? cleanStructure : null,
        referenceAromas: withReference ? aromas : [],
      });
    } catch {
      setError("Speichern hat nicht geklappt. Bitte noch einmal versuchen.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5 pb-4">
      <p className="text-sm text-muted">Nur du siehst, was in diesem Glas ist.</p>
      <Segmented
        label="Wein auswählen"
        value={source}
        onChange={setSource}
        options={[
          { value: "cellar", label: "Mein Keller" },
          { value: "catalogue", label: "Alle Weine" },
          { value: "new", label: "Neu" },
        ]}
      />

      {source !== "new" ? (
        <div className="space-y-3">
          <TextField
            label="Suchen"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Weingut, Wein oder Jahrgang"
          />
          {choices === null ? (
            <p className="text-sm text-muted">Lade Weine …</p>
          ) : list.length === 0 ? (
            <p className="text-sm text-muted">
              {source === "cellar" ? "Dein Keller ist leer oder nichts passt." : "Nichts gefunden."} Leg den
              Wein unter „Neu“ an.
            </p>
          ) : (
            <ul className="max-h-72 space-y-1.5 overflow-y-auto" role="radiogroup" aria-label="Wein">
              {list.map((c) => (
                <li key={`${c.source}-${c.vintageId}`}>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={vintageId === c.vintageId}
                    onClick={() => {
                      setVintageId(c.vintageId);
                      if (c.price && !price) setPrice(String(c.price).replace(".", ","));
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-control border px-4 py-3 text-left transition",
                      vintageId === c.vintageId ? "border-accent bg-accent/10" : "border-border bg-surface",
                    )}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{c.name ?? c.producer}</span>
                      <span className="block truncate text-sm text-muted">
                        {c.name ? `${c.producer} · ` : ""}
                        {c.vintage ?? "ohne Jahrgang"} · {COLOR_LABEL[c.color]}
                      </span>
                    </span>
                    {c.quantity !== undefined && (
                      <span className="text-xs text-muted">{c.quantity} im Keller</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <TextField
            label="Weingut"
            value={producer}
            onChange={(e) => setProducer(e.target.value)}
            placeholder="z. B. Keller"
          />
          <TextField
            label="Wein"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="z. B. Hubacker Riesling GG"
          />
          <ChipGroup label="Farbe">
            {COLORS.map((c) => (
              <Chip key={c} selected={color === c} onClick={() => setColor(c)}>
                {COLOR_LABEL[c]}
              </Chip>
            ))}
          </ChipGroup>
          <ChipGroup label="Rebsorte">
            {(catalog?.grapes ?? []).map((g) => (
              <Chip
                key={g.id}
                selected={grape === g.name}
                onClick={() => setGrape(grape === g.name ? null : g.name)}
              >
                {g.name}
              </Chip>
            ))}
          </ChipGroup>
          <TextField
            label="Andere Rebsorte"
            value={grape && !catalog?.grapes.some((g) => g.name === grape) ? grape : ""}
            onChange={(e) => setGrape(e.target.value || null)}
            placeholder="z. B. Grüner Veltliner"
          />
          <ChipGroup label="Region">
            {(catalog?.regions ?? []).map((r) => (
              <Chip
                key={r.id}
                selected={regionId === r.id}
                onClick={() => {
                  setRegionId(regionId === r.id ? null : r.id);
                  setSiteId(null);
                }}
              >
                {r.name}
              </Chip>
            ))}
          </ChipGroup>
          {sites.length > 0 && (
            <ChipGroup label="Lage">
              {sites.map((s) => (
                <Chip
                  key={s.id}
                  selected={siteId === s.id}
                  onClick={() => setSiteId(siteId === s.id ? null : s.id)}
                >
                  {s.name}
                </Chip>
              ))}
            </ChipGroup>
          )}
          <ChipGroup label="Qualitätsstufe">
            {CLASSES.map((c) => (
              <Chip
                key={c}
                selected={classification === c}
                onClick={() => setClassification(classification === c ? null : c)}
              >
                {c}
              </Chip>
            ))}
          </ChipGroup>
          <TickDial
            label="Jahrgang"
            value={vintage}
            onChange={setVintage}
            min={1900}
            max={YEAR}
            step={1}
            majorEvery={5}
          />
        </div>
      )}

      <TextField
        label="Preis pro Flasche (€)"
        inputMode="decimal"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        placeholder="für die Preis-Punkte und die Kostenteilung"
      />

      {pirateMode && (
        <SwitchRow
          label="Das ist der Pirat"
          description="Passt bewusst nicht ins Thema. Wer ihn findet, bekommt Bonuspunkte."
          checked={pirate}
          onChange={setPirate}
        />
      )}

      {yes.length > 0 && (
        <ChipGroup label="Mitgebracht von (optional)">
          {yes.map((p) => (
            <Chip
              key={p.id}
              selected={broughtBy === p.id}
              onClick={() => setBroughtBy(broughtBy === p.id ? null : p.id)}
            >
              {p.name}
            </Chip>
          ))}
        </ChipGroup>
      )}

      <SwitchRow
        label="Referenz hinterlegen"
        description="Deine Einschätzung von Struktur und Aromen. Ohne Referenz zählt der Schnitt der Runde."
        checked={withReference}
        onChange={setWithReference}
      />
      {withReference && (
        <div className="space-y-4">
          <StructureDials dimensions={dims} value={structure} onChange={setStructure} />
          <AromaWheel value={aromas} onChange={setAromas} />
        </div>
      )}

      <Button block size="lg" onClick={save} loading={busy} disabled={!valid}>
        Glas {draft.number} speichern
      </Button>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

function ChipGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}
