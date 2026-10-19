"use client";

import { CameraIcon } from "@/components/ui/icons";
import { useRef, useState } from "react";
import { Bottle } from "@/components/tasting/bottle";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { TextField } from "@/components/ui/field";
import { Sheet } from "@/components/ui/sheet";
import { TickDial } from "@/components/ui/tick-dial";
import { suggestDrinkWindow } from "@/lib/cellar/drink-window";
import type { NewBottles, Rack, WineColor } from "@/lib/cellar/types";
import { bottleShapeFor } from "@/config/bottles";
import { cn } from "@/lib/cn";
import { fetchCatalog } from "@/lib/events/api";
import { tick } from "@/lib/haptics";
import { scanLabel, type LabelScan } from "@/lib/wine-ai";
import { RackEditor } from "./rack-editor";

const YEAR = new Date().getFullYear();
const COLORS: { value: WineColor; label: string }[] = [
  { value: "white", label: "Weiß" },
  { value: "red", label: "Rot" },
  { value: "rose", label: "Rosé" },
  { value: "sparkling", label: "Schaumwein" },
  { value: "sweet", label: "Süßwein" },
];
const GRAPES = [
  "Riesling",
  "Silvaner",
  "Grauburgunder",
  "Weißburgunder",
  "Chardonnay",
  "Müller-Thurgau",
  "Sauvignon Blanc",
  "Spätburgunder",
  "Lemberger",
];
const CLASSES = ["Gutswein", "Ortswein", "Erste Lage", "GG", "Kabinett", "Spätlese", "Auslese"];
const PRESETS: { label: string; from: number | null; until: number | null }[] = [
  { label: "Jetzt – 3 Jahre", from: YEAR, until: YEAR + 3 },
  { label: "In 2 – 10 Jahren", from: YEAR + 2, until: YEAR + 10 },
  { label: "In 5 – 20 Jahren", from: YEAR + 5, until: YEAR + 20 },
  { label: "Weiß ich nicht", from: null, until: null },
];

