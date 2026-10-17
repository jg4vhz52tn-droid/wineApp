// Learning modules (in suggested order) and the collectible card each one
// unlocks. Texts are our own; please have them proof-read by the tasting group.

export type ModuleId =
  | "weinbereitung"
  | "boden"
  | "rebsorten"
  | "cuvee"
  | "atlas"
  | "aromen"
  | "verkosten"
  | "essen"
  | "servieren"
  | "lagern"
  | "etikett"
  | "weinfehler";

export type Motif =
  | "vineyard"
  | "soil"
  | "grape"
  | "blend"
  | "map"
  | "aroma"
  | "glass"
  | "pairing"
  | "thermo"
  | "cellar"
  | "label"
  | "fault";

export type LearnModule = {
  id: ModuleId;
  title: string;
  teaser: string;
  minutes: number;
  /** Visual motif for tiles and the card art. */
  motif: Motif;
  card: { title: string; line: string };
};

export const LEARN_MODULES: LearnModule[] = [
  {
    id: "weinbereitung",
    title: "Vom Weinberg ins Glas",
    teaser: "Das Weinjahr – und warum Rotwein auf den Schalen gärt.",
    minutes: 4,
    motif: "vineyard",
    card: { title: "Kellerkind", line: "Weiß, warum Rotwein auf der Maische gärt." },
  },
  {
    id: "boden",
    title: "Boden-Explorer",
    teaser: "Schiefer, Kalk, Löss, Granit, Vulkan – was der Boden mit dem Geschmack macht.",
    minutes: 4,
    motif: "soil",
    card: { title: "Bodenkundler", line: "Liest Lagen wie andere Landkarten." },
  },
  {
    id: "rebsorten",
    title: "Rebsorten",
    teaser: "Zehn Steckbriefe, ein Vergleich – und ein Ratespiel.",
    minutes: 5,
    motif: "grape",
    card: { title: "Rebsorten-Kenner", line: "Erkennt Riesling am Duft der Steinfrucht." },
  },
  {
    id: "cuvee",
    title: "Cuvée-Baukasten",
    teaser: "Misch dir deinen Wein – und sieh live, was jede Rebsorte beiträgt.",
    minutes: 4,
    motif: "blend",
    card: { title: "Cuvée-Komponist", line: "Mischt Merlot und Cabernet nach Gefühl." },
  },
  {
    id: "atlas",
    title: "Weinatlas",
    teaser: "Die 13 deutschen Anbaugebiete auf einen Blick.",
    minutes: 4,
    motif: "map",
    card: { title: "Lagen-Lotse", line: "Findet die Ahr auch ohne Navi." },
  },
  {
    id: "aromen",
    title: "Was sind Aromen?",
    teaser: "Aus der Traube, aus dem Keller, aus der Zeit – Primär bis Tertiär.",
    minutes: 4,
    motif: "aroma",
    card: { title: "Aromen-Profi", line: "Riecht Jahre im Glas." },
  },
  {
    id: "verkosten",
    title: "Verkosten wie ein Profi",
    teaser: "Sehen, schwenken, riechen, schmecken – und den Abgang stoppen.",
    minutes: 4,
    motif: "glass",
    card: { title: "Feine Nase", line: "Sieht, schwenkt, riecht, schmeckt – in der Reihenfolge." },
  },
  {
    id: "essen",
    title: "Wein & Essen",
    teaser: "Säure zum Fett, Süße zur Schärfe – die Regeln hinter guten Kombinationen.",
    minutes: 4,
    motif: "pairing",
    card: { title: "Tafelmeister", line: "Säure zum Fett, Süße zur Schärfe." },
  },
  {
    id: "servieren",
    title: "Richtig servieren",
    teaser: "Temperatur, Glas, Karaffe – was wirklich einen Unterschied macht.",
    minutes: 3,
    motif: "thermo",
    card: { title: "Sommelier-Lehrling", line: "Rotwein nicht zu warm, Weißwein nicht zu kalt." },
  },
  {
    id: "lagern",
    title: "Richtig lagern",
    teaser: "Licht, Temperatur, liegend oder stehend – und der Check für deinen Keller.",
    minutes: 3,
    motif: "cellar",
    card: { title: "Kellermeister", line: "Kühl, dunkel, ruhig – und geduldig." },
  },
  {
    id: "etikett",
    title: "Etikett lesen",
    teaser: "Kabinett, Spätlese, Großes Gewächs – und ein Etikett zum Antippen.",
    minutes: 4,
    motif: "label",
    card: { title: "Etiketten-Leser", line: "Weiß, dass Spätlese nicht süß heißen muss." },
  },
  {
    id: "weinfehler",
    title: "Weinfehler erkennen",
    teaser: "Kork, Oxidation, drüber – und Fälle für den Fehler-Detektiv.",
    minutes: 3,
    motif: "fault",
    card: { title: "Fehler-Finder", line: "Schickt Korkschmecker zurück." },
  },
];

export const MODULE_BY_ID = Object.fromEntries(LEARN_MODULES.map((m) => [m.id, m])) as Record<
  ModuleId,
  LearnModule
>;
