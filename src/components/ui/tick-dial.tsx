"use client";

import { useEffect, useId, useMemo, useRef } from "react";
import { cn } from "@/lib/cn";
import { releaseTick, tick, type Haptic } from "@/lib/haptics";

const TICK = 12; // px between two ticks

type TickDialProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  /** Smallest selectable step, e.g. 0.1 or 0.5. */
  step?: number;
  /** Numbered, tallest ticks - and the strongest haptic click. */
  majorEvery?: number;
  /** Mid-height ticks with a medium click (e.g. whole numbers between labels). */
  mediumEvery?: number;
  format?: (value: number) => string;
  /** Word for the current value, shown in the pill, e.g. "rassig". */
  describe?: (value: number) => string;
  className?: string;
};

const isMultiple = (value: number, of: number) => Math.abs(value / of - Math.round(value / of)) < 1e-6;
const decimalsOf = (n: number) => (String(n).split(".")[1] ?? "").length;

/**
 * Horizontal tick ruler you swipe like the iOS timer: the value under the
 * pointer is selected, ticks up to it light up, the edges fade out, and every
 * tick you pass clicks - harder on whole numbers / labelled values.
 * Native scrolling with snap points keeps momentum and feels right on phones.
 */
export function TickDial({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  majorEvery = 5,
  mediumEvery,
  format,
  describe,
  className,
}: TickDialProps) {
  const id = useId();
  const scroller = useRef<HTMLDivElement>(null);
  const lastIndex = useRef<number | null>(null);
  const frame = useRef(0);

  const count = Math.round((max - min) / step);
  const valueAt = (i: number) => Math.round((min + i * step) * 1e6) / 1e6;
  const indexOf = (v: number) => Math.min(count, Math.max(0, Math.round((v - min) / step)));

  const levelAt = (i: number): Haptic => {
    const v = valueAt(i);
    if (isMultiple(v, majorEvery)) return "major";
    if (mediumEvery && isMultiple(v, mediumEvery)) return "medium";
    return "minor";
  };

  const show = useMemo(() => {
    if (format) return format;
    const nf = new Intl.NumberFormat("de-DE", { maximumFractionDigits: decimalsOf(step) });
    return (v: number) => nf.format(v);
  }, [format, step]);

  // Put the ruler at the current value (on mount and when changed from outside).
  useEffect(() => {
    const node = scroller.current;
    const index = indexOf(value);
    if (!node || index === lastIndex.current) return;
    lastIndex.current = index;
    node.scrollTo({ left: index * TICK });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  function onScroll() {
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      const node = scroller.current;
      if (!node) return;
      const next = Math.min(count, Math.max(0, Math.round(node.scrollLeft / TICK)));
      const previous = lastIndex.current ?? next;
      if (next === previous) return;

      // Click with the strongest level among all ticks passed since last frame.
      const [from, to] = next > previous ? [previous + 1, next] : [next, previous - 1];
      let level: Haptic = "minor";
      for (let i = from; i <= to; i++) {
        const l = levelAt(i);
        if (l === "major") level = "major";
        else if (l === "medium" && level === "minor") level = "medium";
      }
      tick(level);

      lastIndex.current = next;
      onChange(valueAt(next));
    });
  }

  function jumpTo(next: number) {
    scroller.current?.scrollTo({ left: indexOf(next) * TICK, behavior: "smooth" });
  }

  function onKeyDown(event: React.KeyboardEvent) {
    const big = mediumEvery ?? majorEvery;
    const keys: Record<string, number> = {
      ArrowRight: value + step,
      ArrowUp: value + step,
      ArrowLeft: value - step,
      ArrowDown: value - step,
      PageUp: value + big,
      PageDown: value - big,
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
    const level = levelAt(i);
    const active = i <= selected;
    ticks.push(
      <button
        key={i}
        type="button"
        tabIndex={-1}
        aria-hidden
        onClick={() => jumpTo(valueAt(i))}
        className="relative flex h-full shrink-0 snap-center items-end justify-center"
        style={{ width: TICK }}
      >
        {level === "major" && (
          <span
            className={cn(
              "absolute top-0 text-[0.95rem] font-semibold tabular-nums transition-colors",
              active ? "text-accent" : "text-accent/35",
            )}
          >
            {show(valueAt(i))}
          </span>
        )}
        <span
          className={cn(
            "rounded-full transition-colors",
            level === "minor" ? "w-[2px]" : "w-[3px]",
            active ? "bg-accent" : level === "minor" ? "bg-accent/20" : "bg-accent/30",
          )}
          style={{ height: level === "major" ? 46 : level === "medium" ? 34 : 22 }}
        />
      </button>,
    );
  }

  return (
    <div className={cn("rounded-[1.75rem] bg-surface-2/70 pt-4 pb-4", className)}>
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
          aria-valuetext={describe ? `${show(value)} – ${describe(value)}` : show(value)}
          onScroll={onScroll}
          onTouchEnd={() => releaseTick(levelAt(lastIndex.current ?? selected))}
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
          {show(value)}
        </span>
      </div>
    </div>
  );
}
