// Fixed time zone so server-rendered and browser-rendered dates always match.
const TIME_ZONE = "Europe/Berlin";

const dateTime = new Intl.DateTimeFormat("de-DE", {
  weekday: "long",
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: TIME_ZONE,
});

const parts = new Intl.DateTimeFormat("de-DE", {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: TIME_ZONE,
});

export function formatEventDate(value: string | null) {
  return value ? `${dateTime.format(new Date(value))} Uhr` : "Termin folgt";
}

/** Pieces for the ticket: "23", "OKT", "Fr", "19:00". */
export function eventDateParts(value: string | null) {
  if (!value) return null;
  const all = parts.formatToParts(new Date(value));
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    all.find((part) => part.type === type)?.value.replace(".", "") ?? "";
  return {
    day: get("day"),
    month: get("month").toUpperCase(),
    weekday: get("weekday"),
    time: `${get("hour")}:${get("minute")}`,
  };
}
