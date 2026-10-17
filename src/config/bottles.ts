export type BottleShape = "flute" | "burgundy";

/**
 * Two classic shapes only: the slim "Schlegelflasche" for whites and rosé,
 * the burgundy bottle for reds. Guests see the colour in their glass anyway,
 * so the shape gives nothing away that they don't already know.
 */
export function bottleShapeFor(
  color: "white" | "red" | "rose" | "sparkling" | "sweet" | "orange",
): BottleShape {
  return color === "red" ? "burgundy" : "flute";
}
