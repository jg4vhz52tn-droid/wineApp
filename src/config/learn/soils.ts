// Boden-Explorer content. Scales are 0-10 and meant as a rough comparison
// between the five soils, not as measurements.

export type SoilId = "schiefer" | "kalk" | "loess" | "granit" | "vulkan";

export type Soil = {
  id: SoilId;
  name: string;
  origin: string;
  water: number; // how much water it holds
  heat: number; // how well it stores and gives back warmth
  nutrients: number;
  /** How deep the roots go (y in the 400px tall cross-section). */
  rootDepth: number;
  /** How far roots spread sideways (px). */
  rootSpread: number;
  whatHappens: string;
  taste: string;
  sites: string[];
};

export const SOILS: Soil[] = [
  {
    id: "schiefer",
    name: "Schiefer",
    origin: "Uralte, zu Platten gepresste Meeresablagerungen – grau, blau oder rot.",
    water: 3,
    heat: 9,
    nutrients: 3,
    rootDepth: 385,
    rootSpread: 40,
    whatHappens:
      "Die dunklen Platten speichern tagsüber Sonnenwärme und geben sie nachts an die Reben ab – ideal in kühlen Steillagen. Wasser läuft schnell durch die Spalten ab, deshalb wurzeln die Reben sehr tief.",
    taste: "Filigran und rassig, oft mit rauchig-würziger „Schiefernote“ und straffer Säure.",
    sites: ["Scharzhofberg", "Wehlener Sonnenuhr", "Erdener Prälat"],
  },
  {
    id: "kalk",
    name: "Kalk & Muschelkalk",
    origin: "Aus Muscheln und Kalkschlamm urzeitlicher Meere entstanden.",
    water: 6,
    heat: 5,
    nutrients: 5,
    rootDepth: 330,
    rootSpread: 70,
    whatHappens:
      "Kalk speichert Wasser in feinen Poren und gibt es gleichmäßig ab, bleibt dabei eher kühl. Die Trauben reifen langsam und behalten ihre Frische.",
    taste: "Straff und spannungsgeladen, kräuterig bis salzig – Weine mit Rückgrat, die lange reifen.",
    sites: ["Westhofener Morstein", "Escherndorfer Lump"],
  },
  {
    id: "loess",
    name: "Löss",
    origin: "Feiner Staub, den Eiszeit-Winde angeweht haben – tief, weich, fruchtbar.",
    water: 8,
    heat: 6,
    nutrients: 8,
    rootDepth: 230,
    rootSpread: 120,
    whatHappens:
      "Löss hält viel Wasser und Nährstoffe. Die Reben müssen kaum suchen: Sie wurzeln flacher und breiter und wachsen kräftig.",
    taste: "Zugänglich und saftig, fruchtbetont mit runder, weicher Textur.",
    sites: ["Kaiserstuhl", "Rheinhessen (Hügelland)"],
  },
  {
    id: "granit",
    name: "Granit",
    origin: "Erstarrtes Magma tief aus der Erde, verwittert zu grobem Sand.",
    water: 2,
    heat: 7,
    nutrients: 2,
    rootDepth: 355,
    rootSpread: 55,
    whatHappens:
      "Der grobe Sand lässt Wasser sofort durch und erwärmt sich schnell. Wenig Nährstoffe bremsen das Wachstum – die Rebe steckt ihre Kraft in wenige, konzentrierte Trauben.",
    taste: "Präzise und klar, kühle Frucht und feine Würze.",
    sites: ["Durbacher Plauelrain", "Wachau (Urgestein)"],
  },
  {
    id: "vulkan",
    name: "Vulkan",
    origin: "Basalt, Tuff und Porphyr – Spuren alter Vulkane.",
    water: 4,
    heat: 8,
    nutrients: 6,
    rootDepth: 290,
    rootSpread: 80,
    whatHappens:
      "Das dunkle Gestein wird warm, ist mineralreich und gut durchlüftet. Die Trauben reifen voll aus, ohne die Spannung zu verlieren.",
    taste: "Kraftvoll und würzig, oft rauchig mit salzigem Nachhall.",
    sites: ["Forster Pechstein", "Kaiserstuhl", "Niederhäuser Hermannshöhle"],
  },
];

export const SOIL_QUIZ = {
  question: "Welcher Boden speichert Sonnenwärme besonders gut und gibt sie nachts an die Reben ab?",
  options: ["Löss", "Schiefer", "Kalk"],
  answer: 1,
  explanation:
    "Genau: Die dunklen Schieferplatten wirken wie eine Wärmflasche – deshalb reift Riesling selbst an der kühlen Mosel aus.",
};
