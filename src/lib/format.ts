const dateTime = new Intl.DateTimeFormat("de-DE", {
  weekday: "long",
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
});

const shortDate = new Intl.DateTimeFormat("de-DE", { day: "numeric", month: "short" });

export function formatEventDate(value: string | null) {
  return value ? `${dateTime.format(new Date(value))} Uhr` : "Termin folgt";
}

export function formatShortDate(value: string | null) {
  return value ? shortDate.format(new Date(value)) : "offen";
}
