export type BottleShape = "flute" | "burgundy" | "bordeaux" | "bocksbeutel";

/** Which bottle a wine is usually sold in - good enough for the reveal. */
export function bottleShapeFor({
  grape,
  region,
}: {
  grape?: string | null;
  region?: string | null;
}): BottleShape {
  const g = (grape ?? "").toLowerCase();
  if (region === "Franken" && /silvaner|müller|bacchus|riesling/.test(g)) return "bocksbeutel";
  if (/riesling|gewürztraminer|müller|muskateller|scheurebe/.test(g)) return "flute";
  if (/burgunder|pinot|chardonnay|silvaner/.test(g)) return "burgundy";
  return "bordeaux";
}
