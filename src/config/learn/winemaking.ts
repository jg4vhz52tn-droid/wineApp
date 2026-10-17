// "Vom Weinberg ins Glas": the vineyard year and how white, rosé and red are made.

export const MONTHS = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];

export const VINE_YEAR: { months: number[]; phase: string; vineyard: string; cellar: string }[] = [
  {
    months: [1, 2],
    phase: "Winterruhe & Rebschnitt",
    vineyard:
      "Die Rebe ruht. Winzer schneiden sie zurück – wie viele Augen bleiben, bestimmt die spätere Menge.",
    cellar: "Junge Weine ruhen auf der Hefe. Bei Frost kann Eiswein gelesen werden.",
  },
  {
    months: [3],
    phase: "Die Rebe „weint“",
    vineyard: "Steigt der Saft, tropft er aus den Schnittstellen – das „Bluten“. Die Rebe erwacht.",
    cellar: "Erste Weißweine des Vorjahrs werden abgefüllt.",
  },
  {
    months: [4, 5],
    phase: "Austrieb",
    vineyard: "Knospen öffnen sich, erste Blätter erscheinen. Spätfrost ist jetzt die große Gefahr.",
    cellar: "Abfüllung läuft, Rotweine reifen weiter im Fass.",
  },
  {
    months: [6],
    phase: "Blüte",
    vineyard:
      "Die unscheinbaren Blüten bestäuben sich selbst. Gutes Wetter jetzt heißt: viele Beeren später.",
    cellar: "Ruhige Zeit im Keller.",
  },
  {
    months: [7],
    phase: "Beeren wachsen",
    vineyard: "Grüne, harte Beeren voller Säure. Laubarbeit sorgt für Luft und Licht an den Trauben.",
    cellar: "Fässer werden vorbereitet.",
  },
  {
    months: [8],
    phase: "Farbumschlag",
    vineyard: "Die Beeren werden weich und färben sich – Zucker steigt, Säure sinkt. Die Reife beginnt.",
    cellar: "Presse und Tanks werden startklar gemacht.",
  },
  {
    months: [9, 10],
    phase: "Lese",
    vineyard: "Der Höhepunkt des Jahres: Je nach Reife und Wetter wird gelesen – in Steillagen von Hand.",
    cellar: "Pressen, Maischen, Gären – die Keller duften nach Most.",
  },
  {
    months: [11, 12],
    phase: "Ernte ist eingefahren",
    vineyard: "Die Blätter fallen, die Rebe zieht sich zurück. Für Eiswein bleiben einzelne Trauben hängen.",
    cellar: "Die Gärung klingt aus, der Jungwein klärt sich.",
  },
];

export function phaseFor(month: number) {
  return VINE_YEAR.find((p) => p.months.includes(month))!;
}

export type WineStyle = "weiss" | "rose" | "rot";

/** Colour of what's in the tank after each step - drives the glass. */
type Step = { title: string; text: string; color: string };

export const PROCESS: Record<WineStyle, Step[]> = {
  weiss: [
    { title: "Lese", text: "Gesunde, reife Trauben – möglichst kühl in den Keller.", color: "#cfd38f" },
    {
      title: "Pressen",
      text: "Die Trauben werden gleich gepresst, die Schalen kommen weg. Übrig bleibt heller Most.",
      color: "#e6e0a6",
    },
    { title: "Klären", text: "Trubstoffe setzen sich ab, der Most wird klar.", color: "#efe9b8" },
    {
      title: "Gärung",
      text: "Hefen verwandeln Zucker in Alkohol – kühl, über zwei bis sechs Wochen.",
      color: "#ece2a0",
    },
    {
      title: "Ausbau",
      text: "Im Edelstahl für Frische oder im Holzfass für Schmelz – oft einige Monate auf der Feinhefe.",
      color: "#e8d88a",
    },
    {
      title: "Abfüllung",
      text: "Filtrieren, abfüllen, verkorken – oft schon im Frühjahr nach der Lese.",
      color: "#e9d57e",
    },
  ],
  rose: [
    { title: "Lese", text: "Rote Trauben, meist etwas früher gelesen für mehr Frische.", color: "#4a1f3c" },
    {
      title: "Kurzer Schalenkontakt",
      text: "Nur wenige Stunden liegen Saft und Schalen zusammen – genug für die zarte Farbe.",
      color: "#e9a0a6",
    },
    { title: "Pressen", text: "Dann wird gepresst und der rosa Most getrennt.", color: "#efb0b2" },
    { title: "Gärung", text: "Kühl vergoren, wie beim Weißwein.", color: "#f0b7b6" },
    {
      title: "Abfüllung",
      text: "Jung und frisch abgefüllt – Rosé ist für das erste Jahr gemacht.",
      color: "#efb2ae",
    },
  ],
  rot: [
    {
      title: "Lese",
      text: "Reife, dunkle Trauben. Der Saft der meisten roten Sorten ist übrigens hell!",
      color: "#3c1730",
    },
    {
      title: "Entrappen",
      text: "Die Stiele kommen weg, die Beeren werden leicht angequetscht.",
      color: "#e3d9b0",
    },
    {
      title: "Maischegärung",
      text: "Saft und Schalen gären gemeinsam, ein bis vier Wochen. Jetzt kommen Farbe und Tannin aus den Schalen.",
      color: "#7a1430",
    },
    {
      title: "Pressen",
      text: "Erst nach der Gärung wird gepresst – der junge Wein ist tiefrot.",
      color: "#6b1129",
    },
    {
      title: "Säureabbau",
      text: "Bakterien wandeln spitze Apfelsäure in milde Milchsäure – der Wein wird runder.",
      color: "#651126",
    },
    {
      title: "Ausbau im Fass",
      text: "Monate bis Jahre im Holz: Tannine werden weicher, Aromen komplexer.",
      color: "#5c1022",
    },
    { title: "Abfüllung", text: "Abgefüllt und oft noch einmal in der Flasche gereift.", color: "#55101f" },
  ],
};

export const WINEMAKING_QUIZ = {
  question: "Warum ist Rotwein rot?",
  options: ["Rote Trauben haben roten Saft", "Er gärt zusammen mit den Schalen", "Das Holzfass färbt ihn"],
  answer: 1,
  explanation:
    "Genau – der Saft fast aller roten Sorten ist hell. Farbe und Tannin kommen bei der Maischegärung aus den Schalen.",
};
