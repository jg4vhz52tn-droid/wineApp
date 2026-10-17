"use client";

import { useCallback, useEffect, useId, useRef } from "react";
import { cn } from "@/lib/cn";

const TICK = 12; // px between two ticks

type TickDialProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  /** Show a number above every n-th value tick. */
  labelEvery?: number;
  /** Extra, non-selectable ticks between two values (finer look on short scales). */
  minorTicks?: number;
  format?: (value: number) => string;
  /** Word for the current value, shown in the pill, e.g. "rassig". */
  describe?: (value: number) => string;
  className?: string;
};

/**
 * Horizontal tick ruler you swipe like the iOS timer: the value under the
 * pointer is selected, ticks up to it light up, the edges fade out.
 * Native scrolling with snap points keeps momentum and feels right on phones.
 */
export function TickDial({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  labelEvery = 5,
  minorTicks = 0,
  format = String,
  describe,
  className,
}: TickDialProps) {
  const id = useId();
  const scroller = useRef<HTMLDivElement>(null);
  const lastValue = useRef(value);
  const frame = useRef(0);

  const slot = TICK * (minorTicks + 1);
  const count = Math.round((max - min) / step);
  const indexOf = useCallback((v: number) => Math.round((v - min) / step), [min, step]);
  const clamp = useCallback((v: number) => Math.min(max, Math.max(min, v)), [min, max]);

  // Keep the ruler in place when the value is changed from outside.
  useEffect(() => {
    const node = scroller.current;
    // Skip values that came from scrolling itself (already in place).
    if (!node || (value === lastValue.current && node.scrollLeft !== 0)) return;
    lastValue.current = value;
    node.scrollTo({ left: indexOf(value) * slot });
  }, [value, indexOf, slot]);

  function onScroll() {
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      const node = scroller.current;
      if (!node) return;
      const next = clamp(min + Math.round(node.scrollLeft / slot) * step);
      if (next !== lastValue.current) {
        lastValue.current = next;
        navigator.vibrate?.(4);
        onChange(next);
      }
    });
  }

  function jumpTo(next: number) {
    const clamped = clamp(next);
    scroller.current?.scrollTo({ left: indexOf(clamped) * slot, behavior: "smooth" });
  }

  function onKeyDown(event: React.KeyboardEvent) {
    const keys: Record<string, number> = {
      ArrowRight: value + step,
      ArrowUp: value + step,
      ArrowLeft: value - step,
      ArrowDown: value - step,
      PageUp: value + step * labelEvery,
      PageDown: value - step * labelEvery,
      Home: min,
      End: max,
    };
    if (event.key in keys) {
      event.preventDefault();
      jumpTo(keys[event.key]);
    }
  }

  const selected = indexOf(value);
  const ticks = [];
  for (let i = 0; i <= count; i++) {
    const tickValue = min + i * step;
    const active = i <= selected;
    const labelled = i % labelEvery === 0;
    ticks.push(
      <button
        key={`v${i}`}
        type="button"
        tabIndex={-1}
        aria-hidden
        onClick={() => jumpTo(tickValue)}
        className="relative flex h-full shrink-0 snap-center items-end justify-center"
        style={{ width: TICK }}
      >
        {labelled && (
          <span
            className={cn(
              "absolute top-0 text-[0.95rem] font-semibold tabular-nums transition-colors",
              active ? "text-accent" : "text-accent/35",
            )}
          >
            {format(tickValue)}
          </span>
        )}
        <span
          className={cn("w-[3px] rounded-full transition-colors", active ? "bg-accent" : "bg-accent/30")}
          style={{ height: 46 }}
        />
      </button>,
    );
    if (i < count) {
      for (let m = 0; m < minorTicks; m++) {
        ticks.push(
          <span
            key={`m${i}-${m}`}
            aria-hidden
            className="flex h-full shrink-0 items-end justify-center"
            style={{ width: TICK }}
          >
            <span
              className={cn("w-[2px] rounded-full", i < selected ? "bg-accent/80" : "bg-accent/20")}
              style={{ height: 30 }}
            />
          </span>,
        );
      }
    }
  }

  return (
    <div className={cn("rounded-[1.75rem] bg-surface-2/70 px-0 pt-4 pb-4", className)}>
      <p id={`${id}-label`} className="px-5 text-sm font-medium text-muted">
        {label}
      </p>
      <div className="relative mt-2">
        <div
          ref={scroller}
          role="slider"
          tabIndex={0}
          aria-labelledby={`${id}-label`}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          aria-valuetext={describe ? `${format(value)} – ${describe(value)}` : format(value)}
          onScroll={onScroll}
          onKeyDown={onKeyDown}
          className="flex h-20 snap-x snap-mandatory [scrollbar-width:none] overflow-x-auto overscroll-x-contain outline-none focus-visible:ring-2 focus-visible:ring-accent/60 [&::-webkit-scrollbar]:hidden"
          style={{
            paddingInline: `calc(50% - ${TICK / 2}px)`,
            touchAction: "pan-x",
            maskImage: "linear-gradient(to right, transparent, black 22%, black 78%, transparent)",
            WebkitMaskImage: "linear-gradient(to right, transparent, black 22%, black 78%, transparent)",
          }}
        >
          {ticks}
        </div>
        {/* Pointer */}
        <div
          aria-hidden
          className="mx-auto mt-2 h-3 w-4 bg-accent"
          style={{ clipPath: "polygon(50% 0, 100% 100%, 0 100%)", borderRadius: 2 }}
        />
      </div>
      <div className="mt-3 flex items-center justify-between gap-3 px-5">
        <span className="min-h-11 rounded-full bg-accent/15 px-4 py-2.5 text-sm font-semibold text-accent">
          {describe ? describe(value) : label}
        </span>
        <span className="font-display text-6xl leading-none text-accent tabular-nums" aria-hidden>
          {format(value)}
        </span>
      </div>
    </div>
  );
}
