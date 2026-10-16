/** Slim flute silhouette (Riesling bottle). Pure shape, no clipart. */
export function Bottle({ label, className }: { label?: React.ReactNode; className?: string }) {
  return (
    <div className={className} style={{ position: "relative" }}>
      <svg viewBox="0 0 120 360" className="h-full w-full" aria-hidden>
        <defs>
          <linearGradient id="glass" x1="0" x2="1">
            <stop offset="0" stopColor="var(--fg)" stopOpacity="0.10" />
            <stop offset="0.35" stopColor="var(--fg)" stopOpacity="0.28" />
            <stop offset="0.6" stopColor="var(--fg)" stopOpacity="0.08" />
            <stop offset="1" stopColor="var(--fg)" stopOpacity="0.16" />
          </linearGradient>
        </defs>
        <path
          d="M50 6h20v62c0 26 34 52 34 92v186a10 10 0 0 1-10 10H26a10 10 0 0 1-10-10V160c0-40 34-66 34-92z"
          fill="url(#glass)"
          stroke="var(--fg)"
          strokeOpacity="0.35"
          strokeWidth="1.5"
        />
        <rect x="48" y="2" width="24" height="26" rx="3" fill="var(--accent)" />
      </svg>
      {label && (
        <div className="absolute inset-x-[16%] top-[56%] flex min-h-[26%] flex-col items-center justify-center rounded-md bg-surface px-1.5 py-2 text-center shadow-sm">
          {label}
        </div>
      )}
    </div>
  );
}
