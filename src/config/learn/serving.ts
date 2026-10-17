// "Richtig servieren": temperatures, glasses, decanting.

export const SERVING_RANGES: { style: string; from: number; to: number; example: string }[] = [
  { style: "Sekt & Champagner", from: 6, to: 8, example: "Winzersekt, Crémant" },
  { style: "Leichte Weißweine & Rosé", from: 8, to: 10, example: "Riesling Kabinett, Müller-Thurgau" },
  { style: "Süßweine", from: 8, to: 12, example: "Auslese, Eiswein" },
  { style: "Kräftige Weißweine", from: 10, to: 13, example: "Großes Gewächs, Chardonnay aus dem Holz" },
  { style: "Leichte Rotweine", from: 13, to: 15, example: "Trollinger, leichter Spätburgunder" },
  { style: "Kräftige Rotweine", from: 16, to: 18, example: "Lemberger, Bordeaux, Syrah" },
];

export function servingNote(temp: number) {
  if (temp < 6) return "Zu kalt für fast alles – die Aromen bleiben verschlossen.";
  if (temp > 18)
    return "Zu warm: Alkohol tritt hervor, der Wein wirkt plump. „Zimmertemperatur“ meinte früher etwa 16 °C.";
  return null;
}

export const GLASSES: { id: string; name: string; for: string; text: string }[] = [
  {
    id: "universal",
    name: "Universalglas",
    for: "Fast alles",
    text: "Tulpenform, mittelgroß – wenn du nur ein Glas kaufst, dann dieses.",
  },
  {
    id: "burgunder",
    name: "Burgunderglas",
    for: "Spätburgunder, Chardonnay",
    text: "Bauchig und weit: viel Oberfläche für feine, komplexe Aromen.",
  },
  {
    id: "bordeaux",
    name: "Bordeauxglas",
    for: "Kräftige Rotweine",
    text: "Hoch und groß: Tannin wirkt runder, der Wein bekommt Luft.",
  },
  {
    id: "sekt",
    name: "Sektglas (Tulpe)",
    for: "Sekt & Champagner",
    text: "Schmal genug für die Perlage, weit genug für das Aroma – die Flöte ist out.",
  },
];

export const DECANT_CASES: { question: string; answer: "ja" | "nein" | "vorsichtig"; why: string }[] = [
  {
    question: "Junger, kräftiger Rotwein",
    answer: "ja",
    why: "Luft macht Tannine weicher und öffnet die Aromen – eine Stunde vorher.",
  },
  {
    question: "Alter Rotwein mit Depot",
    answer: "vorsichtig",
    why: "Langsam und kurz vor dem Trinken dekantieren, um den Satz zurückzuhalten – zu viel Luft kann ihn müde machen.",
  },
  { question: "Weißwein mit Böckser", answer: "ja", why: "Der Reduktionston verfliegt mit Luft." },
  {
    question: "Leichter, junger Weißwein",
    answer: "nein",
    why: "Er lebt von Frische und Frucht – einfach einschenken.",
  },
];

export const SERVING_QUIZ = {
  question: "Bei welcher Temperatur zeigt sich ein kräftiger Rotwein am besten?",
  options: ["8 °C", "16–18 °C", "22 °C"],
  answer: 1,
  explanation:
    "Richtig – 16 bis 18 °C. Bei warmer „Zimmertemperatur“ wirkt er schnell alkoholisch und schwer.",
};
