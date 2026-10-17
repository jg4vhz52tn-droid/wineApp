export type WineColor = "white" | "red" | "rose" | "sparkling" | "sweet" | "orange";

export type CellarWine = {
  id: string;
  producer: string;
  name: string;
  vintage: number | null;
  color: WineColor;
  grape: string | null;
  region: string | null;
  classification: string | null;
  quantity: number;
  purchasePrice: number | null;
  purchasedOn: string; // yyyy-mm-dd
  drinkFrom: number | null;
  drinkUntil: number | null;
  rackId: string | null;
  compartment: string | null;
  row: string | null;
};

/** A named storage place ("Keller · Regal links", "Weinkühlschrank") with a grid. */
export type Rack = { id: string; name: string; compartments: number; rows: number };

export type CellarEvent = {
  id: string;
  itemId: string;
  kind: "purchase" | "consume" | "adjust";
  quantity: number;
  unitPrice: number | null;
  date: string;
};

export type Valuation = {
  id: string;
  itemId: string;
  value: number;
  source: "manual" | "estimate" | "ai" | "market";
  date: string;
};

export type CellarData = {
  items: CellarWine[];
  events: CellarEvent[];
  valuations: Valuation[];
  racks: Rack[];
  /** When the data was loaded - "today" for charts. */
  asOf: number;
};

export type NewBottles = {
  producer: string;
  name: string;
  color: WineColor;
  vintage: number | null;
  quantity: number;
  purchasePrice: number | null;
  purchasedOn: string;
  drinkFrom: number | null;
  drinkUntil: number | null;
  rackId: string | null;
  compartment: string | null;
  row: string | null;
  classification: string | null;
  grape: string | null;
};
