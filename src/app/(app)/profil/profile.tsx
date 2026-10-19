"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAppearance } from "@/components/app/appearance-provider";
import { PageHeader } from "@/components/app/page-header";
import { useSession } from "@/components/app/session-provider";
import { Avatar } from "@/components/ui/avatar";
import { Button, buttonClasses } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TextField } from "@/components/ui/field";
import { GoogleIcon } from "@/components/ui/icons";
import { Segmented } from "@/components/ui/segmented";
import type { ThemePreference } from "@/lib/appearance";
import { authErrorMessage, callbackUrl, sendMagicLink, signInWithGoogle } from "@/lib/auth";
import { BadgeShelf, NewBadges, SensesCard } from "@/components/senses/senses";
import { EXPERIENCE_LABEL, useExperience, type Experience } from "@/lib/experience";
import {
  awardBadges,
  fetchProgress,
  senses,
  type Badge,
  type NewBadge,
  type ProgressStats,
} from "@/lib/senses";
import { tick } from "@/lib/haptics";
import { getSupabase } from "@/lib/supabase";

export function Profile() {
  const { session, isGuest, ready } = useSession();
  const { theme, setTheme } = useAppearance();
  const [name, setName] = useState("");
  const [savedName, setSavedName] = useState("");

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase || !session) return;
    supabase
      .from("profiles")
      .select("display_name")
      .eq("id", session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        setName(data?.display_name ?? "");
        setSavedName(data?.display_name ?? "");
      });
  }, [session]);

  return (
    <>
      <PageHeader eyebrow="Profil" title={savedName || "Dein Profil"} />

      <div className="space-y-4">
        {ready && session && (
          <Card className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar name={name || "?"} className="size-14 text-lg" />
              <div className="min-w-0 flex-1">
                <p className="font-medium">{isGuest ? "Gast-Zugang" : "Konto"}</p>
                <p className="truncate text-sm text-muted">
                  {isGuest ? "Nur auf diesem Gerät gespeichert" : (session.user.email ?? "")}
                </p>
              </div>
            </div>
            <NameForm
              userId={session.user.id}
              name={name}
              saved={savedName}
              onChange={setName}
              onSaved={setSavedName}
            />
          </Card>
        )}

        {ready && session && !isGuest && (
          <Link
            href="/profil/dna"
            className="flex items-center justify-between gap-3 rounded-card border border-accent/40 p-4"
            style={{ background: "linear-gradient(150deg, var(--curtain), var(--surface) 75%)" }}
          >
            <span>
              <span className="block font-display text-xl">Deine Geschmacks-DNA</span>
              <span className="block text-sm text-muted">
                Was du wirklich magst – und was deine Nase kann
              </span>
            </span>
            <span className="text-accent">→</span>
          </Link>
        )}

        {ready && session && !isGuest && <ExperienceCard />}
        {ready && session && !isGuest && <Progress userId={session.user.id} />}

        {ready && session && isGuest && <UpgradeCard />}
        {ready && session && !isGuest && <EmailCard current={session.user.email ?? ""} />}

        {ready && !session && (
          <Link href="/login?next=/profil" className={buttonClasses({ size: "lg", block: true })}>
            Anmelden
          </Link>
        )}

        <Card className="space-y-4">
          <h2 className="text-xl">Darstellung</h2>
          <div className="space-y-2">
            <p className="text-sm text-muted">Hell oder dunkel</p>
            <Segmented<ThemePreference>
              label="Hell oder dunkel"
              value={theme}
              onChange={setTheme}
              options={[
                { value: "system", label: "Automatisch" },
                { value: "light", label: "Hell" },
                { value: "dark", label: "Dunkel" },
              ]}
            />
          </div>
          <Link
            href="/styleguide"
            className="inline-block text-sm text-accent underline-offset-4 hover:underline"
          >
            Styleguide ansehen
          </Link>
        </Card>

        {session && !isGuest && (
          <Button variant="ghost" block onClick={() => getSupabase()?.auth.signOut()}>
            Abmelden
          </Button>
        )}
      </div>
    </>
  );
}

