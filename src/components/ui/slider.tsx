"use client";

import { useId } from "react";

type SliderProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  /** Words for the ends of the scale, e.g. ["trocken", "süß"]. */
  ends?: [string, string];
  format?: (value: number) => string;
};

export function Slider({ label, value, onChange, min = 0, max = 10, step = 1, ends, format }: SliderProps) {
  const id = useId();
  const fill = `${((value - min) / (max - min)) * 100}%`;
  const shown = format ? format(value) : String(value);
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        <span className="font-display text-xl tabular-nums" aria-hidden>
          {shown}
        </span>
      </div>
      <input
        id={id}
        type="range"
        className="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-valuetext={shown}
        style={{ "--fill": fill } as React.CSSProperties}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      {ends && (
        <div className="-mt-1 flex justify-between text-xs text-muted" aria-hidden>
          <span>{ends[0]}</span>
          <span>{ends[1]}</span>
        </div>
      )}
    </div>
  );
}
