"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAppearance } from "@/components/app/appearance-provider";
import { PageHeader } from "@/components/app/page-header";
import { useSession } from "@/components/app/session-provider";
import { Button, buttonClasses } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Segmented } from "@/components/ui/segmented";
import { LOOK_LABELS, type Look, type ThemePreference } from "@/lib/appearance";
import { getSupabase } from "@/lib/supabase";

export function Profile() {
  const { session, isGuest, ready } = useSession();
  const { look, theme, setLook, setTheme } = useAppearance();
  const [name, setName] = useState("");

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase || !session) return;
    supabase
      .from("profiles")
      .select("display_name")
      .eq("id", session.user.id)
      .maybeSingle()
      .then(({ data }) => setName(data?.display_name ?? ""));
  }, [session]);

  return (
    <>
      <PageHeader eyebrow="Profil" title={name || "Dein Profil"} />

      <div className="space-y-4">
        {ready && session && (
          <Card className="flex items-center gap-4">
            <Avatar name={name || "?"} className="size-12" />
            <div className="min-w-0 flex-1">
              <p className="font-medium">{isGuest ? "Gast-Zugang" : "Account"}</p>
              <p className="truncate text-sm text-muted">
                {isGuest ? "Nur auf diesem Gerät" : (session.user.email ?? "")}
              </p>
            </div>
          </Card>
        )}

        {ready && (!session || isGuest) && (
          <Link href="/login?next=/profil" className={buttonClasses({ size: "lg", block: true })}>
            {isGuest ? "Account anlegen & Ergebnisse behalten" : "Anmelden"}
          </Link>
        )}

        <Card className="space-y-4">
          <h2 className="text-xl">Darstellung</h2>
          <div className="space-y-2">
            <p className="text-sm text-muted">Look</p>
            <Segmented<Look>
              label="Look"
              value={look}
              onChange={setLook}
              options={[
                { value: "a", label: LOOK_LABELS.a },
                { value: "b", label: LOOK_LABELS.b },
              ]}
            />
          </div>
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
