"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { NotConfigured } from "@/components/app/not-configured";
import { useSession } from "@/components/app/session-provider";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/card";
import { TextField } from "@/components/ui/field";
import { GoogleIcon, MailIcon } from "@/components/ui/icons";
import { APP_NAME } from "@/config/app";
import { authErrorMessage, sendMagicLink, signInWithGoogle } from "@/lib/auth";

export function LoginForm() {
  const next = useSearchParams().get("next") ?? "/abende";
  const { configured, isGuest } = useSession();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState<"google" | "email" | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function google() {
    setBusy("google");
    setError(null);
    try {
      await signInWithGoogle(next);
    } catch (e) {
      setError(authErrorMessage(e));
      setBusy(null);
    }
  }

  async function magicLink(event: React.FormEvent) {
    event.preventDefault();
    setBusy("email");
    setError(null);
    try {
      await sendMagicLink(email.trim(), next);
      setSentTo(email.trim());
    } catch (e) {
      setError(authErrorMessage(e));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <Eyebrow>{APP_NAME}</Eyebrow>
        <h1 className="text-[2.75rem] leading-[1.02]">{isGuest ? "Ergebnisse behalten" : "Willkommen"}</h1>
        <p className="text-muted">
          {isGuest
            ? "Verbinde deinen Gast-Zugang mit Google oder deiner E-Mail – deine Punkte und Notizen bleiben erhalten."
            : "Melde dich an, um Lagenabende zu organisieren und deinen Keller zu führen."}
        </p>
      </header>

      {!configured && <NotConfigured />}

      {sentTo ? (
        <div role="status" className="space-y-2 rounded-card border border-border bg-surface p-5">
          <p className="font-medium">Schau in dein Postfach</p>
          <p className="text-sm text-muted">
            Wir haben einen Anmelde-Link an <strong className="text-fg">{sentTo}</strong> geschickt. Öffne ihn
            auf diesem Gerät.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <Button
            variant="secondary"
            size="lg"
            block
            onClick={google}
            loading={busy === "google"}
            disabled={!configured}
          >
            <GoogleIcon /> Mit Google anmelden
          </Button>

          <div className="flex items-center gap-3 text-xs tracking-widest text-muted uppercase" aria-hidden>
            <span className="h-px flex-1 bg-border" /> oder <span className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={magicLink} className="space-y-4">
            <TextField
              label="E-Mail"
              type="email"
              autoComplete="email"
              inputMode="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="du@beispiel.de"
            />
            <Button type="submit" size="lg" block loading={busy === "email"} disabled={!configured}>
              <MailIcon /> Anmelde-Link schicken
            </Button>
          </form>
        </div>
      )}

      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}

      <p className="text-center text-sm text-muted">
        Nur zu Gast bei einem Abend? Dann brauchst du keinen Account – öffne einfach den Einladungslink.{" "}
        <Link href="/abende" className="underline underline-offset-4">
          Zurück
        </Link>
      </p>
    </div>
  );
}
