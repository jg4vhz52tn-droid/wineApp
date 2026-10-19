"use client";

import { useState } from "react";
import { Chip } from "@/components/ui/chip";
import { AROMA_FAMILIES } from "@/config/aromas";
import { AROMA_TIPS } from "@/config/guided";
import { cn } from "@/lib/cn";
import { tick } from "@/lib/haptics";

/**
 * The easy way to pick aromas: first the family ("Steinobst?"), then the
 * aromas in it. The "?" next to each aroma shows how to find it.
 */
export function AromaFamilyPicker({
  value,
  onChange,
}: {
  value: string[];
  onChange: (aromas: string[]) => void;
}) {
  const [families, setFamilies] = useState<string[]>(() =>
    AROMA_FAMILIES.filter((f) => f.aromas.some((a) => value.includes(a))).map((f) => f.id),
  );
  const [hint, setHint] = useState<string | null>(null);
  const toggle = (a: string) => {
    tick("minor");
    onChange(value.includes(a) ? value.filter((x) => x !== a) : [...value, a]);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-sm text-muted">Woran erinnert dich der Duft? Erst grob wählen …</p>
        <div className="flex flex-wrap gap-2">
          {AROMA_FAMILIES.map((f) => (
            <Chip
              key={f.id}
              selected={families.includes(f.id)}
              onClick={() =>
                setFamilies((x) => (x.includes(f.id) ? x.filter((y) => y !== f.id) : [...x, f.id]))
              }
            >
              <span className="mr-1.5 inline-block size-2.5 rounded-full" style={{ background: f.color }} />
              {f.name}
            </Chip>
          ))}
        </div>
      </div>
      {AROMA_FAMILIES.filter((f) => families.includes(f.id)).map((f) => (
        <div key={f.id} className="space-y-1.5">
          <p className="text-xs font-medium text-muted">… und genauer: {f.name}</p>
          <div className="flex flex-wrap gap-1.5">
            {f.aromas.map((a) => (
              <span key={a} className="inline-flex items-center">
                <button
                  type="button"
                  aria-pressed={value.includes(a)}
                  onClick={() => toggle(a)}
                  className={cn(
                    "h-10 rounded-l-full border border-r-0 pr-2 pl-3.5 text-sm font-medium transition",
                    value.includes(a) ? "border-transparent text-[#1a0f12]" : "border-border bg-surface",
                  )}
                  style={value.includes(a) ? { background: f.color } : undefined}
                >
                  {a}
                </button>
                <button
                  type="button"
                  aria-label={`Tipp zu ${a}`}
                  onClick={() => setHint(hint === a ? null : a)}
                  className={cn(
                    "h-10 rounded-r-full border px-2.5 text-xs text-muted",
                    value.includes(a) ? "border-transparent" : "border-border bg-surface",
                  )}
                  style={value.includes(a) ? { background: f.color, color: "#1a0f12" } : undefined}
                >
                  ?
                </button>
              </span>
            ))}
          </div>
          {hint && f.aromas.includes(hint) && (
            <p className="rounded-control bg-surface-2/60 px-3 py-2 text-xs">
              💡 <b className="font-medium">{hint}:</b> {AROMA_TIPS[hint]}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
