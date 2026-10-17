"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { NotConfigured } from "@/components/app/not-configured";
import { useSession } from "@/components/app/session-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TextField } from "@/components/ui/field";
import { InviteDetails } from "@/components/event/invite-details";
import { InvitationTicket } from "@/components/event/invitation-ticket";
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

async function loadParticipants(eventId: string, userId: string) {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data } = await supabase
    .from("event_participants")
    .select("display_name, rsvp, user_id")
    .eq("event_id", eventId)
    .order("joined_at");
  if (!data?.length) return null;
  return {
    own: data.find((p) => p.user_id === userId) as
      { display_name: string; rsvp: Rsvp | "pending" } | undefined,
    guests: data.filter((p) => p.rsvp === "yes").map((p) => p.display_name as string),
  };
}

export function Invitation() {
  const { code } = useParams<{ code: string }>();
  const { configured, session, ready } = useSession();
  const [preview, setPreview] = useState<Preview | null | undefined>(undefined);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState<Rsvp | null>(null);
  const [answered, setAnswered] = useState<Rsvp | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [guests, setGuests] = useState<string[] | null>(null);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;
    supabase.rpc("event_preview", { p_invite_code: code }).then(({ data }) => {
      setPreview(data?.[0] ?? null);
      // Prefill the name this device used for an earlier invite.
      setName((current) => current || readStoredName());
    });
  }, [code]);

  // Already answered on this device? Show it instead of the form. Participants
  // may also see who else is coming (RLS returns nothing to everyone else).
  useEffect(() => {
    if (!ready || !session || !preview) return;
    loadParticipants(preview.event_id, session.user.id).then((result) => {
      if (!result) return;
      setGuests(result.guests);
      if (result.own && result.own.rsvp !== "pending") {
        setName(result.own.display_name);
        setAnswered(result.own.rsvp);
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
      const { data } = await supabase.auth.getUser();
      if (preview && data.user) {
        const result = await loadParticipants(preview.event_id, data.user.id);
        if (result) setGuests(result.guests);
      }
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
      <div className="pt-4">
        <InvitationTicket
          asPageTitle
          organizerName={preview.organizer_name}
          title={preview.title}
          theme={preview.theme}
          startsAt={preview.starts_at}
          location={preview.location}
          isBlind={preview.is_blind}
          confirmed={preview.confirmed_count}
          limit={preview.participant_limit}
        >
          <InviteDetails
            eventId={preview.event_id}
            title={preview.title}
            startsAt={preview.starts_at}
            location={preview.location}
            description={preview.invitation_text}
            invitePath={`/e/${code}`}
            guests={guests}
            confirmed={preview.confirmed_count}
          />
        </InvitationTicket>
      </div>

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
