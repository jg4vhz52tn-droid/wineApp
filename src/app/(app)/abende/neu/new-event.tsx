"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { NotConfigured } from "@/components/app/not-configured";
import { PageHeader } from "@/components/app/page-header";
import { useSession } from "@/components/app/session-provider";
import { EventForm } from "@/components/event/event-form";
import { buttonClasses } from "@/components/ui/button";
import { createEvent } from "@/lib/events/api";
import { getSupabase } from "@/lib/supabase";

export function NewEvent() {
  const { configured, ready, session, isGuest } = useSession();
  const router = useRouter();
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    getSupabase()
      ?.from("profiles")
      .select("display_name")
      .eq("id", session.user.id)
      .maybeSingle()
      .then(({ data }) => setName(data?.display_name || null));
  }, [session]);

  if (!configured) return <NotConfigured />;
  if (!ready) return null;
  if (!session || isGuest) {
    return (
      <div className="space-y-4">
        <PageHeader eyebrow="Neuer Lagenabend" title="Erst anmelden" />
        <p className="text-muted">Abende anlegen geht mit einem Konto – Gäste brauchen keins.</p>
        <Link href="/login?next=/abende/neu" className={buttonClasses({ size: "lg", block: true })}>
          Anmelden
        </Link>
      </div>
    );
  }

  return (
    <>
      <Link href="/abende" className="text-sm text-muted">
        ← Abende
      </Link>
      <PageHeader eyebrow="Neuer Lagenabend" title="Abend planen">
        Thema wählen, Termin und Ort eintragen – die Flaschen legst du im nächsten Schritt an.
      </PageHeader>
      <EventForm
        organizerName={name}
        submitLabel="Abend anlegen"
        onSubmit={async (input) => {
          const id = await createEvent(input);
          if (id) router.push(`/abende/${id}`);
        }}
      />
    </>
  );
}
