"use client";

import { PatchCapsule, PatchCrest, PatchSticker, type PatchProps } from "./patch-designs";

/**
 * The evening patch everywhere in the app (recap, live view, Abende, collection).
 * Which of the three drafts is used is decided in one place: PATCH_DESIGN.
 */
export const PATCH_DESIGN: "crest" | "sticker" | "capsule" = "crest";

const DESIGNS = { crest: PatchCrest, sticker: PatchSticker, capsule: PatchCapsule };

export function EventPatch(props: PatchProps) {
  const Patch = DESIGNS[PATCH_DESIGN];
  return <Patch {...props} />;
}