/** Profile name - also updated on the guest lists of your evenings. */
function NameForm({
  userId,
  name,
  saved,
  onChange,
  onSaved,
}: {
  userId: string;
  name: string;
  saved: string;
  onChange: (name: string) => void;
  onSaved: (name: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const clean = name.trim();
  const changed = clean !== saved && clean.length > 0;

  async function save(event: React.FormEvent) {
    event.preventDefault();
    const supabase = getSupabase();
    if (!supabase || !changed) return;
    setBusy(true);
    setMessage(null);
    const { error } = await supabase.from("profiles").update({ display_name: clean }).eq("id", userId);
    if (!error) {
      await supabase.from("event_participants").update({ display_name: clean }).eq("user_id", userId);
      await supabase.auth.updateUser({ data: { display_name: clean } });
      onSaved(clean);
      tick("medium");
      setMessage("Gespeichert.");
    } else {
      setMessage("Speichern hat nicht geklappt.");
    }
    setBusy(false);
  }

  return (
    <form className="space-y-3" onSubmit={save}>
      <TextField
        label="Dein Name"
        value={name}
        maxLength={40}
        autoComplete="name"
        onChange={(e) => onChange(e.target.value)}
        hint="So sehen dich die anderen bei Abenden und im Leaderboard."
      />
      {changed && (
        <Button type="submit" block loading={busy}>
          Namen speichern
        </Button>
      )}
      {message && (
        <p role="status" className="text-sm text-muted">
          {message}
        </p>
      )}
    </form>
  );
}

/** Guests turn their device-only access into a real account - points, cards and evenings stay. */
function UpgradeCard() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState<"email" | "google" | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy("email");
    setError(null);
    try {
      await sendMagicLink(email.trim(), "/profil");
      setSentTo(email.trim());
    } catch (e) {
      setError(authErrorMessage(e));
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card className="space-y-4 border-accent/50">
      <div className="space-y-1">
        <h2 className="text-xl">Aus dem Gast-Zugang ein Konto machen</h2>
        <p className="text-sm text-muted">
          Gerade bist du nur auf diesem Handy angemeldet. Mit deiner E-Mail behältst du Punkte, Sammelkarten
          und Abende – auch auf anderen Geräten. Danach kannst du auch selbst Abende planen und deinen Keller
          führen.
        </p>
      </div>
      {sentTo ? (
        <p role="status" className="rounded-control bg-surface-2/70 px-4 py-3 text-sm">
          Fast geschafft: Öffne den Link, den wir an <b className="font-medium">{sentTo}</b> geschickt haben –
          am besten auf diesem Gerät.
        </p>
      ) : (
        <form className="space-y-3" onSubmit={submit}>
          <TextField
            label="E-Mail"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="du@beispiel.de"
          />
          <Button type="submit" block loading={busy === "email"} disabled={!email.includes("@")}>
            Bestätigungs-Link schicken
          </Button>
          <Button
            type="button"
            variant="secondary"
            block
            loading={busy === "google"}
            onClick={async () => {
              setBusy("google");
              setError(null);
              try {
                await signInWithGoogle("/profil");
              } catch (e) {
                setError(authErrorMessage(e));
                setBusy(null);
              }
            }}
          >
            <GoogleIcon /> Mit Google verbinden
          </Button>
        </form>
      )}
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </Card>
  );
}

/** Change the email of an account - Supabase confirms it by link first. */
function EmailCard({ current }: { current: string }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <Card className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-muted">E-Mail</p>
          <p className="truncate">{current}</p>
        </div>
        <button
          type="button"
          className="shrink-0 text-sm font-medium text-accent"
          onClick={() => setOpen(true)}
        >
          Ändern
        </button>
      </Card>
    );
  }

  return (
    <Card className="space-y-3">
      <h2 className="text-xl">E-Mail ändern</h2>
      {sentTo ? (
        <p role="status" className="text-sm">
          Wir haben einen Bestätigungs-Link an <b className="font-medium">{sentTo}</b> geschickt. Erst nach
          dem Klick gilt die neue Adresse.
        </p>
      ) : (
        <form
          className="space-y-3"
          onSubmit={async (event) => {
            event.preventDefault();
            const supabase = getSupabase();
            if (!supabase) return;
            setBusy(true);
            setError(null);
            const { error } = await supabase.auth.updateUser(
              { email: email.trim() },
              { emailRedirectTo: callbackUrl("/profil") },
            );
            if (error) setError(authErrorMessage(error));
            else setSentTo(email.trim());
            setBusy(false);
          }}
        >
          <TextField
            label="Neue E-Mail"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Abbrechen
            </Button>
            <Button type="submit" loading={busy} disabled={!email.includes("@") || email.trim() === current}>
              Link schicken
            </Button>
          </div>
        </form>
      )}
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </Card>
  );
}

/** "Deine Erfahrung": beginners get the guided tasting offered first. */
function ExperienceCard() {
  const { experience, setExperience } = useExperience();
  const text: Record<Experience, string> = {
    beginner:
      "Beim Öffnen einer Flasche schlagen wir dir die geführte Verkostung vor – mit Tipps zu jedem Schritt.",
    intermediate: "Die geführte Verkostung gibt es auf Wunsch, Bewerten geht direkt.",
    pro: "Alles direkt, ohne Hilfen.",
  };
  return (
    <Card className="space-y-3">
      <h2 className="text-xl">Deine Erfahrung</h2>
      <Segmented<Experience>
        label="Deine Erfahrung"
        value={experience}
        onChange={(v) => {
          tick("minor");
          void setExperience(v);
        }}
        options={(["beginner", "intermediate", "pro"] as Experience[]).map((v) => ({
          value: v,
          label: EXPERIENCE_LABEL[v],
        }))}
      />
      <p className="text-sm text-muted">{text[experience]}</p>
      <Link href="/keller/verkosten" className="text-sm font-medium text-accent">
        🍷 Geführte Verkostung starten →
      </Link>
    </Card>
  );
}

/** Senses and badges - new badges are handed out when you open the profile. */
function Progress({ userId }: { userId: string }) {
  const [data, setData] = useState<{ stats: ProgressStats; badges: Badge[] } | null>(null);
  const [fresh, setFresh] = useState<NewBadge[]>([]);
  useEffect(() => {
    let active = true;
    awardBadges()
      .then((newOnes) => {
        if (active) setFresh(newOnes);
        return fetchProgress(userId);
      })
      .then((result) => active && setData(result));
    return () => {
      active = false;
    };
  }, [userId]);
  if (!data) return null;
  return (
    <>
      <NewBadges badges={fresh} />
      <SensesCard senses={senses(data.stats)} />
      <BadgeShelf badges={data.badges} />
    </>
  );
}
