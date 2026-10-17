import type { StructureKey } from "@/config/tasting";
import type { WineColor } from "@/lib/cellar/types";

export type EventStatus = "draft" | "planned" | "live" | "finished";
export type RoundStatus = "pending" | "open" | "closed" | "revealed";
export type Rsvp = "pending" | "yes" | "no";

export type EventInfo = {
  id: string;
  title: string;
  theme: string | null;
  startsAt: string | null;
  location: string | null;
  invitationText: string | null;
  participantLimit: number | null;
  status: EventStatus;
  isBlind: boolean;
  pirateMode: boolean;
  inviteCode: string;
  organizerId: string;
  /** Storage path of the evening's photo (for the patch). */
  photoPath: string | null;
};

export type Participant = {
  id: string;
  userId: string | null;
  name: string;
  role: "organizer" | "guest";
  rsvp: Rsvp;
};

export type Glass = {
  id: string;
  number: number;
  status: RoundStatus;
  openedAt: string | null;
  revealedAt: string | null;
};

export type WineInfo = {
  vintageId: string;
  wineId: string;
  producer: string;
  name: string | null;
  color: WineColor;
  vintage: number | null;
  classification: string | null;
  grapeId: string | null;
  regionId: string | null;
  siteId: string | null;
};

export type Structure = Partial<Record<StructureKey, number>>;

/** The answer key of a glass: always for the organizer, for guests after the reveal. */
export type Secret = {
  glassId: string;
  isPirate: boolean;
  price: number | null;
  broughtBy: string | null;
  referenceStructure: Structure | null;
  referenceAromas: string[];
  wine: WineInfo | null;
};

export type Guess = {
  id: string;
  glassId: string;
  participantId: string;
  structure: Structure;
  aromas: string[];
  grapeId: string | null;
  countryCode: string | null;
  regionId: string | null;
  siteId: string | null;
  vintage: number | null;
  price: number | null;
  rating: number | null;
  markedPirate: boolean;
};

export type ScoreBreakdown = {
  grape?: number;
  country?: number;
  region?: number;
  site?: number;
  vintage?: number;
  price?: number;
  structure?: Partial<Record<StructureKey, number>>;
  structure_reference?: "organizer" | "group" | null;
  aromas?: number;
  pirate?: number;
};

export type Score = { glassId: string; participantId: string; points: number; breakdown: ScoreBreakdown };

export type CostItem = {
  id: string;
  paidBy: string | null;
  glassId: string | null;
  description: string;
  amount: number;
  createdBy: string | null;
};

export type EventData = {
  event: EventInfo;
  participants: Participant[];
  glasses: Glass[];
  secrets: Secret[];
  guesses: Guess[];
  scores: Score[];
  costs: CostItem[];
  /** glassId → participant ids that have handed in. */
  progress: Record<string, string[]>;
};

export type Catalog = {
  grapes: { id: string; name: string; color: "white" | "red" }[];
  regions: { id: string; name: string; countryCode: string }[];
  sites: { id: string; name: string; village: string | null; regionId: string }[];
};

export type NewWine = {
  producer: string;
  name: string;
  color: WineColor;
  vintage: number | null;
  grape: string | null;
  regionId: string | null;
  siteId: string | null;
  classification: string | null;
};

export type GlassInput = {
  number: number;
  vintageId: string | null;
  price: number | null;
  isPirate: boolean;
  broughtBy: string | null;
  referenceStructure: Structure | null;
  referenceAromas: string[];
};

export type EventInput = {
  title: string;
  theme: string | null;
  startsAt: string | null;
  location: string | null;
  invitationText: string | null;
  participantLimit: number | null;
  isBlind: boolean;
  pirateMode: boolean;
};
