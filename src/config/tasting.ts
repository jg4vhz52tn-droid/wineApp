// Words for the Rate-Bogen scales (0-10) and the 100-point rating.

export type StructureKey = "sweetness" | "acidity" | "body" | "finish" | "tannin";

type Scale = { label: string; words: [number, string][] };

// Each entry: [up to and including this value, word].
export const STRUCTURE_SCALES: Record<StructureKey, Scale> = {
  sweetness: {
    label: "Süße",
    words: [
      [1, "knochentrocken"],
      [3, "trocken"],
      [5, "halbtrocken"],
      [7, "lieblich"],
      [9, "süß"],
      [10, "edelsüß"],
    ],
  },
  acidity: {
    label: "Säure",
    words: [
      [1, "flach"],
      [3, "mild"],
      [5, "frisch"],
      [7, "lebendig"],
      [9, "rassig"],
      [10, "messerscharf"],
    ],
  },
  body: {
    label: "Körper",
    words: [
      [1, "federleicht"],
      [3, "leicht"],
      [5, "mittel"],
      [7, "kräftig"],
      [9, "voll"],
      [10, "wuchtig"],
    ],
  },
  tannin: {
    label: "Tannin",
    words: [
      [1, "samtig"],
      [3, "weich"],
      [5, "griffig"],
      [7, "fest"],
      [9, "kernig"],
      [10, "rau"],
    ],
  },
  finish: {
    label: "Abgang",
    words: [
      [1, "kaum da"],
      [3, "kurz"],
      [5, "mittel"],
      [7, "lang"],
      [9, "sehr lang"],
      [10, "endlos"],
    ],
  },
};

export function describeStructure(key: StructureKey, value: number) {
  return STRUCTURE_SCALES[key].words.find(([upTo]) => value <= upTo)?.[1] ?? "";
}

export function describeRating(points: number) {
  if (points >= 95) return "außergewöhnlich";
  if (points >= 90) return "hervorragend";
  if (points >= 85) return "sehr gut";
  if (points >= 80) return "gut";
  if (points >= 70) return "ordentlich";
  return "schwach";
}
