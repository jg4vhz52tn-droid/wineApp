import type { Catalog, CostItem, EventData, Glass, Guess, Participant, Secret, WineInfo } from "./types";

// Pure helpers that turn the raw evening into what the screens show.

export const COUNTRIES: Record<string, string> = {
  DE: "Deutschland",
  AT: "Österreich",
  FR: "Frankreich",
  IT: "Italien",
  ES: "Spanien",
  PT: "Portugal",
  CH: "Schweiz",
  US: "USA",
  ZA: "Südafrika",
  AU: "Australien",
  NZ: "Neuseeland",
};
export const countryName = (code: string | null) => (code ? (COUNTRIES[code] ?? code) : null);

export const COLOR_LABEL: Record<WineInfo["color"], string> = {
  white: "Weiß",
  red: "Rot",
  rose: "Rosé",
  sparkling: "Schaumwein",
  sweet: "Süßwein",
  orange: "Orange",
};

export function wineTitle(wine: WineInfo | null | undefined) {
  if (!wine) return "Noch kein Wein zugeordnet";
  return wine.name ? `${wine.name}` : wine.producer;
}

/** "Rudolf Fürst · Centgrafenberg · Franken · 2019" */
export function wineDetails(wine: WineInfo | null | undefined, catalog: Catalog | null) {
  if (!wine) return "";
  const site = catalog?.sites.find((s) => s.id === wine.siteId);
  const region = catalog?.regions.find((r) => r.id === (wine.regionId ?? site?.regionId));
  return [
    wine.name ? wine.producer : null,
    site ? `Lage ${site.name}` : null,
    region?.name,
    wine.vintage ? String(wine.vintage) : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

export const grapeName = (catalog: Catalog | null, id: string | null) =>
  (id && catalog?.grapes.find((g) => g.id === id)?.name) || null;
export const regionName = (catalog: Catalog | null, id: string | null) =>
  (id && catalog?.regions.find((r) => r.id === id)?.name) || null;
export const siteName = (catalog: Catalog | null, id: string | null) =>
  (id && catalog?.sites.find((s) => s.id === id)?.name) || null;

export const secretFor = (data: EventData, glassId: string) =>
  data.secrets.find((s) => s.glassId === glassId);

/** The glass everyone is looking at: the open one, else the one waiting for its reveal, else the last revealed. */
export function currentGlass(glasses: Glass[]): Glass | null {
  return (
    glasses.find((g) => g.status === "open") ??
    glasses.find((g) => g.status === "closed") ??
    [...glasses]
      .filter((g) => g.status === "revealed")
      .sort((a, b) => (b.revealedAt ?? "").localeCompare(a.revealedAt ?? ""))[0] ??
    null
  );
}

export const nextPendingGlass = (glasses: Glass[]) => glasses.find((g) => g.status === "pending") ?? null;

/** Everyone who plays: guests that said yes or handed in something. The organizer knows the answers. */
export function players(data: EventData): Participant[] {
  const active = new Set([
    ...data.guesses.map((g) => g.participantId),
    ...data.scores.map((s) => s.participantId),
  ]);
  return data.participants.filter((p) => p.role === "guest" && (p.rsvp === "yes" || active.has(p.id)));
}

export type BoardRow = { participant: Participant; total: number; delta: number; rank: number };

/** Leaderboard over all revealed glasses; delta = points from the given glass. */
export function leaderboard(data: EventData, glassId?: string | null): BoardRow[] {
  const rows = players(data).map((participant) => {
    const own = data.scores.filter((s) => s.participantId === participant.id);
    return {
      participant,
      total: own.reduce((sum, s) => sum + s.points, 0),
      delta: glassId ? (own.find((s) => s.glassId === glassId)?.points ?? 0) : 0,
      rank: 0,
    };
  });
  rows.sort((a, b) => b.total - a.total || a.participant.name.localeCompare(b.participant.name, "de"));
  rows.forEach((row, i) => {
    row.rank = i > 0 && rows[i - 1].total === row.total ? rows[i - 1].rank : i + 1;
  });
  return rows;
}

// --- order suggestion ---------------------------------------------------------

const COLOR_ORDER: Record<WineInfo["color"], number> = {
  sparkling: 0,
  white: 1,
  orange: 2,
  rose: 2,
  red: 3,
  sweet: 4,
};
const CLASS_ORDER: [RegExp, number][] = [
  [/gutswein|qualitätswein/i, 0],
  [/ortswein|kabinett/i, 1],
  [/erste lage|spätlese|1\. lage/i, 2],
  [/\bgg\b|großes gewächs|große lage/i, 3],
  [/auslese|beerenauslese|eiswein/i, 4],
];
const classRank = (classification: string | null) =>
  CLASS_ORDER.find(([pattern]) => pattern.test(classification ?? ""))?.[1] ?? 1.5;

export type OrderSuggestion = { order: string[]; reason: string; changed: boolean };

/**
 * A rule of thumb instead of an AI call: sparkling → white → rosé → red →
 * sweet, within that from simple to grand and young to old. A pirate never
 * opens or closes the evening.
 */
export function suggestOrder(glasses: Glass[], secrets: Secret[]): OrderSuggestion {
  const wineOf = (g: Glass) => secrets.find((s) => s.glassId === g.id)?.wine ?? null;
  const key = (g: Glass) => {
    const wine = wineOf(g);
    if (!wine) return [9, 9, 0];
    return [COLOR_ORDER[wine.color] ?? 1, classRank(wine.classification), -(wine.vintage ?? 0)];
  };
  const sorted = [...glasses].sort((a, b) => {
    const ka = key(a);
    const kb = key(b);
    return ka[0] - kb[0] || ka[1] - kb[1] || ka[2] - kb[2] || a.number - b.number;
  });

  const pirateIndex = sorted.findIndex((g) => secrets.find((s) => s.glassId === g.id)?.isPirate);
  let pirateMoved = false;
  if (pirateIndex !== -1 && sorted.length >= 3 && (pirateIndex === 0 || pirateIndex === sorted.length - 1)) {
    const [pirate] = sorted.splice(pirateIndex, 1);
    sorted.splice(Math.floor(sorted.length / 2), 0, pirate);
    pirateMoved = true;
  }

  const wines = glasses.map(wineOf).filter((w): w is WineInfo => w !== null);
  const colors = new Set(wines.map((w) => w.color));
  const classes = new Set(wines.map((w) => classRank(w.classification)));
  const vintages = new Set(wines.map((w) => w.vintage));
  const parts: string[] = [];
  if (colors.size > 1) {
    const names = [...colors].sort((a, b) => COLOR_ORDER[a] - COLOR_ORDER[b]).map((c) => COLOR_LABEL[c]);
    parts.push(`erst ${names.join(", dann ")}`);
  }
  if (classes.size > 1) parts.push("vom Gutswein hoch zu den großen Lagen");
  if (vintages.size > 1) parts.push("jung vor alt");
  let reason = parts.length
    ? `Von leicht nach kräftig: ${parts.join(", ")} – so überdeckt kein Wein den nächsten.`
    : "Die Weine sind sich sehr ähnlich – die Reihenfolge kann bleiben, wie sie ist.";
  if (pirateMoved) reason += " Den Piraten habe ich unauffällig in die Mitte gesetzt.";

  const order = sorted.map((g) => g.id);
  const changed = order.some((id, i) => id !== glasses[i]?.id);
  return { order, reason, changed };
}

// --- recap ---------------------------------------------------------------------

const average = (values: number[]) =>
  values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;

export type WineRanking = {
  glass: Glass;
  secret: Secret | undefined;
  avg: number;
  count: number;
  favorites: number;
};

export function wineRanking(data: EventData): WineRanking[] {
  const revealed = data.glasses.filter((g) => g.status === "revealed");
  const rated = (g: Glass) => data.guesses.filter((x) => x.glassId === g.id && x.rating !== null);
  // How many guests rated this glass highest of all their glasses.
  const favoriteOf = new Map<string, number>();
  for (const p of players(data)) {
    const own = data.guesses.filter((x) => x.participantId === p.id && x.rating !== null);
    const best = own.sort((a, b) => b.rating! - a.rating!)[0];
    if (best) favoriteOf.set(best.glassId, (favoriteOf.get(best.glassId) ?? 0) + 1);
  }
  return revealed
    .map((glass) => {
      const ratings = rated(glass).map((x) => x.rating!);
      return {
        glass,
        secret: secretFor(data, glass.id),
        avg: average(ratings) ?? 0,
        count: ratings.length,
        favorites: favoriteOf.get(glass.id) ?? 0,
      };
    })
    .filter((r) => r.count > 0)
    .sort((a, b) => b.avg - a.avg);
}

/** Short, true sentences about the evening ("Alle haben Glas 3 für teurer gehalten"). */
export function observations(data: EventData, catalog: Catalog | null): { text: string; detail: string }[] {
  const out: { text: string; detail: string }[] = [];
  const revealed = data.glasses.filter((g) => g.status === "revealed");
  const guessesFor = (g: Glass) => data.guesses.filter((x) => x.glassId === g.id);
  const euro = (n: number) => `${Math.round(n)} €`;

  // Biggest price misjudgement.
  let price: { glass: Glass; avg: number; real: number; ratio: number } | null = null;
  for (const glass of revealed) {
    const real = secretFor(data, glass.id)?.price;
    const avg = average(guessesFor(glass).flatMap((x) => (x.price !== null ? [x.price] : [])));
    if (!real || avg === null || guessesFor(glass).filter((x) => x.price !== null).length < 2) continue;
    const ratio = avg / real;
    if (!price || Math.abs(Math.log(ratio)) > Math.abs(Math.log(price.ratio)))
      price = { glass, avg, real, ratio };
  }
  if (price && (price.ratio > 1.25 || price.ratio < 0.8)) {
    out.push({
      text:
        price.ratio > 1
          ? `Alle haben Glas ${price.glass.number} für deutlich teurer gehalten.`
          : `Glas ${price.glass.number} wurde klar unterschätzt.`,
      detail: `Geschätzt im Schnitt ${euro(price.avg)}, tatsächlich ${euro(price.real)}.`,
    });
  }

  // The pirate.
  if (data.event.pirateMode) {
    const pirateGlass = revealed.find((g) => secretFor(data, g.id)?.isPirate);
    if (pirateGlass) {
      const finders = guessesFor(pirateGlass)
        .filter((x) => x.markedPirate)
        .map((x) => data.participants.find((p) => p.id === x.participantId)?.name)
        .filter(Boolean);
      out.push({
        text: finders.length
          ? `Der Pirat in Glas ${pirateGlass.number} flog auf.`
          : `Der Pirat in Glas ${pirateGlass.number} kam unerkannt durch.`,
        detail: finders.length ? `Entlarvt von ${finders.join(", ")}.` : "Niemand hat ihn markiert.",
      });
    }
  }

  // Least agreement on the rating.
  let split: { glass: Glass; min: number; max: number } | null = null;
  for (const glass of revealed) {
    const ratings = guessesFor(glass).flatMap((x) => (x.rating !== null ? [x.rating] : []));
    if (ratings.length < 3) continue;
    const min = Math.min(...ratings);
    const max = Math.max(...ratings);
    if (!split || max - min > split.max - split.min) split = { glass, min, max };
  }
  if (split && split.max - split.min >= 6) {
    const fmt = (n: number) => n.toLocaleString("de-DE");
    out.push({
      text: `Bei Glas ${split.glass.number} war sich die Runde am wenigsten einig.`,
      detail: `Bewertungen von ${fmt(split.min)} bis ${fmt(split.max)} Punkten.`,
    });
  }

  // A grape everybody recognised.
  for (const glass of revealed) {
    const grape = secretFor(data, glass.id)?.wine?.grapeId;
    const all = guessesFor(glass);
    if (grape && all.length >= 2 && all.every((x) => x.grapeId === grape)) {
      out.push({
        text: `Glas ${glass.number} haben alle sofort erkannt.`,
        detail: `${grapeName(catalog, grape)} – volle Punktzahl bei der Rebsorte für alle.`,
      });
      break;
    }
  }
  return out;
}

export function grapeHits(data: EventData, participantId: string) {
  return data.scores.filter((s) => s.participantId === participantId && (s.breakdown.grape ?? 0) > 0).length;
}

export function foundPirate(data: EventData, participantId: string) {
  return data.scores.some((s) => s.participantId === participantId && (s.breakdown.pirate ?? 0) > 0);
}

// --- cost split ------------------------------------------------------------------

export type CostSplit = {
  total: number;
  share: number;
  people: { participant: Participant; paid: number; balance: number }[];
  transfers: { from: Participant; to: Participant; amount: number }[];
};

/** Everyone who said yes shares equally; transfers settle it with as few payments as possible. */
export function splitCosts(costs: CostItem[], participants: Participant[]): CostSplit {
  const people = participants.filter((p) => p.rsvp === "yes");
  const total = costs.reduce((sum, c) => sum + c.amount, 0);
  const share = people.length ? total / people.length : 0;
  const rows = people.map((participant) => {
    const paid = costs.filter((c) => c.paidBy === participant.id).reduce((sum, c) => sum + c.amount, 0);
    return { participant, paid, balance: paid - share };
  });

  const debtors = rows.filter((r) => r.balance < -0.005).map((r) => ({ ...r, left: -r.balance }));
  const creditors = rows.filter((r) => r.balance > 0.005).map((r) => ({ ...r, left: r.balance }));
  debtors.sort((a, b) => b.left - a.left);
  creditors.sort((a, b) => b.left - a.left);
  const transfers: CostSplit["transfers"] = [];
  for (const debtor of debtors) {
    for (const creditor of creditors) {
      if (debtor.left < 0.005) break;
      if (creditor.left < 0.005) continue;
      const amount = Math.min(debtor.left, creditor.left);
      transfers.push({
        from: debtor.participant,
        to: creditor.participant,
        amount: Math.round(amount * 100) / 100,
      });
      debtor.left -= amount;
      creditor.left -= amount;
    }
  }
  return { total, share, people: rows, transfers };
}

export function ownGuess(
  data: EventData,
  glassId: string,
  participantId: string | undefined,
): Guess | undefined {
  return participantId
    ? data.guesses.find((g) => g.glassId === glassId && g.participantId === participantId)
    : undefined;
}
