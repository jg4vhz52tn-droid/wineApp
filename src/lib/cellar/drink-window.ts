import type { WineColor } from "./types";

// Rough drinking-window rules of thumb (years after the vintage). They are a
// starting point the user can change - later an AI estimate can refine them.

type Input = {
  color: WineColor;
  grape: string | null;
  classification: string | null;
  vintage: number | null;
};
export type WindowSuggestion = { from: number; until: number; reason: string };

const has = (text: string | null, pattern: RegExp) => pattern.test(text ?? "");
const TOP = /\b(GG|G\.C\.|Großes Gewächs|Große Lage)\b/i;
const FIRST = /\b(Erste Lage|Ortswein)\b/i;
const SWEET = /\b(Auslese|Beerenauslese|Trockenbeerenauslese|Eiswein)\b/i;
const PRADIKAT = /\b(Kabinett|Spätlese)\b/i;

function rule({ color, grape, classification }: Input): [number, number, string] {
  const g = (grape ?? "").toLowerCase();
  if (color === "sparkling") return [0, 3, "Schaumwein ist meist für die ersten Jahre gemacht"];
  if (color === "rose") return [0, 2, "Rosé lebt von Frische"];
  if (color === "sweet" || has(classification, SWEET)) return [5, 30, "Edelsüßes reift über Jahrzehnte"];

  if (g.includes("riesling")) {
    if (has(classification, TOP)) return [4, 20, "Ein Riesling GG braucht Zeit und reift lange"];
    if (has(classification, PRADIKAT)) return [2, 15, "Kabinett und Spätlese halten dank Säure lange"];
    if (has(classification, FIRST)) return [2, 8, "Lagen- und Ortsweine öffnen sich nach ein paar Jahren"];
    return [1, 5, "Ein Gutsriesling schmeckt jung am besten"];
  }
  if (g.includes("spätburgunder") || g.includes("pinot noir")) {
    if (has(classification, TOP)) return [5, 20, "Großer Spätburgunder will Geduld"];
    if (has(classification, FIRST)) return [3, 12, "Gute Spätburgunder legen mit den Jahren zu"];
    return [2, 7, "Spätburgunder einfacher Stufe: nach ein, zwei Jahren"];
  }
  if (g.includes("lemberger") || g.includes("blaufränkisch")) {
    return has(classification, TOP)
      ? [4, 15, "Kräftiger Lemberger mit Tannin und Säure"]
      : [2, 8, "Lemberger braucht etwas Zeit"];
  }
  if (/silvaner|weißburgunder|grauburgunder|chardonnay/.test(g)) {
    return has(classification, TOP)
      ? [3, 12, "Burgunder und Silvaner aus Spitzenlagen reifen gut"]
      : [1, 5, "Frisch genießen, in den ersten Jahren"];
  }
  if (/müller|sauvignon|bacchus|scheurebe/.test(g)) return [1, 3, "Aromatisch und frisch – jung trinken"];
  if (color === "red")
    return has(classification, TOP)
      ? [4, 15, "Kräftiger Rotwein aus Spitzenlage"]
      : [2, 8, "Rotwein: meist nach ein, zwei Jahren"];
  return has(classification, TOP)
    ? [3, 12, "Spitzenwein, reift einige Jahre"]
    : [1, 4, "Weißwein: in den ersten Jahren"];
}

export function suggestDrinkWindow(input: Input): WindowSuggestion {
  const year = new Date().getFullYear();
  const base = input.vintage ?? year;
  const [a, b, reason] = rule(input);
  return { from: Math.max(base + a, base), until: base + b, reason };
}
