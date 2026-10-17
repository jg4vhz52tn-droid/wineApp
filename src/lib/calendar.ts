"use client";

type CalendarEvent = {
  id: string;
  title: string;
  start: string; // ISO timestamp
  durationHours?: number;
  location?: string | null;
  description?: string | null;
  url?: string;
};

const stamp = (date: Date) =>
  date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
const escape = (text: string) =>
  text
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/[,;]/g, (m) => `\\${m}`);

export function buildIcs(event: CalendarEvent) {
  const start = new Date(event.start);
  const end = new Date(start.getTime() + (event.durationHours ?? 4) * 3_600_000);
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Wein-App//Lagenabend//DE",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${event.id}@wein-app`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${escape(event.title)}`,
    event.location ? `LOCATION:${escape(event.location)}` : "",
    event.description || event.url
      ? `DESCRIPTION:${escape([event.description, event.url].filter(Boolean).join("\n\n"))}`
      : "",
    event.url ? `URL:${event.url}` : "",
    "BEGIN:VALARM",
    "TRIGGER:-PT3H",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escape(event.title)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);
  return lines.join("\r\n");
}

/** Hands the .ics to the system - on iPhone this opens "Add to Calendar". */
export function downloadIcs(event: CalendarEvent) {
  const blob = new Blob([buildIcs(event)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "lagenabend.ics";
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export function mapsUrl(location: string) {
  return `https://maps.apple.com/?q=${encodeURIComponent(location)}`;
}
