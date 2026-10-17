"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { TextField } from "@/components/ui/field";
import { Sheet } from "@/components/ui/sheet";
import { TickDial } from "@/components/ui/tick-dial";
import type { NewBottles, WineColor } from "@/lib/cellar/types";
import { tick } from "@/lib/haptics";

const YEAR = new Date().getFullYear();
const COLORS: { value: WineColor; label: string }[] = [
  { value: "white", label: "Weiß" },
  { value: "red", label: "Rot" },
  { value: "rose", label: "Rosé" },
  { value: "sparkling", label: "Schaumwein" },
  { value: "sweet", label: "Süßwein" },
];
const CLASSES = ["Gutswein", "Ortswein", "Erste Lage", "GG", "Kabinett", "Spätlese", "Auslese"];
const WINDOWS: { label: string; from: number | null; until: number | null }[] = [
  { label: "Jetzt – 3 Jahre", from: YEAR, until: YEAR + 3 },
  { label: "In 2 – 10 Jahren", from: YEAR + 2, until: YEAR + 10 },
  { label: "In 5 – 20 Jahren", from: YEAR + 5, until: YEAR + 20 },
  { label: "Weiß ich nicht", from: null, until: null },
];
const SHELVES = ["A", "B", "C", "D", "E", "F"];
const SLOTS = ["1", "2", "3", "4", "5", "6"];

export function AddBottlesSheet({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (input: NewBottles) => Promise<boolean>;
}) {
  const [producer, setProducer] = useState("");
  const [name, setName] = useState("");
  const [color, setColor] = useState<WineColor>("white");
  const [classification, setClassification] = useState<string | null>(null);
  const [vintage, setVintage] = useState(YEAR - 2);
  const [quantity, setQuantity] = useState(6);
  const [price, setPrice] = useState("");
  const [purchasedOn, setPurchasedOn] = useState(() => new Date().toISOString().slice(0, 10));
  const [windowIndex, setWindowIndex] = useState(1);
  const [shelf, setShelf] = useState<string | null>(null);
  const [compartment, setCompartment] = useState<string | null>(null);
  const [row, setRow] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const parsedPrice = price.trim() ? Number(price.replace(",", ".")) : null;
  const valid =
    producer.trim().length > 0 && (parsedPrice === null || (!Number.isNaN(parsedPrice) && parsedPrice >= 0));

  async function save() {
    if (!valid) return;
    setBusy(true);
    const w = WINDOWS[windowIndex];
    const ok = await onSave({
      producer: producer.trim(),
      name: name.trim(),
      color,
      vintage,
      quantity,
      purchasePrice: parsedPrice,
      purchasedOn,
      drinkFrom: w.from,
      drinkUntil: w.until,
      shelf,
      compartment,
      row,
      classification,
    });
    setBusy(false);
    if (ok) {
      tick("major");
      setProducer("");
      setName("");
      setPrice("");
      onClose();
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title="Flaschen hinzufügen">
      <div className="space-y-5 pb-4">
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

        <Group label="Qualitätsstufe (optional)">
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
          value={vintage}
          onChange={setVintage}
          min={1980}
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

        <Group label="Trinkfenster">
          {WINDOWS.map((w, i) => (
            <Chip key={w.label} selected={windowIndex === i} onClick={() => setWindowIndex(i)}>
              {w.label}
            </Chip>
          ))}
        </Group>

        <div className="space-y-3">
          <p className="text-sm font-medium">Lagerplatz (optional)</p>
          <Slots label="Regal" values={SHELVES} value={shelf} onChange={setShelf} />
          <Slots label="Fach" values={SLOTS} value={compartment} onChange={setCompartment} />
          <Slots label="Reihe" values={SLOTS} value={row} onChange={setRow} />
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
  values,
  value,
  onChange,
}: {
  label: string;
  values: string[];
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-12 text-xs text-muted">{label}</span>
      <div className="flex flex-1 gap-1.5" role="radiogroup" aria-label={label}>
        {values.map((v) => (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={value === v}
            onClick={() => {
              tick("minor");
              onChange(value === v ? null : v);
            }}
            className={`h-10 flex-1 rounded-control text-sm font-medium transition ${
              value === v ? "bg-accent text-accent-fg" : "bg-surface-2 text-fg"
            }`}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  );
}
