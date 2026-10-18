import type { Dna } from "./dna";

/** Sample DNA for the styleguide. */
export const DEMO_DNA: Dna = {
  ready: true,
  ratings: 14,
  needed: 0,
  median: 89,
  structure: {
    sweetness: { value: 1.8, n: 11 },
    acidity: { value: 8.1, n: 12 },
    body: { value: 5.4, n: 12 },
    tannin: { value: 3.2, n: 4 },
    finish: { value: 7.6, n: 9 },
  },
  group_structure: {
    sweetness: { value: 3.1, n: 30 },
    acidity: { value: 6.7, n: 31 },
    body: { value: 6.2, n: 31 },
    tannin: { value: 4.4, n: 12 },
    finish: { value: 6.5, n: 25 },
  },
  aromas: [
    { aroma: "Feuerstein", n: 7 },
    { aroma: "Pfirsich", n: 6 },
    { aroma: "Zitrone", n: 5 },
    { aroma: "Grüner Apfel", n: 3 },
    { aroma: "Honig", n: 2 },
  ],
  grapes: [
    { name: "Riesling", avg: 92.4, n: 9 },
    { name: "Spätburgunder", avg: 89.5, n: 3 },
    { name: "Silvaner", avg: 86, n: 2 },
  ],
  regions: [
    { name: "Nahe", avg: 93.2, n: 4 },
    { name: "Mosel", avg: 91, n: 5 },
    { name: "Franken", avg: 86, n: 2 },
  ],
  colors: { white: { avg: 91.2, n: 11 }, red: { avg: 89.5, n: 3 } },
  prices: [
    { band: "unter 15 €", from: 0, avg: 84, n: 2 },
    { band: "15–25 €", from: 15, avg: 88.5, n: 4 },
    { band: "25–40 €", from: 25, avg: 92, n: 5 },
    { band: "40–70 €", from: 40, avg: 92.5, n: 3 },
  ],
  nose: {
    glasses: 16,
    grape_guesses: 15,
    grape_hits: 11,
    vintage_guesses: 14,
    vintage_close: 6,
    avg_points: 58.4,
    confusions: [
      { actual: "Grauburgunder", guessed: "Chardonnay", n: 2 },
      { actual: "Silvaner", guessed: "Riesling", n: 1 },
    ],
  },
};
