"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { NotConfigured } from "@/components/app/not-configured";
import { useSession } from "@/components/app/session-provider";
import { Button } from "@/components/ui/button";
import { Card, Eyebrow } from "@/components/ui/card";
import { Pill } from "@/components/ui/chip";
import { TextField } from "@/components/ui/field";
import { CalendarIcon, PinIcon } from "@/components/ui/icons";
import { formatEventDate } from "@/lib/format";
import { getSupabase } from "@/lib/supabase";

type Preview = {
  event_id: string;
  title: string;
  theme: string | null;
  starts_at: string | null;
  location: string | null;
  invitation_text: string | null;
  organizer_name: string | null;
  is_blind: boolean;
  participant_limit: number | null;
  confirmed_count: number;
};

type Rsvp = "yes" | "no";

const NAME_KEY = "wa-guest-name";

function readStoredName() {
  try {
    return localStorage.getItem(NAME_KEY) ?? "";
  } catch {
    return "";
  }
}

export function Invitation() {
  const { code } = useParams<{ code: string }>();
  const { configured, session, ready } = useSession();
  const [preview, setPreview] = useState<Preview | null | undefined>(undefined);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState<Rsvp | null>(null);
  const [answered, setAnswered] = useState<Rsvp | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;
    supabase.rpc("event_preview", { p_invite_code: code }).then(({ data }) => {
      setPreview(data?.[0] ?? null);
      // Prefill the name this device used for an earlier invite.
      setName((current) => current || readStoredName());
    });
  }, [code]);

  // Already answered on this device? Show it instead of the form.
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase || !ready || !session || !preview) return;
    supabase
      .from("event_participants")
      .select("display_name, rsvp")
      .eq("event_id", preview.event_id)
      .eq("user_id", session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data && data.rsvp !== "pending") {
          setName(data.display_name);
          setAnswered(data.rsvp);
        }
      });
  }, [ready, session, preview]);

  async function answer(rsvp: Rsvp) {
    const supabase = getSupabase();
    if (!supabase || !name.trim()) return;
    setBusy(rsvp);
    setError(null);
    try {
      if (!session) {
        const { error } = await supabase.auth.signInAnonymously({
          options: { data: { display_name: name.trim() } },
        });
        if (error) throw error;
      }
      const { error } = await supabase.rpc("join_event", {
        p_invite_code: code,
        p_display_name: name.trim(),
        p_rsvp: rsvp,
      });
      if (error) throw error;
      try {
        localStorage.setItem(NAME_KEY, name.trim());
      } catch {}
      setAnswered(rsvp);
    } catch (e) {
      const message = e instanceof Error ? e.message : "";
      setError(
        /full/.test(message)
          ? "Leider sind schon alle Plätze vergeben."
          : /Anonymous sign-ins are disabled/i.test(message)
            ? "Gast-Zugang ist im Supabase-Projekt noch nicht aktiviert."
            : "Das hat nicht geklappt. Bitte noch einmal versuchen.",
      );
    } finally {
      setBusy(null);
    }
  }

  if (!configured) return <NotConfigured />;
  if (preview === undefined) return <p className="pt-20 text-center text-muted">Einladung wird geladen …</p>;
  if (preview === null) {
    return (
      <div className="space-y-3 pt-20 text-center">
        <h1 className="text-3xl">Einladung nicht gefunden</h1>
        <p className="text-muted">Der Link ist unvollständig oder der Abend wurde abgesagt.</p>
      </div>
    );
  }

  const full =
    preview.participant_limit !== null &&
    preview.confirmed_count >= preview.participant_limit &&
    answered !== "yes";

  return (
    <motion.article
      className="space-y-6"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <header className="space-y-3 pt-6">
        <Eyebrow>{preview.organizer_name ? `${preview.organizer_name} lädt ein` : "Einladung"}</Eyebrow>
        <h1 className="text-[2.75rem] leading-[1.02]">{preview.title}</h1>
        {preview.theme && <p className="text-lg text-muted">{preview.theme}</p>}
        <div className="flex flex-wrap gap-2 pt-1">
          {preview.is_blind && <Pill>Blindverkostung</Pill>}
          <Pill>
            {preview.confirmed_count} {preview.confirmed_count === 1 ? "Zusage" : "Zusagen"}
            {preview.participant_limit ? ` von ${preview.participant_limit}` : ""}
          </Pill>
        </div>
      </header>

      <Card className="space-y-3">
        <p className="flex items-center gap-3">
          <CalendarIcon className="shrink-0 text-accent" /> {formatEventDate(preview.starts_at)}
        </p>
        {preview.location && (
          <p className="flex items-center gap-3">
            <PinIcon className="shrink-0 text-accent" /> {preview.location}
          </p>
        )}
      </Card>

      {preview.invitation_text && (
        <section className="space-y-2">
          <h2 className="text-2xl">Was uns erwartet</h2>
          <p className="leading-relaxed whitespace-pre-line text-muted">{preview.invitation_text}</p>
        </section>
      )}

      {answered ? (
        <Card role="status" className="space-y-3">
          <p className="font-display text-2xl">
            {answered === "yes"
              ? `Schön, ${name}! Du bist dabei.`
              : `Schade, ${name}. Danke fürs Bescheid geben.`}
          </p>
          {answered === "yes" && (
            <p className="text-sm text-muted">
              Am Abend öffnest du einfach wieder diesen Link – dann geht’s mit der Verkostung los.
            </p>
          )}
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
            <button type="button" className="underline underline-offset-4" onClick={() => setAnswered(null)}>
              Antwort ändern
            </button>
            {session?.user.is_anonymous && (
              <Link href="/login?next=/abende" className="underline underline-offset-4">
                Account anlegen, um Ergebnisse zu behalten
              </Link>
            )}
          </div>
        </Card>
      ) : (
        <form className="space-y-4" onSubmit={(event) => (event.preventDefault(), answer("yes"))}>
          <TextField
            label="Dein Name"
            autoComplete="given-name"
            enterKeyHint="go"
            maxLength={40}
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="So sehen dich die anderen"
          />
          <div className="grid grid-cols-2 gap-3">
            <Button type="submit" size="lg" loading={busy === "yes"} disabled={!name.trim() || full}>
              Ich bin dabei
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="lg"
              loading={busy === "no"}
              disabled={!name.trim()}
              onClick={() => answer("no")}
            >
              Leider nicht
            </Button>
          </div>
          {full && <p className="text-sm text-muted">Alle Plätze sind vergeben.</p>}
          {error && (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          )}
        </form>
      )}
    </motion.article>
  );
}