export function AddBottlesSheet({
  open,
  racks,
  onClose,
  onSave,
  onAddRack,
}: {
  open: boolean;
  racks: Rack[];
  onClose: () => void;
  onSave: (input: NewBottles) => Promise<boolean>;
  onAddRack: (name: string, compartments: number, rows: number) => Promise<string | null>;
}) {
  const [producer, setProducer] = useState("");
  const [name, setName] = useState("");
  const [color, setColor] = useState<WineColor>("white");
  const [grape, setGrape] = useState<string | null>(null);
  const [classification, setClassification] = useState<string | null>(null);
  const [vintage, setVintage] = useState(YEAR - 2);
  const [quantity, setQuantity] = useState(6);
  const [price, setPrice] = useState("");
  const [purchasedOn, setPurchasedOn] = useState(() => new Date().toISOString().slice(0, 10));
  // -1 = the suggestion, 0..n = a preset
  const [windowChoice, setWindowChoice] = useState(-1);
  const [rackId, setRackId] = useState<string | null>(null);
  const [newRack, setNewRack] = useState(false);
  const [compartment, setCompartment] = useState<string | null>(null);
  const [row, setRow] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanned, setScanned] = useState<{ scan: LabelScan; label: Blob; preview: string } | null>(null);
  const [regionId, setRegionId] = useState<string | null>(null);
  const [siteId, setSiteId] = useState<string | null>(null);
  const camera = useRef<HTMLInputElement>(null);

  async function scan(file: File | undefined) {
    if (!file) return;
    setScanning(true);
    setScanError(null);
    try {
      const [result, catalog] = await Promise.all([scanLabel(file), fetchCatalog()]);
      const s = result.scan;
      if (!s.is_wine_label) {
        setScanError("Das sieht nicht nach einem Weinetikett aus. Noch ein Versuch?");
        return;
      }
      const same = (a: string | null | undefined, b: string | null | undefined) =>
        Boolean(a && b && a.trim().toLowerCase() === b.trim().toLowerCase());
      if (s.producer) setProducer(s.producer);
      if (s.name) setName(s.name);
      if (s.color && s.color !== "orange") setColor(s.color);
      if (s.grape) setGrape(GRAPES.find((g) => same(g, s.grape)) ?? s.grape);
      if (s.classification)
        setClassification(CLASSES.find((c) => same(c, s.classification)) ?? s.classification);
      if (s.vintage && s.vintage >= 1900 && s.vintage <= YEAR) setVintage(s.vintage);
      const region = catalog.regions.find((r) => same(r.name, s.region));
      const site = catalog.sites.find((x) => same(x.name, s.site) && (!region || x.regionId === region.id));
      setRegionId(site?.regionId ?? region?.id ?? null);
      setSiteId(site?.id ?? null);
      setScanned(result);
      tick("major");
    } catch (e) {
      setScanError(e instanceof Error ? e.message : "Das Etikett konnte nicht gelesen werden.");
    } finally {
      setScanning(false);
      if (camera.current) camera.current.value = "";
    }
  }

  const suggestion = suggestDrinkWindow({ color, grape, classification, vintage });
  const chosen = windowChoice === -1 ? suggestion : PRESETS[windowChoice];
  const rack = racks.find((r) => r.id === rackId) ?? null;
  const parsedPrice = price.trim() ? Number(price.replace(",", ".")) : null;
  const valid =
    producer.trim().length > 0 && (parsedPrice === null || (!Number.isNaN(parsedPrice) && parsedPrice >= 0));

  async function save() {
    if (!valid) return;
    setBusy(true);
    const ok = await onSave({
      producer: producer.trim(),
      name: name.trim(),
      color,
      grape,
      vintage,
      quantity,
      purchasePrice: parsedPrice,
      purchasedOn,
      drinkFrom: chosen.from,
      drinkUntil: chosen.until,
      rackId,
      compartment: rack ? compartment : null,
      row: rack ? row : null,
      classification,
      regionId,
      siteId,
      label: scanned?.label ?? null,
      labelPreview: scanned?.preview ?? null,
    });
    setBusy(false);
    if (ok) {
      tick("major");
      setProducer("");
      setName("");
      setScanned(null);
      setRegionId(null);
      setSiteId(null);
      setPrice("");
      setWindowChoice(-1);
      onClose();
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title="Flaschen hinzufügen">
      <div className="space-y-5 pb-4">
        <input
          ref={camera}
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          onChange={(e) => scan(e.target.files?.[0])}
        />
        {scanned ? (
          <div className="flex items-center gap-4 rounded-[1.75rem] bg-surface-2/70 p-4">
            <Bottle
              shape={bottleShapeFor(color)}
              label={{ producer, name: name || producer, vintage, photo: scanned.preview }}
              className="h-36 w-20 shrink-0"
            />
            <div className="min-w-0 space-y-1.5">
              <p className="text-xs font-medium tracking-[0.14em] text-accent uppercase">Etikett erkannt</p>
              <p className="font-display text-xl leading-tight">{name || producer}</p>
              <p className="text-sm text-muted">
                {[producer, vintage, scanned.scan.region].filter(Boolean).join(" · ")}
              </p>
              <p className="text-xs text-muted">
                {scanned.scan.confidence < 0.6
                  ? "Nicht ganz sicher – bitte unten prüfen."
                  : "Bitte kurz prüfen – du kannst unten alles ändern."}
              </p>
              <button
                type="button"
                className="text-xs font-medium text-accent"
                onClick={() => camera.current?.click()}
              >
                Neu scannen
              </button>
            </div>
          </div>
        ) : (
          <Button block size="lg" variant="wine" loading={scanning} onClick={() => camera.current?.click()}>
            <CameraIcon className="size-5" /> Etikett scannen
          </Button>
        )}
        {scanning && (
          <p role="status" className="text-center text-sm text-muted">
            Lese das Etikett …
          </p>
        )}
        {scanError && (
          <p role="alert" className="text-sm text-danger">
            {scanError}
          </p>
        )}
        <TextField
          label="Weingut"
          value={producer}
          onChange={(e) => setProducer(e.target.value)}
          placeholder="z. B. Dönnhoff"
        />
        <TextField
          label="Wein"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="z. B. Hermannshöhle Riesling"
        />

        <Group label="Farbe">
          {COLORS.map((c) => (
            <Chip key={c.value} selected={color === c.value} onClick={() => setColor(c.value)}>
              {c.label}
            </Chip>
          ))}
        </Group>

        <Group label="Rebsorte">
          {grape && !GRAPES.includes(grape) && (
            <Chip selected onClick={() => setGrape(null)}>
              {grape}
            </Chip>
          )}
          {GRAPES.map((g) => (
            <Chip key={g} selected={grape === g} onClick={() => setGrape(grape === g ? null : g)}>
              {g}
            </Chip>
          ))}
        </Group>

        <Group label="Qualitätsstufe (optional)">
          {classification && !CLASSES.includes(classification) && (
            <Chip selected onClick={() => setClassification(null)}>
              {classification}
            </Chip>
          )}
          {CLASSES.map((c) => (
            <Chip
              key={c}
              selected={classification === c}
              onClick={() => setClassification(classification === c ? null : c)}
            >
              {c}
            </Chip>
          ))}
        </Group>

        <TickDial
          label="Jahrgang"
          format={String}
          value={vintage}
          onChange={setVintage}
          min={1900}
          max={YEAR}
          step={1}
          majorEvery={5}
        />

        <div className="flex items-center justify-between rounded-[1.75rem] bg-surface-2/70 px-5 py-3">
          <span className="text-sm font-medium text-muted">Menge</span>
          <div className="flex items-center gap-3">
            <StepButton label="Eine weniger" onClick={() => setQuantity((q) => Math.max(1, q - 1))}>
              −
            </StepButton>
            <span className="w-12 text-center font-display text-4xl tabular-nums" aria-live="polite">
              {quantity}
            </span>
            <StepButton label="Eine mehr" onClick={() => setQuantity((q) => Math.min(120, q + 1))}>
              +
            </StepButton>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <TextField
            label="Preis pro Flasche (€)"
            inputMode="decimal"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="z. B. 24,50"
          />
          <TextField
            label="Gekauft am"
            type="date"
            value={purchasedOn}
            onChange={(e) => setPurchasedOn(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Trinkfenster</p>
          <button
            type="button"
            aria-pressed={windowChoice === -1}
            onClick={() => setWindowChoice(-1)}
            className={cn(
              "w-full rounded-control border p-4 text-left transition",
              windowChoice === -1 ? "border-accent bg-accent/10" : "border-border bg-surface",
            )}
          >
            <span className="block text-xs font-medium tracking-[0.14em] text-accent uppercase">
              Vorschlag
            </span>
            <span className="mt-1 block font-display text-2xl tabular-nums" aria-live="polite">
              {suggestion.from} – {suggestion.until}
            </span>
            <span className="block text-sm text-muted">{suggestion.reason}</span>
          </button>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((w, i) => (
              <Chip key={w.label} selected={windowChoice === i} onClick={() => setWindowChoice(i)}>
                {w.label}
              </Chip>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium">Lagerplatz (optional)</p>
          <div className="flex flex-wrap gap-2">
            {racks.map((r) => (
              <Chip
                key={r.id}
                selected={rackId === r.id}
                onClick={() => {
                  setRackId(rackId === r.id ? null : r.id);
                  setCompartment(null);
                  setRow(null);
                }}
              >
                {r.name}
              </Chip>
            ))}
            {!newRack && (
              <Chip onClick={() => setNewRack(true)} className="border-dashed">
                + Neues Regal
              </Chip>
            )}
          </div>
          {newRack && (
            <RackEditor
              onCancel={() => setNewRack(false)}
              onSave={async ({ name: rackName, compartments, rows }) => {
                const id = await onAddRack(rackName, compartments, rows);
                if (id) {
                  tick("medium");
                  setRackId(id);
                  setNewRack(false);
                }
              }}
            />
          )}
          {rack && (
            <>
              <Slots label="Fach" count={rack.compartments} value={compartment} onChange={setCompartment} />
              <Slots label="Reihe" count={rack.rows} value={row} onChange={setRow} />
            </>
          )}
        </div>

        <Button block size="lg" onClick={save} loading={busy} disabled={!valid}>
          {quantity} {quantity === 1 ? "Flasche" : "Flaschen"} einlagern
        </Button>
      </div>
    </Sheet>
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

export function StepButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={() => {
        tick("minor");
        onClick();
      }}
      className="flex size-11 items-center justify-center rounded-full bg-surface text-2xl font-medium active:scale-95"
    >
      {children}
    </button>
  );
}

function Slots({
  label,
  count,
  value,
  onChange,
}: {
  label: string;
  count: number;
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-12 shrink-0 text-xs text-muted">{label}</span>
      <div
        className="flex flex-1 [scrollbar-width:none] gap-1.5 overflow-x-auto"
        role="radiogroup"
        aria-label={label}
      >
        {Array.from({ length: count }, (_, i) => String(i + 1)).map((v) => (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={value === v}
            onClick={() => {
              tick("minor");
              onChange(value === v ? null : v);
            }}
            className={cn(
              "h-10 min-w-10 flex-1 rounded-control text-sm font-medium transition",
              value === v ? "bg-accent text-accent-fg" : "bg-surface-2 text-fg",
            )}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  );
}
