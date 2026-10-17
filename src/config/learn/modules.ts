// Learning modules and the collectible card each one unlocks.
// Texts are our own; please have them proof-read by the tasting group.

export type ModuleId = "boden" | "rebsorten" | "aromen" | "lagern" | "etikett" | "weinfehler";

export type LearnModule = {
  id: ModuleId;
  title: string;
  teaser: string;
  minutes: number;
  /** Visual motif for tiles and the card art. */
  motif: "soil" | "grape" | "aroma" | "cellar" | "label" | "fault";
  card: { title: string; line: string };
};

export const LEARN_MODULES: LearnModule[] = [
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
    teaser: "Zehn Steckbriefe – und zwei Sorten direkt im Vergleich.",
    minutes: 4,
    motif: "grape",
    card: { title: "Rebsorten-Kenner", line: "Erkennt Riesling am Duft der Steinfrucht." },
  },
  {
    id: "aromen",
    title: "Was sind Aromen?",
    teaser: "Aus der Traube, aus dem Keller, aus der Zeit – Primär bis Tertiär.",
    minutes: 3,
    motif: "aroma",
    card: { title: "Aromen-Profi", line: "Riecht Jahre im Glas." },
  },
  {
    id: "lagern",
    title: "Richtig lagern",
    teaser: "Licht, Temperatur, liegend oder stehend – und wann trinken?",
    minutes: 2,
    motif: "cellar",
    card: { title: "Kellermeister", line: "Kühl, dunkel, ruhig – und geduldig." },
  },
  {
    id: "etikett",
    title: "Etikett lesen",
    teaser: "Kabinett, Spätlese, Großes Gewächs – was wirklich draufsteht.",
    minutes: 3,
    motif: "label",
    card: { title: "Etiketten-Leser", line: "Weiß, dass Spätlese nicht süß heißen muss." },
  },
  {
    id: "weinfehler",
    title: "Weinfehler erkennen",
    teaser: "Kork, Oxidation, drüber – und was nur so aussieht wie ein Fehler.",
    minutes: 2,
    motif: "fault",
    card: { title: "Fehler-Finder", line: "Schickt Korkschmecker zurück." },
  },
];

export const MODULE_BY_ID = Object.fromEntries(LEARN_MODULES.map((m) => [m.id, m])) as Record<
  ModuleId,
  LearnModule
>;
