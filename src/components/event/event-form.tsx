"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { TextArea, TextField } from "@/components/ui/field";
import { SwitchRow } from "@/components/ui/switch";
import type { EventInfo, EventInput } from "@/lib/events/types";
import { StepButton } from "@/components/cellar/add-bottles";
import { InvitationTicket } from "./invitation-ticket";

const THEMES = [
  {
    label: "Riesling vom Schiefer",
    title: "Riesling vom Schiefer",
    theme: "Eine Lage, sechs Gläser – vom Kabinett bis zum Großen Gewächs",
  },
  {
    label: "Spätburgunder-Abend",
    title: "Spätburgunder-Abend",
    theme: "Vom Gutswein zum Großen Gewächs",
  },
  {
    label: "Weiße Burgunder",
    title: "Weiße Burgunder",
    theme: "Weiß, Grau & Chardonnay",
  },
  {
    label: "Querbeet",
    title: "Querbeet blind",
    theme: "Jeder bringt eine Flasche mit – niemand weiß, was kommt",
  },
];

const pad = (n: number) => String(n).padStart(2, "0");
function splitDate(iso: string | null) {
  if (!iso) return { date: "", time: "19:00" };
  const d = new Date(iso);
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

/** Plan an evening: theme, date, place, seats, pirate - with the guests' ticket as live preview. */
export function EventForm({
  initial,
  organizerName,
  submitLabel,
  onSubmit,
}: {
  initial?: EventInfo;
  organizerName: string | null;
  submitLabel: string;
  onSubmit: (input: EventInput) => Promise<void>;
}) {
  const start = splitDate(initial?.startsAt ?? null);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [theme, setTheme] = useState(initial?.theme ?? "");
  const [date, setDate] = useState(start.date);
  const [time, setTime] = useState(start.time);
  const [location, setLocation] = useState(initial?.location ?? "");
  const [seats, setSeats] = useState<number | null>(initial ? initial.participantLimit : 8);
  const [text, setText] = useState(initial?.invitationText ?? "");
  const [pirate, setPirate] = useState(initial?.pirateMode ?? true);
  const [blind, setBlind] = useState(initial?.isBlind ?? true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const preset = THEMES.find((t) => t.title === title);
  const [custom, setCustom] = useState(Boolean(initial && !preset));
  const titleRef = useRef<HTMLInputElement>(null);

  const startsAt = date ? new Date(`${date}T${time || "19:00"}`).toISOString() : null;
  const valid = title.trim().length > 0;

  async function submit() {
    if (!valid) return;
    setBusy(true);
    setError(null);
    try {
      await onSubmit({
        title,
        theme,
        startsAt,
        location,
        invitationText: text,
        participantLimit: seats,
        isBlind: blind,
        pirateMode: pirate,
      });
    } catch {
      setError("Das hat nicht geklappt. Bitte noch einmal versuchen.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <p className="text-sm font-medium">Thema</p>
        <div className="flex flex-wrap gap-2">
          {THEMES.map((t) => (
            <Chip
              key={t.label}
              selected={!custom && title === t.title}
              onClick={() => {
                setCustom(false);
                setTitle(t.title);
                setTheme(t.theme);
              }}
            >
              {t.label}
            </Chip>
          ))}
          <Chip
            selected={custom}
            className={custom ? undefined : "border-dashed"}
            onClick={() => {
              if (!custom && preset) {
                setTitle("");
                setTheme("");
              }
              setCustom(true);
              requestAnimationFrame(() => titleRef.current?.focus());
            }}
          >
            ✎ Eigenes Thema
          </Chip>
        </div>
      </div>

      <TextField
        ref={titleRef}
        label={custom ? "Dein Thema" : "Titel des Abends"}
        value={title}
        maxLength={120}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={custom ? "z. B. Chenin Blanc von der Loire" : "z. B. Riesling vom Roten Hang"}
      />
      <TextField
        label="Untertitel / Lage (optional)"
        value={theme}
        maxLength={200}
        onChange={(e) => setTheme(e.target.value)}
        placeholder="z. B. Nierstein, sechs Jahrgänge"
      />
      <div className="grid grid-cols-[3fr_2fr] gap-3">
        <TextField
          className="min-w-0"
          label="Datum"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <TextField
          className="min-w-0"
          label="Uhrzeit"
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
        />
      </div>
      <TextField
        label="Ort"
        value={location}
        maxLength={200}
        onChange={(e) => setLocation(e.target.value)}
        placeholder="z. B. bei Tim, Weinbergstraße 3"
      />

      <div className="flex items-center justify-between rounded-control bg-surface-2/70 px-4 py-3">
        <span>
          <span className="block font-medium">Plätze</span>
          <span className="text-sm text-muted">{seats === null ? "ohne Begrenzung" : "inklusive dir"}</span>
        </span>
        <div className="flex items-center gap-3">
          <StepButton
            label="Weniger Plätze"
            onClick={() => setSeats((s) => (s === null ? 20 : Math.max(2, s - 1)))}
          >
            −
          </StepButton>
          <span className="w-10 text-center font-display text-3xl tabular-nums" aria-live="polite">
            {seats ?? "∞"}
          </span>
          <StepButton
            label="Mehr Plätze"
            onClick={() => setSeats((s) => (s === null || s >= 40 ? null : s + 1))}
          >
            +
          </StepButton>
        </div>
      </div>

      <SwitchRow
        label="Finde den Piraten"
        description="Ein Wein passt nicht ins Thema. Wer ihn entlarvt, bekommt Bonuspunkte."
        checked={pirate}
        onChange={setPirate}
      />
      <SwitchRow
        label="Blind verkosten"
        description="Gäste sehen die Flaschen erst beim Aufdecken."
        checked={blind}
        onChange={setBlind}
      />

      <TextArea
        label="Was uns erwartet (optional)"
        value={text}
        maxLength={4000}
        onChange={(e) => setText(e.target.value)}
        placeholder="Ein paar Sätze für die Einladung – Brot und Käse? Wer bringt was mit?"
      />

      <div className="space-y-2">
        <p className="text-sm font-medium text-muted">So sehen deine Gäste die Einladung</p>
        <InvitationTicket
          organizerName={organizerName}
          title={title.trim() || "Dein Lagenabend"}
          theme={theme.trim() || null}
          startsAt={startsAt}
          location={location.trim() || null}
          isBlind={blind}
          confirmed={1}
          limit={seats}
        />
      </div>

      <Button block size="lg" onClick={submit} loading={busy} disabled={!valid}>
        {submitLabel}
      </Button>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
