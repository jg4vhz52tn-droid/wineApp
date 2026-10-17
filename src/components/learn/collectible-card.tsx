import type { LearnModule } from "@/config/learn/modules";
import { cn } from "@/lib/cn";
import { Motif } from "./motif";

const INK = "#f4ede5";
const BRASS = "#d1ad72";

/** A collectible card: dark wine card with brass foil frame. Locked = silhouette. */
export function CollectibleCard({
  item,
  locked = false,
  number,
  className,
}: {
  item: LearnModule;
  locked?: boolean;
  number: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative aspect-[5/7] overflow-hidden rounded-[1.1rem] p-3 shadow-[0_18px_40px_-20px_rgb(0_0_0/0.7)]",
        className,
      )}
      style={{
        color: INK,
        background: locked
          ? "repeating-linear-gradient(135deg, var(--surface-2) 0 8px, var(--surface) 8px 16px)"
          : "radial-gradient(120% 80% at 20% 0%, #7a1f40 0%, transparent 60%), radial-gradient(100% 70% at 100% 100%, #3d1a2d, transparent 70%), #170b11",
      }}
      aria-label={locked ? `Gesperrte Karte ${number}` : `Sammelkarte ${item.card.title}`}
    >
      <div
        className="pointer-events-none absolute inset-1.5 rounded-[0.85rem] border"
        style={{ borderColor: locked ? "var(--border)" : `${BRASS}80` }}
      />
      {locked ? (
        <div className="flex h-full flex-col items-center justify-center gap-2 text-muted">
          <span className="font-display text-4xl opacity-50">?</span>
          <span className="text-[0.65rem] tracking-[0.18em] uppercase">Nr. {number}</span>
        </div>
      ) : (
        <div className="relative flex h-full flex-col">
          <div
            className="flex items-center justify-between text-[0.6rem] tracking-[0.2em] uppercase"
            style={{ color: BRASS }}
          >
            <span>Lernen</span>
            <span>Nr. {number}</span>
          </div>
          <div className="flex flex-1 items-center justify-center" style={{ color: BRASS }}>
            <Motif motif={item.motif} className="size-[55%]" />
          </div>
          <p className="font-display text-xl leading-tight">{item.card.title}</p>
          <p className="mt-1 text-[0.7rem] leading-snug" style={{ color: `${INK}b3` }}>
            {item.card.line}
          </p>
        </div>
      )}
    </div>
  );
}
