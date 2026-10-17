import type { LearnModule } from "@/config/learn/modules";

/** Small line-art motifs (brass on wine) for module tiles and collectible cards. */
export function Motif({ motif, className }: { motif: LearnModule["motif"]; className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {motif === "soil" && (
        <>
          <path d="M6 22h52" />
          <path d="M6 32c8-3 14 3 22 0s16-3 24 0" />
          <path d="M6 42c10 3 16-3 26 0s14 3 26-1" />
          <path d="M6 52c8-2 18 2 26 0s16-2 26 0" />
          <path d="M32 22v8c0 4-4 6-4 10s5 6 5 10" />
          <path d="M32 30c3 2 6 2 8 6" />
          <path d="M32 10v12M27 14c2 0 4 2 5 4M37 13c-2 0-4 2-5 5" />
        </>
      )}
      {motif === "grape" && (
        <>
          <path d="M32 8c0 4 2 6 6 7" />
          <path d="M38 12c5-3 10-1 12 3-5 2-9 1-12-3z" />
          {[
            [24, 22],
            [32, 22],
            [40, 22],
            [28, 30],
            [36, 30],
            [44, 30],
            [24, 38],
            [32, 38],
            [40, 38],
            [28, 46],
            [36, 46],
            [32, 54],
          ].map(([cx, cy]) => (
            <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="4" />
          ))}
        </>
      )}
      {motif === "aroma" && (
        <>
          <circle cx="32" cy="32" r="22" />
          <circle cx="32" cy="32" r="9" />
          {Array.from({ length: 8 }, (_, i) => {
            const a = (i * Math.PI) / 4;
            return (
              <line
                key={i}
                x1={(32 + 9 * Math.cos(a)).toFixed(2)}
                y1={(32 + 9 * Math.sin(a)).toFixed(2)}
                x2={(32 + 22 * Math.cos(a)).toFixed(2)}
                y2={(32 + 22 * Math.sin(a)).toFixed(2)}
              />
            );
          })}
        </>
      )}
      {motif === "cellar" && (
        <>
          <path d="M10 56V28a22 22 0 0 1 44 0v28" />
          <path d="M6 56h52" />
          {[
            [24, 32],
            [32, 32],
            [40, 32],
            [24, 40],
            [32, 40],
            [40, 40],
            [24, 48],
            [32, 48],
            [40, 48],
          ].map(([cx, cy]) => (
            <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="3" />
          ))}
        </>
      )}
      {motif === "label" && (
        <>
          <rect x="14" y="10" width="36" height="44" rx="2" />
          <rect x="18" y="14" width="28" height="36" rx="1" strokeOpacity="0.5" />
          <path d="M24 22h16M22 30h20M26 36h12M28 44h8" />
        </>
      )}
      {motif === "fault" && (
        <>
          <rect x="22" y="8" width="16" height="26" rx="3" />
          <path d="M26 14l3 5-2 4 4 5" />
          <circle cx="40" cy="44" r="10" />
          <path d="M47 51l7 7" />
          <path d="M36 44h8M40 40v8" strokeOpacity="0.5" />
        </>
      )}
    </svg>
  );
}
