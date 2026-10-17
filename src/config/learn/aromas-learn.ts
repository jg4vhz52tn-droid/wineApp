// "Was sind Aromen?" - primary, secondary, tertiary, and how they shift as a
// (Riesling-style) white wine ages. Weights are illustrative.

export type AromaLayer = "primary" | "secondary" | "tertiary";

export const LAYERS: { id: AromaLayer; title: string; from: string; text: string; color: string }[] = [
  {
    id: "primary",
    title: "Primär",
    from: "aus der Traube",
    text: "Frucht, Blüten, Kräuter – sie hängen an Rebsorte, Reife und Boden. Viele davon setzt erst die Gärung frei.",
    color: "#efb98a",
  },
  {
    id: "secondary",
    title: "Sekundär",
    from: "aus dem Keller",
    text: "Brioche und Brot vom Hefelager, Butter vom biologischen Säureabbau, Vanille, Toast und Rauch aus dem Holzfass.",
    color: "#cdae8e",
  },
  {
    id: "tertiary",
    title: "Tertiär",
    from: "aus der Zeit",
    text: "Mit den Jahren in Fass und Flasche: getrocknete Früchte, Honig, Nüsse – beim Riesling die berühmte Petrolnote.",
    color: "#dfbd7c",
  },
];

type Weighted = { name: string; layer: AromaLayer; weight: (years: number) => number };

const clamp = (n: number) => Math.min(1, Math.max(0, n));
const fresh = (years: number) => clamp(1 - years / 14) * 0.85 + 0.15;
const cellar = (years: number) => clamp(0.65 - years * 0.02);
const aged = (start: number) => (years: number) => clamp((years - start) / 9);

export const AGING_AROMAS: Weighted[] = [
  { name: "Pfirsich", layer: "primary", weight: fresh },
  { name: "Zitrus", layer: "primary", weight: (y) => fresh(y * 1.3) },
  { name: "Grüner Apfel", layer: "primary", weight: (y) => fresh(y * 1.5) },
  { name: "Holunder", layer: "primary", weight: (y) => fresh(y * 1.2) },
  { name: "Brioche", layer: "secondary", weight: cellar },
  { name: "Butter", layer: "secondary", weight: (y) => cellar(y) * 0.8 },
  { name: "Toast", layer: "secondary", weight: (y) => cellar(y) * 0.7 },
  { name: "Getrocknete Aprikose", layer: "tertiary", weight: aged(3) },
  { name: "Honig", layer: "tertiary", weight: aged(4) },
  { name: "Petrol", layer: "tertiary", weight: aged(5) },
  { name: "Nuss", layer: "tertiary", weight: aged(7) },
  { name: "Waldboden", layer: "tertiary", weight: aged(10) },
];

export function describeAge(years: number) {
  if (years < 2) return "jung & frisch";
  if (years < 6) return "auf dem Weg";
  if (years < 12) return "gereift";
  return "große Reife";
}

export const AROMA_QUIZ = {
  question: "Woher kommt die Petrolnote eines gereiften Rieslings?",
  options: ["Aus dem Holzfass", "Aus der Flaschenreife", "Von der Hefe"],
  answer: 1,
  explanation:
    "Genau – sie entsteht über die Jahre in der Flasche und gehört zu den Tertiäraromen. Viele lieben sie, manche nicht: eine Stilfrage, kein Fehler.",
};
