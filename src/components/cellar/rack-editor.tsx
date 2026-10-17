"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import type { Rack } from "@/lib/cellar/types";
import { StepButton } from "./add-bottles";

const IDEAS = ["Keller", "Weinkühlschrank", "Wohnzimmer", "Ferienhaus"];

/** Name a rack and set its grid. Used for new racks and to edit existing ones. */
export function RackEditor({
  rack,
  onSave,
  onCancel,
}: {
  rack?: Rack;
  onSave: (values: { name: string; compartments: number; rows: number }) => Promise<unknown>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(rack?.name ?? "");
  const [compartments, setCompartments] = useState(rack?.compartments ?? 4);
  const [rows, setRows] = useState(rack?.rows ?? 4);
  const [busy, setBusy] = useState(false);

  return (
    <div className="space-y-4 rounded-[1.75rem] bg-surface-2/70 p-4">
      <TextField
        label={rack ? "Name des Regals" : "Neues Regal"}
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={60}
        placeholder="z. B. Keller Ferienhaus"
      />
      {!rack && (
        <div className="flex flex-wrap gap-1.5">
          {IDEAS.map((idea) => (
            <button
              key={idea}
              type="button"
              onClick={() => setName(idea)}
              className="h-8 rounded-full bg-surface px-3 text-xs text-muted"
            >
              {idea}
            </button>
          ))}
        </div>
      )}
      <Counter label="Fächer (nebeneinander)" value={compartments} onChange={setCompartments} max={20} />
      <Counter label="Reihen (übereinander)" value={rows} onChange={setRows} max={30} />
      <div className="grid grid-cols-2 gap-2">
        <Button variant="ghost" onClick={onCancel}>
          Abbrechen
        </Button>
        <Button
          disabled={!name.trim()}
          loading={busy}
          onClick={async () => {
            setBusy(true);
            await onSave({ name: name.trim(), compartments, rows });
            setBusy(false);
          }}
        >
          {rack ? "Speichern" : "Regal anlegen"}
        </Button>
      </div>
    </div>
  );
}

function Counter({
  label,
  value,
  onChange,
  max,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  max: number;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm">{label}</span>
      <div className="flex items-center gap-2">
        <StepButton label={`${label}: weniger`} onClick={() => onChange(Math.max(1, value - 1))}>
          −
        </StepButton>
        <span className="w-8 text-center font-display text-2xl tabular-nums" aria-live="polite">
          {value}
        </span>
        <StepButton label={`${label}: mehr`} onClick={() => onChange(Math.min(max, value + 1))}>
          +
        </StepButton>
      </div>
    </div>
  );
}
