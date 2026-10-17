import type { Catalog, EventData, Guess, Score } from "./types";

// Sample evening for the styleguide: three glasses revealed, Jonas leads.

export const DEMO_CATALOG: Catalog = {
  grapes: [
    { id: "g-riesling", name: "Riesling", color: "white" },
    { id: "g-silvaner", name: "Silvaner", color: "white" },
    { id: "g-weiss", name: "Weißburgunder", color: "white" },
  ],
  regions: [
    { id: "r-mosel", name: "Mosel", countryCode: "DE" },
    { id: "r-nahe", name: "Nahe", countryCode: "DE" },
    { id: "r-franken", name: "Franken", countryCode: "DE" },
  ],
  sites: [
    { id: "s-sonnenuhr", name: "Sonnenuhr", village: "Wehlen", regionId: "r-mosel" },
    { id: "s-hermannshoehle", name: "Hermannshöhle", village: "Niederhausen", regionId: "r-nahe" },
    { id: "s-lump", name: "Lump", village: "Escherndorf", regionId: "r-franken" },
  ],
};

const people = [
  { id: "p-tim", userId: "u-tim", name: "Tim", role: "organizer" as const, rsvp: "yes" as const },
  { id: "p-jonas", userId: "u-jonas", name: "Jonas", role: "guest" as const, rsvp: "yes" as const },
  { id: "p-matti", userId: "u-matti", name: "Matti", role: "guest" as const, rsvp: "yes" as const },
  { id: "p-lea", userId: "u-lea", name: "Lea", role: "guest" as const, rsvp: "yes" as const },
  { id: "p-sophie", userId: null, name: "Sophie", role: "guest" as const, rsvp: "yes" as const },
];

const wine = (
  id: string,
  producer: string,
  name: string,
  vintage: number,
  grapeId: string,
  regionId: string,
  siteId: string,
) => ({
  vintageId: `v-${id}`,
  wineId: `w-${id}`,
  producer,
  name,
  color: "white" as const,
  vintage,
  classification: "GG",
  grapeId,
  regionId,
  siteId,
});

const guess = (glassId: string, participantId: string, g: Partial<Guess>): Guess => ({
  id: `${glassId}-${participantId}`,
  glassId,
  participantId,
  structure: {},
  aromas: [],
  grapeId: null,
  countryCode: "DE",
  regionId: null,
  siteId: null,
  vintage: null,
  price: null,
  rating: null,
  markedPirate: false,
  ...g,
});

const score = (
  glassId: string,
  participantId: string,
  points: number,
  breakdown: Score["breakdown"] = {},
): Score => ({
  glassId,
  participantId,
  points,
  breakdown,
});

export const DEMO_EVENT: EventData = {
  event: {
    id: "e-demo",
    title: "Riesling vom Schiefer",
    theme: "Eine Lage, sechs Gläser",
    startsAt: "2026-11-14T18:00:00.000Z",
    location: "bei Tim",
    invitationText: null,
    participantLimit: 8,
    status: "live",
    isBlind: true,
    pirateMode: true,
    inviteCode: "demo",
    organizerId: "u-tim",
  },
  participants: people,
  glasses: [
    { id: "gl1", number: 1, status: "revealed", openedAt: null, revealedAt: "2026-11-14T18:30:00Z" },
    { id: "gl2", number: 2, status: "revealed", openedAt: null, revealedAt: "2026-11-14T19:00:00Z" },
    { id: "gl3", number: 3, status: "revealed", openedAt: null, revealedAt: "2026-11-14T19:30:00Z" },
    { id: "gl4", number: 4, status: "pending", openedAt: null, revealedAt: null },
  ],
  secrets: [
    {
      glassId: "gl1",
      isPirate: false,
      price: 29,
      broughtBy: "p-jonas",
      referenceStructure: null,
      referenceAromas: [],
      wine: wine(
        "1",
        "Dr. Loosen",
        "Wehlener Sonnenuhr Riesling",
        2021,
        "g-riesling",
        "r-mosel",
        "s-sonnenuhr",
      ),
    },
    {
      glassId: "gl2",
      isPirate: true,
      price: 28,
      broughtBy: "p-matti",
      referenceStructure: null,
      referenceAromas: [],
      wine: wine(
        "2",
        "Horst Sauer",
        "Escherndorfer Lump Silvaner",
        2022,
        "g-silvaner",
        "r-franken",
        "s-lump",
      ),
    },
    {
      glassId: "gl3",
      isPirate: false,
      price: 48,
      broughtBy: "p-tim",
      referenceStructure: null,
      referenceAromas: [],
      wine: wine("3", "Dönnhoff", "Hermannshöhle Riesling", 2020, "g-riesling", "r-nahe", "s-hermannshoehle"),
    },
  ],
  guesses: [
    guess("gl1", "p-jonas", {
      grapeId: "g-riesling",
      regionId: "r-mosel",
      vintage: 2020,
      price: 32,
      rating: 91,
      aromas: ["Pfirsich", "Schiefer"],
    }),
    guess("gl1", "p-matti", { grapeId: "g-riesling", vintage: 2018, price: 45, rating: 88 }),
    guess("gl1", "p-lea", { grapeId: "g-weiss", price: 40, rating: 89.5 }),
    guess("gl2", "p-jonas", { grapeId: "g-silvaner", markedPirate: true, price: 35, rating: 86 }),
    guess("gl2", "p-matti", { grapeId: "g-riesling", price: 38, rating: 84 }),
    guess("gl2", "p-lea", { grapeId: "g-silvaner", markedPirate: true, price: 30, rating: 90 }),
    guess("gl3", "p-jonas", {
      grapeId: "g-riesling",
      regionId: "r-nahe",
      siteId: "s-hermannshoehle",
      vintage: 2019,
      price: 52,
      rating: 94.5,
      structure: { sweetness: 1.5, acidity: 8.2, body: 6 },
      aromas: ["Pfirsich", "Feuerstein", "Zitrone"],
    }),
    guess("gl3", "p-matti", {
      grapeId: "g-riesling",
      regionId: "r-mosel",
      vintage: 2020,
      price: 60,
      rating: 93,
    }),
    guess("gl3", "p-lea", { grapeId: "g-riesling", price: 75, rating: 96 }),
  ],
  scores: [
    score("gl1", "p-jonas", 71),
    score("gl1", "p-matti", 45),
    score("gl1", "p-lea", 10),
    score("gl2", "p-jonas", 60, { grape: 30, pirate: 20, country: 10 }),
    score("gl2", "p-matti", 10),
    score("gl2", "p-lea", 65, { grape: 30, pirate: 20, country: 10, price: 5 }),
    score("gl3", "p-jonas", 96, {
      grape: 30,
      country: 10,
      region: 10,
      site: 15,
      vintage: 8,
      price: 10,
      structure: { sweetness: 5, acidity: 3, body: 3 },
      structure_reference: "group",
      aromas: 2,
      pirate: 0,
    }),
    score("gl3", "p-matti", 53),
    score("gl3", "p-lea", 45),
  ],
  costs: [
    { id: "c1", paidBy: "p-jonas", glassId: "gl1", description: "Glas 1", amount: 29, createdBy: null },
    { id: "c2", paidBy: "p-tim", glassId: "gl3", description: "Glas 3", amount: 48, createdBy: null },
    { id: "c3", paidBy: "p-lea", glassId: null, description: "Brot & Käse", amount: 23, createdBy: null },
  ],
  progress: {},
};
