"use client";

import { CrestBack, CrestFront, type MedalProps } from "./crest-medal";
import { FlipPatch } from "./flip-patch";
import { PatchCapsule, PatchSticker } from "./patch-designs";

/**
 * The evening patch everywhere in the app (recap, live view, Abende, collection).
 * Which of the drafts is used is decided in one place: PATCH_DESIGN.
 */
export const PATCH_DESIGN: "crest" | "sticker" | "capsule" = "crest";

const dateFmt = new Intl.DateTimeFormat("de-DE", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Europe/Berlin",
});

export function EventPatch({
  className,
  flippable = false,
  ...medal
}: MedalProps & { className?: string; flippable?: boolean }) {
  if (PATCH_DESIGN !== "crest") {
    const Draft = PATCH_DESIGN === "sticker" ? PatchSticker : PatchCapsule;
    return <Draft {...medal} winner={medal.podium[0] ?? null} className={className} />;
  }
  const label = [
    `Abend-Patch: ${medal.title}`,
    medal.startsAt ? dateFmt.format(new Date(medal.startsAt)) : null,
    medal.location,
    medal.podium.length ? `Podest: ${medal.podium.join(", ")}` : null,
  ]
    .filter(Boolean)
    .join(", ");
  if (flippable) {
    return (
      <FlipPatch
        className={className}
        label={label}
        front={<CrestFront {...medal} />}
        back={<CrestBack {...medal} />}
      />
    );
  }
  return (
    <span
      role="img"
      aria-label={label}
      className={`block aspect-[240/292] drop-shadow-[0_6px_8px_rgb(0_0_0/0.3)] ${className ?? ""}`}
    >
      <CrestFront {...medal} />
    </span>
  );
}
