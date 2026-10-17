// Cuvée-Baukasten: typical red blending partners and classic recipes.
// Values 0-10 are a rough, typical-style comparison - please proof-read.

export type BlendTrait = "fruit" | "spice" | "tannin" | "acidity" | "body" | "color";

export const BLEND_TRAITS: { key: BlendTrait; label: string }[] = [
  { key: "fruit", label: "Frucht" },
  { key: "spice", label: "Würze" },
  { key: "tannin", label: "Tannin" },
  { key: "acidity", label: "Säure" },
  { key: "body", label: "Körper" },
  { key: "color", label: "Farbe" },
];

export type BlendGrape = { id: string; name: string; role: string; traits: Record<BlendTrait, number> };

export const BLEND_GRAPES: BlendGrape[] = [
  {
    id: "cabernet-sauvignon",
    name: "Cabernet Sauvignon",
    role: "Gerüst: Tannin, Farbe, Cassis",
    traits: { fruit: 6, spice: 5, tannin: 9, acidity: 7, body: 8, color: 9 },
  },
  {
    id: "merlot",
    name: "Merlot",
    role: "Fülle: weiche Pflaumenfrucht",
    traits: { fruit: 8, spice: 3, tannin: 5, acidity: 5, body: 7, color: 7 },
  },
  {
    id: "cabernet-franc",
    name: "Cabernet Franc",
    role: "Duft: Kräuter, rote Frucht, Frische",
    traits: { fruit: 6, spice: 6, tannin: 6, acidity: 7, body: 5, color: 6 },
  },
  {
    id: "syrah",
    name: "Syrah",
    role: "Würze: Pfeffer, dunkle Frucht",
    traits: { fruit: 7, spice: 9, tannin: 7, acidity: 6, body: 8, color: 9 },
  },
  {
    id: "grenache",
    name: "Grenache",
    role: "Wärme: Erdbeere, Himbeere, Alkohol",
    traits: { fruit: 9, spice: 5, tannin: 4, acidity: 4, body: 7, color: 4 },
  },
  {
    id: "mourvedre",
    name: "Mourvèdre",
    role: "Tiefe: dunkel, herb, kräftig",
    traits: { fruit: 5, spice: 7, tannin: 8, acidity: 5, body: 8, color: 8 },
  },
];

export const BLEND_PRESETS: { name: string; region: string; parts: Record<string, number> }[] = [
  {
    name: "Linkes Ufer",
    region: "Bordeaux · Médoc",
    parts: { "cabernet-sauvignon": 70, merlot: 25, "cabernet-franc": 5 },
  },
  {
    name: "Rechtes Ufer",
    region: "Bordeaux · Saint-Émilion",
    parts: { merlot: 70, "cabernet-franc": 25, "cabernet-sauvignon": 5 },
  },
  {
    name: "GSM",
    region: "Südliche Rhône",
    parts: { grenache: 60, syrah: 25, mourvedre: 15 },
  },
];

/** A short tasting line from the strongest and weakest traits of a blend. */
export function describeBlend(profile: Record<BlendTrait, number>) {
  const words: string[] = [];
  if (profile.body >= 7.5) words.push("kräftig");
  else if (profile.body <= 5.5) words.push("leichtfüßig");
  if (profile.tannin >= 7.5) words.push("mit festem Tannin");
  else if (profile.tannin <= 5) words.push("samtig weich");
  if (profile.fruit >= 7.5) words.push("fruchtbetont");
  if (profile.spice >= 7) words.push("pfeffrig-würzig");
  if (profile.acidity >= 6.8) words.push("frisch");
  if (profile.color >= 8) words.push("tief dunkel");
  return words.length ? words.join(", ") : "ausgewogen, nichts sticht heraus";
}

export const CUVEE_QUIZ = {
  question: "Welche Rebsorte bringt in einer Bordeaux-Cuvée meist Gerüst und Tannin?",
  options: ["Merlot", "Cabernet Sauvignon", "Grenache"],
  answer: 1,
  explanation:
    "Richtig – Cabernet Sauvignon liefert Tannin, Farbe und Cassis. Merlot macht die Mischung weicher und fruchtiger.",
};
