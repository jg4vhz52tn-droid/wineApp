// Aroma wheel: twelve families with four aromas each. Shared by the Rate-Bogen
// and (later) the learning module. Colours are light enough for dark text and
// sit well on both themes.

export type AromaFamily = { id: string; name: string; color: string; aromas: string[] };

export const AROMA_FAMILIES: AromaFamily[] = [
  {
    id: "citrus",
    name: "Zitrus",
    color: "#e6d27a",
    aromas: ["Zitrone", "Limette", "Grapefruit", "Orangenzeste"],
  },
  {
    id: "pome",
    name: "Kernobst",
    color: "#bfd38a",
    aromas: ["Grüner Apfel", "Gelber Apfel", "Birne", "Quitte"],
  },
  {
    id: "stone",
    name: "Steinobst",
    color: "#efb98a",
    aromas: ["Pfirsich", "Aprikose", "Mirabelle", "Nektarine"],
  },
  { id: "tropical", name: "Tropisch", color: "#f0cd72", aromas: ["Ananas", "Mango", "Maracuja", "Litschi"] },
  {
    id: "red",
    name: "Rote Frucht",
    color: "#e7959b",
    aromas: ["Erdbeere", "Himbeere", "Kirsche", "Johannisbeere"],
  },
  {
    id: "dark",
    name: "Dunkle Frucht",
    color: "#c39cc4",
    aromas: ["Brombeere", "Cassis", "Pflaume", "Heidelbeere"],
  },
  { id: "floral", name: "Blüten", color: "#e9b5cd", aromas: ["Holunder", "Akazie", "Rose", "Veilchen"] },
  { id: "herbal", name: "Kräuter", color: "#9fcaa8", aromas: ["Gras", "Minze", "Heu", "Paprika"] },
  { id: "spice", name: "Würze", color: "#dca67e", aromas: ["Weißer Pfeffer", "Ingwer", "Zimt", "Nelke"] },
  {
    id: "mineral",
    name: "Mineral",
    color: "#b5c0c8",
    aromas: ["Schiefer", "Feuerstein", "Salz", "Nasser Stein"],
  },
  { id: "oak", name: "Holz & Röst", color: "#cdae8e", aromas: ["Vanille", "Toast", "Rauch", "Kaffee"] },
  { id: "aged", name: "Reife", color: "#dfbd7c", aromas: ["Honig", "Petrol", "Nuss", "Leder"] },
];

export const AROMA_COLOR = new Map(
  AROMA_FAMILIES.flatMap((family) => family.aromas.map((aroma) => [aroma, family.color] as const)),
);
