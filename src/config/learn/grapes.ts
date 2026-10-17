// Rebsorten-Steckbriefe. Values 0-10 are a rough comparison between the
// grapes (typical style), not lab values - please proof-read.

export type GrapeTrait = "acidity" | "body" | "aroma" | "tannin" | "skin" | "berry";

export const GRAPE_TRAITS: { key: GrapeTrait; label: string }[] = [
  { key: "acidity", label: "Säure" },
  { key: "body", label: "Körper" },
  { key: "aroma", label: "Aromatik" },
  { key: "tannin", label: "Tannin" },
  { key: "skin", label: "Schale" },
  { key: "berry", label: "Beere" },
];

export type GrapeProfile = {
  id: string;
  name: string;
  color: "white" | "red";
  traits: Record<GrapeTrait, number>;
  aromas: string[];
  home: string;
  note: string;
};

export const GRAPES: GrapeProfile[] = [
  {
    id: "riesling",
    name: "Riesling",
    color: "white",
    traits: { acidity: 9, body: 4, aroma: 8, tannin: 0, skin: 4, berry: 3 },
    aromas: ["Pfirsich", "Aprikose", "Zitrus", "Grüner Apfel", "Petrol (gereift)"],
    home: "Mosel, Rheingau, Pfalz, Nahe – fast ein Viertel aller deutschen Reben.",
    note: "Spät reifend und kälteresistent. Die hohe Säure trägt Weine von knochentrocken bis edelsüß über Jahrzehnte.",
  },
  {
    id: "silvaner",
    name: "Silvaner",
    color: "white",
    traits: { acidity: 5, body: 5, aroma: 3, tannin: 0, skin: 3, berry: 6 },
    aromas: ["Birne", "Heu", "Kräuter", "Melone"],
    home: "Franken und Rheinhessen.",
    note: "Leise, aber tiefgründig: zeigt den Boden mehr als die eigene Frucht – am besten auf Muschelkalk.",
  },
  {
    id: "grauburgunder",
    name: "Grauburgunder",
    color: "white",
    traits: { acidity: 4, body: 7, aroma: 5, tannin: 0, skin: 4, berry: 3 },
    aromas: ["Birne", "Mandel", "Nuss", "Honigmelone"],
    home: "Baden, Pfalz, Rheinhessen.",
    note: "Eine Pinot-Mutation mit graurosa Beeren – meist mehr Schmelz und Körper als frische Säure.",
  },
  {
    id: "weissburgunder",
    name: "Weißburgunder",
    color: "white",
    traits: { acidity: 6, body: 5, aroma: 4, tannin: 0, skin: 3, berry: 3 },
    aromas: ["Apfel", "Birne", "Mandel", "Zitrus"],
    home: "Baden, Pfalz.",
    note: "Elegant und zurückhaltend, cremig ohne schwer zu sein – ein großer Essensbegleiter.",
  },
  {
    id: "chardonnay",
    name: "Chardonnay",
    color: "white",
    traits: { acidity: 6, body: 7, aroma: 5, tannin: 0, skin: 3, berry: 3 },
    aromas: ["Apfel", "Zitrus", "Butter", "Haselnuss", "Vanille (Holz)"],
    home: "Weltweit – das Original im Burgund.",
    note: "Wandlungsfähig: vom straffen Chablis bis zum holzgereiften, buttrigen Stil. Der Keller prägt ihn stark.",
  },
  {
    id: "gruener-veltliner",
    name: "Grüner Veltliner",
    color: "white",
    traits: { acidity: 7, body: 6, aroma: 6, tannin: 0, skin: 5, berry: 5 },
    aromas: ["Weißer Pfeffer", "Grüner Apfel", "Zitrus", "Linse"],
    home: "Österreich – Wachau, Kamptal, Weinviertel.",
    note: "Erkennbar am „Pfefferl“, der würzigen Note von weißem Pfeffer.",
  },
  {
    id: "sauvignon-blanc",
    name: "Sauvignon Blanc",
    color: "white",
    traits: { acidity: 8, body: 4, aroma: 9, tannin: 0, skin: 4, berry: 3 },
    aromas: ["Stachelbeere", "Holunder", "Gras", "Passionsfrucht"],
    home: "Loire, Neuseeland, Steiermark – zunehmend auch in Deutschland.",
    note: "Aromatisch laut: grün-grasig in kühlen Lagen, tropisch in wärmeren.",
  },
  {
    id: "mueller-thurgau",
    name: "Müller-Thurgau",
    color: "white",
    traits: { acidity: 3, body: 3, aroma: 5, tannin: 0, skin: 3, berry: 6 },
    aromas: ["Muskat", "Pfirsich", "Blüten"],
    home: "Rheinhessen, Baden, Franken.",
    note: "Eine Kreuzung aus Riesling und Madeleine Royale – mild, früh reif, unkompliziert.",
  },
  {
    id: "spaetburgunder",
    name: "Spätburgunder",
    color: "red",
    traits: { acidity: 7, body: 4, aroma: 7, tannin: 3, skin: 2, berry: 3 },
    aromas: ["Kirsche", "Himbeere", "Erdbeere", "Waldboden", "Rauch"],
    home: "Baden, Ahr, Pfalz – Deutschlands wichtigste rote Sorte.",
    note: "Dünne Schale, wenig Farbe und Tannin – dafür viel Finesse. Heikel im Anbau, großartig im Glas.",
  },
  {
    id: "lemberger",
    name: "Lemberger",
    color: "red",
    traits: { acidity: 8, body: 6, aroma: 6, tannin: 6, skin: 7, berry: 5 },
    aromas: ["Brombeere", "Sauerkirsche", "Pfeffer"],
    home: "Württemberg – in Österreich als Blaufränkisch.",
    note: "Dunkle, kräftige Farbe, frische Säure und spürbares Tannin – würzig und saftig zugleich.",
  },
];

export const GRAPE_QUIZ = {
  question: "Welche Rebsorte hat dünne Schalen, wenig Tannin – und gilt deshalb als heikel im Anbau?",
  options: ["Lemberger", "Riesling", "Spätburgunder"],
  answer: 2,
  explanation:
    "Richtig: Spätburgunder (Pinot Noir) ist dünnschalig – daher die helle Farbe, das feine Tannin und die Anfälligkeit für Fäulnis.",
};
