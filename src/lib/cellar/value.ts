import type { CellarData, CellarEvent, CellarWine, Valuation } from "./types";

// Everything about what a bottle is worth and when to drink it. The estimate
// is deliberately simple and always labelled as such in the UI; real market
// prices (AI search, price API) can replace it later as another source.

export type DrinkStatus = "wait" | "ready" | "urgent" | "unknown";

export const DRINK_STATUS_LABEL: Record<DrinkStatus, string> = {
  wait: "Noch warten",
  ready: "Jetzt perfekt",
  urgent: "Dringend trinken",
  unknown: "Trinkfenster offen",
};

export function drinkStatus(
  item: Pick<CellarWine, "drinkFrom" | "drinkUntil">,
  year = new Date().getFullYear(),
): DrinkStatus {
  if (!item.drinkFrom && !item.drinkUntil) return "unknown";
  if (item.drinkFrom && year < item.drinkFrom) return "wait";
  if (item.drinkUntil && year >= item.drinkUntil - 1) return "urgent";
  return "ready";
}

const PREMIUM =
  /\b(GG|G\.C\.|Großes Gewächs|Erste Lage|Auslese|Beerenauslese|Trockenbeerenauslese|Eiswein)\b/i;
const DAY = 86_400_000;
const toTime = (date: string) => new Date(`${date}T12:00:00`).getTime();

/** Rough yearly appreciation: top wines gain while they age, everything loses value past its window. */
function yearlyRate(item: CellarWine, year: number) {
  if (item.drinkUntil && year > item.drinkUntil) return -0.06;
  const premium = PREMIUM.test(item.classification ?? "") || (item.purchasePrice ?? 0) >= 40;
  if (item.drinkFrom && year < item.drinkFrom) return premium ? 0.06 : 0.02;
  return premium ? 0.03 : 0.01;
}

export function estimateValue(item: CellarWine, at: number = Date.now()) {
  const base = item.purchasePrice ?? 0;
  let value = base;
  let t = toTime(item.purchasedOn);
  while (t < at) {
    const step = Math.min(365 * DAY, at - t);
    value *= 1 + yearlyRate(item, new Date(t).getFullYear()) * (step / (365 * DAY));
    t += step;
  }
  return Math.round(value * 100) / 100;
}

/** Value of one bottle at a moment: interpolated between known values, estimated if there are none. */
export function valueAt(item: CellarWine, valuations: Valuation[], at: number = Date.now()) {
  const own = valuations.filter((v) => v.itemId === item.id).sort((a, b) => a.date.localeCompare(b.date));
  if (!own.length) return estimateValue(item, at);
  const points = [
    ...(item.purchasePrice !== null ? [{ t: toTime(item.purchasedOn), v: item.purchasePrice }] : []),
    ...own.map((v) => ({ t: toTime(v.date), v: v.value })),
  ];
  if (at <= points[0].t) return points[0].v;
  for (let i = 1; i < points.length; i++) {
    if (at <= points[i].t) {
      const a = points[i - 1];
      const b = points[i];
      return a.v + ((b.v - a.v) * (at - a.t)) / (b.t - a.t || 1);
    }
  }
  return points[points.length - 1].v;
}

export function isEstimated(item: CellarWine, valuations: Valuation[]) {
  return !valuations.some((v) => v.itemId === item.id);
}

function quantityAt(itemId: string, events: CellarEvent[], at: number) {
  return events
    .filter((e) => e.itemId === itemId && toTime(e.date) <= at)
    .reduce((sum, e) => sum + e.quantity, 0);
}

export type SeriesPoint = { t: number; value: number; cost: number };

/** Portfolio value and purchase cost over time. */
export function portfolioSeries(data: CellarData, from: number, to = Date.now(), steps = 60): SeriesPoint[] {
  const points: SeriesPoint[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = from + ((to - from) * i) / steps;
    let value = 0;
    let cost = 0;
    for (const item of data.items) {
      const qty = quantityAt(item.id, data.events, t);
      if (qty <= 0) continue;
      value += qty * valueAt(item, data.valuations, t);
      cost += qty * (item.purchasePrice ?? 0);
    }
    points.push({ t, value: Math.round(value), cost: Math.round(cost) });
  }
  return points;
}

export function firstPurchase(data: CellarData) {
  const times = data.events.filter((e) => e.kind === "purchase").map((e) => toTime(e.date));
  return times.length ? Math.min(...times) : Date.now() - 365 * DAY;
}

export function portfolioTotals(data: CellarData) {
  let value = 0;
  let cost = 0;
  let bottles = 0;
  for (const item of data.items) {
    if (item.quantity <= 0) continue;
    bottles += item.quantity;
    value += item.quantity * valueAt(item, data.valuations);
    cost += item.quantity * (item.purchasePrice ?? 0);
  }
  // Gain "realised" by drinking: value when opened vs. what it cost.
  let realised = 0;
  for (const e of data.events.filter((x) => x.kind === "consume")) {
    const item = data.items.find((i) => i.id === e.itemId);
    if (item && e.unitPrice !== null) realised += -e.quantity * (e.unitPrice - (item.purchasePrice ?? 0));
  }
  const gain = value - cost;
  return {
    value,
    cost,
    gain,
    gainPct: cost ? gain / cost : 0,
    bottles,
    realised,
    avg: bottles ? value / bottles : 0,
  };
}

export type AllocationKey = "region" | "grape" | "color";

const COLOR_LABEL: Record<string, string> = {
  white: "Weiß",
  red: "Rot",
  rose: "Rosé",
  sparkling: "Schaumwein",
  sweet: "Süßwein",
  orange: "Orange",
};

export function allocation(data: CellarData, by: AllocationKey) {
  const map = new Map<string, number>();
  for (const item of data.items) {
    if (item.quantity <= 0) continue;
    const key =
      by === "color"
        ? COLOR_LABEL[item.color]
        : by === "region"
          ? (item.region ?? "Ohne Region")
          : (item.grape ?? "Unbekannt");
    map.set(key, (map.get(key) ?? 0) + item.quantity * valueAt(item, data.valuations));
  }
  const total = [...map.values()].reduce((a, b) => a + b, 0) || 1;
  return [...map.entries()]
    .map(([label, value]) => ({ label, value, share: value / total }))
    .sort((a, b) => b.value - a.value);
}

export function itemLabelFor(by: AllocationKey, item: CellarWine) {
  return by === "color"
    ? COLOR_LABEL[item.color]
    : by === "region"
      ? (item.region ?? "Ohne Region")
      : (item.grape ?? "Unbekannt");
}

export function movers(data: CellarData) {
  return data.items
    .filter((i) => i.quantity > 0 && i.purchasePrice)
    .map((item) => {
      const now = valueAt(item, data.valuations);
      return { item, now, change: (now - item.purchasePrice!) / item.purchasePrice! };
    })
    .sort((a, b) => b.change - a.change);
}

export const euro = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});
export const euroCents = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });
export const percent = new Intl.NumberFormat("de-DE", {
  style: "percent",
  maximumFractionDigits: 1,
  signDisplay: "exceptZero",
});
