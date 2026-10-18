"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/app/page-header";
import { useSession } from "@/components/app/session-provider";
import { DnaView } from "@/components/dna/dna-view";
import { buttonClasses } from "@/components/ui/button";
import type { Dna } from "@/lib/dna";
import { fetchDna, writeDnaText } from "@/lib/dna-client";
import { tick } from "@/lib/haptics";

export function DnaScreen() {
  const { ready, session, isGuest } = useSession();
  const [state, setState] = useState<{ dna: Dna; summary: string | null } | null | undefined>(undefined);
  const [writing, setWriting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    let active = true;
    fetchDna().then(async (result) => {
      if (!active) return;
      setState(result);
      // First visit with a ready DNA: write the text once automatically.
      if (result?.dna.ready && !result.summary) {
        try {
          const { text } = await writeDnaText();
          if (active) setState({ ...result, summary: text });
        } catch {
          // The app's own text is shown instead.
        }
      }
    });
    return () => {
      active = false;
    };
  }, [session]);

  async function rewrite() {
    if (!state) return;
    setWriting(true);
    setError(null);
    try {
      const { text } = await writeDnaText();
      tick("medium");
      setState({ ...state, summary: text });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Der Text konnte nicht geschrieben werden.");
    } finally {
      setWriting(false);
    }
  }

  return (
    <>
      <Link href="/profil" className="text-sm text-muted">
        ← Profil
      </Link>
      <PageHeader eyebrow="Profil" title="Geschmacks-DNA">
        Was du wirklich magst – aus deinen Bewertungen und Rate-Bögen.
      </PageHeader>
      {ready && (!session || isGuest) ? (
        <div className="space-y-3">
          <p className="text-muted">Deine DNA braucht ein Konto, damit deine Bewertungen gesammelt werden.</p>
          <Link href="/login?next=/profil/dna" className={buttonClasses({ size: "lg", block: true })}>
            {isGuest ? "Konto anlegen" : "Anmelden"}
          </Link>
        </div>
      ) : state === undefined ? (
        <p className="text-muted">Berechne deine DNA …</p>
      ) : state === null ? (
        <p className="text-muted">Die DNA konnte gerade nicht berechnet werden.</p>
      ) : (
        <>
          <DnaView dna={state.dna} summary={state.summary} onRewrite={rewrite} rewriting={writing} />
          {error && (
            <p role="alert" className="mt-3 text-sm text-danger">
              {error}
            </p>
          )}
        </>
      )}
    </>
  );
}
