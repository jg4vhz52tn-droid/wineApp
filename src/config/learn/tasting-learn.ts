// "Verkosten wie ein Profi" content.

export const COLOR_SCALES = {
  weiss: [
    {
      name: "Grünlich-hell",
      hex: "#e8ebb6",
      meaning: "Sehr jung, oft aus kühlem Klima oder im Stahltank ausgebaut.",
    },
    {
      name: "Zitronengelb",
      hex: "#eee29a",
      meaning: "Jung bis mittel – der typische Riesling in den ersten Jahren.",
    },
    { name: "Goldgelb", hex: "#e1bc58", meaning: "Gereift, holzgereift oder ein Süßwein mit Konzentration." },
    {
      name: "Bernstein",
      hex: "#c4893a",
      meaning: "Sehr alt, edelsüß – oder schon oxidiert. Riechen entscheidet.",
    },
  ],
  rot: [
    { name: "Purpur", hex: "#5a1238", meaning: "Ganz jung, oft mit violettem Schimmer am Rand." },
    { name: "Rubin", hex: "#8e1b33", meaning: "Jung bis mittel – die Farbe der meisten Rotweine." },
    { name: "Granat", hex: "#7a2a2a", meaning: "Gereift: Die Farbe wird wärmer und heller." },
    { name: "Ziegelrot", hex: "#9a4a2e", meaning: "Alt: Der Rand wird bräunlich-orange." },
  ],
};

export const NOSE_WORDS = [
  "fruchtig",
  "blumig",
  "würzig",
  "kräuterig",
  "mineralisch",
  "nussig",
  "holzig",
  "erdig",
];

export const TONGUE_TASTES = ["süß", "sauer", "salzig", "bitter", "umami"];

export function describeFinish(seconds: number) {
  if (seconds < 4) return "kurz";
  if (seconds < 8) return "mittel";
  if (seconds < 15) return "lang";
  return "sehr lang – ein großer Wein?";
}

export const TASTING_QUIZ = {
  question: "Die Zungenkarte (süß vorne, bitter hinten) – stimmt die?",
  options: ["Ja, genau so", "Nein, alle Grundgeschmäcker werden überall wahrgenommen", "Nur bei Rotwein"],
  answer: 1,
  explanation:
    "Richtig – die Karte ist ein Mythos. Rezeptoren für alle Grundgeschmäcker sitzen über die ganze Zunge verteilt.",
};
