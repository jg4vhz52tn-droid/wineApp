// "Wein & Essen": dishes, the rules behind them, and a plate mixer.

export const DISHES: { dish: string; wine: string; why: string }[] = [
  {
    dish: "Spargel mit Hollandaise",
    wine: "Silvaner oder Weißburgunder, trocken",
    why: "Zarte Bitternoten und Butter mögen milde Säure und etwas Schmelz – Silvaner ist der Klassiker.",
  },
  {
    dish: "Flammkuchen",
    wine: "Trockener Riesling oder Grauburgunder",
    why: "Frische Säure schneidet durch Speck und Schmand.",
  },
  {
    dish: "Thai-Curry",
    wine: "Riesling Kabinett, feinherb bis fruchtsüß",
    why: "Etwas Süße und wenig Alkohol kühlen die Schärfe – trockene, alkoholreiche Weine würden sie verstärken.",
  },
  {
    dish: "Rinderfilet",
    wine: "Lemberger, kräftiger Spätburgunder oder Cabernet",
    why: "Tannin und Eiweiß zähmen sich gegenseitig – der Wein wirkt weicher, das Fleisch saftiger.",
  },
  {
    dish: "Ziegenkäse",
    wine: "Sauvignon Blanc",
    why: "Säure zur Säure – an der Loire wachsen beide nebeneinander.",
  },
  {
    dish: "Sushi",
    wine: "Trockener Riesling oder Grüner Veltliner",
    why: "Frische Säure, keine Tannine – Tannin und Fisch schmecken schnell metallisch.",
  },
  {
    dish: "Wild mit Preiselbeeren",
    wine: "Gereifter Spätburgunder",
    why: "Frucht trifft Frucht, Waldboden trifft Wild.",
  },
  {
    dish: "Blauschimmelkäse",
    wine: "Riesling Auslese oder edelsüß",
    why: "Salz und Süße sind ein Traumpaar.",
  },
  {
    dish: "Schokoladendessert",
    wine: "Portwein oder ein süßer Rotwein",
    why: "Der Wein muss mindestens so süß sein wie das Dessert – sonst schmeckt er sauer und dünn.",
  },
  {
    dish: "Pasta mit Tomatensauce",
    wine: "Säurebetonter Rotwein, z. B. Lemberger oder Chianti",
    why: "Tomaten haben viel Säure – der Wein braucht mindestens genauso viel.",
  },
];

export const RULES = [
  {
    title: "Gewicht zu Gewicht",
    text: "Leichte Gerichte, leichte Weine. Kräftiges Essen verträgt kräftigen Wein.",
  },
  {
    title: "Säure liebt Fett",
    text: "Frische Säure schneidet durch Butter, Sahne und Frittiertes – wie ein Spritzer Zitrone.",
  },
  {
    title: "Süße gegen Schärfe",
    text: "Restsüße und wenig Alkohol mildern Chili. Viel Alkohol und Tannin feuern sie an.",
  },
  { title: "Tannin braucht Eiweiß", text: "Steak, Lamm, Hartkäse machen gerbstoffreiche Rotweine weicher." },
  {
    title: "Was zusammen wächst …",
    text: "… passt oft zusammen: Riesling und Saumagen, Silvaner und Spargel.",
  },
];

export type PlateTrait = "fett" | "scharf" | "salzig" | "suess" | "sauer" | "kraeftig";

export const PLATE_TRAITS: { id: PlateTrait; label: string; advice: string }[] = [
  { id: "fett", label: "fettig / cremig", advice: "frische Säure" },
  { id: "scharf", label: "scharf", advice: "etwas Restsüße, wenig Alkohol, kaum Tannin" },
  { id: "salzig", label: "salzig", advice: "Frucht oder Süße als Gegenspieler" },
  { id: "suess", label: "süß (Dessert)", advice: "ein Wein, der mindestens so süß ist" },
  { id: "sauer", label: "säuerlich", advice: "mindestens genauso viel Säure im Wein" },
  { id: "kraeftig", label: "kräftig / Fleisch", advice: "Körper und Tannin" },
];

/** A concrete suggestion from the combination of plate traits. */
export function suggestWine(traits: PlateTrait[]) {
  const has = (t: PlateTrait) => traits.includes(t);
  if (!traits.length) return null;
  if (has("suess")) return "Edelsüßer Riesling, Portwein oder Eiswein";
  if (has("scharf")) return "Riesling Kabinett, feinherb – oder ein fruchtiger Rosé";
  if (has("kraeftig") && has("sauer")) return "Lemberger oder ein italienischer Rotwein mit Säure";
  if (has("kraeftig")) return "Kräftiger Spätburgunder, Lemberger oder Cabernet-Cuvée";
  if (has("salzig") && has("fett")) return "Restsüßer Riesling – oder ein Sekt";
  if (has("salzig")) return "Fruchtbetonter Riesling, Spätlese";
  if (has("fett") || has("sauer")) return "Trockener Riesling oder Sauvignon Blanc";
  return "Ein vielseitiger trockener Weißburgunder";
}

export const PAIRING_QUIZ = {
  question: "Was passt zu einem scharfen Thai-Curry?",
  options: ["Tanninreicher Rotwein mit 15 %", "Riesling Kabinett mit etwas Süße", "Holzbetonter Chardonnay"],
  answer: 1,
  explanation:
    "Genau – Restsüße und wenig Alkohol mildern die Schärfe. Alkohol und Tannin würden sie verstärken.",
};
