"use client";

import { GlassIcon } from "@/components/ui/icons";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "@/components/app/session-provider";
import { GuidedTasting } from "@/components/guided/guided-tasting";
import { buttonClasses } from "@/components/ui/button";
import { fetchGuideWine, loadExpected, type Expected, type GuideWine } from "@/lib/guided";
import { awardBadges } from "@/lib/senses";
import { saveReview } from "@/lib/wines";

export function GuidedScreen() {
  const { id } = useParams<{ id: string }>();
  const { ready, session, isGuest } = useSession();
  const [wine, setWine] = useState<GuideWine | null | undefined>(undefined);
  const [expected, setExpected] = useState<Expected | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!session) return;
    let active = true;
    fetchGuideWine(id).then(async (w) => {
      if (!active) return;
      setWine(w);
      if (w) {
        const e = await loadExpected(w);
        if (active) setExpected(e);
      }
    });
    return () => {
      active = false;
    };
  }, [id, session]);

  if (ready && (!session || isGuest)) {
    return (
      <div className="space-y-3 pt-10">
        <p className="text-muted">Die geführte Verkostung braucht ein Konto.</p>
        <Link
          href={`/login?next=/keller/verkosten/${id}`}
          className={buttonClasses({ size: "lg", block: true })}
        >
          Anmelden
        </Link>
      </div>
    );
  }
  if (wine === null) return <p className="pt-20 text-center text-muted">Wein nicht gefunden.</p>;

  return (
    <div className="space-y-6">
      <Link href="/keller/verkosten" className="text-sm text-muted">
        ← Andere Flasche
      </Link>
      {!wine || !expected ? (
        <div className="space-y-2 pt-16 text-center">
          <GlassIcon className="mx-auto size-12 text-accent" />
          <p className="text-muted">Ich schaue nach, was Kenner in diesem Wein finden …</p>
        </div>
      ) : (
        <GuidedTasting
          wine={wine}
          expected={expected}
          onSave={async (r) => {
            await saveReview({
              vintageId: wine.vintageId,
              rating: r.rating,
              note: "",
              aromas: r.aromas,
              structure: r.structure,
              isPublic: r.isPublic,
              guided: r.guided,
            });
            setSaved(true);
            return awardBadges();
          }}
        />
      )}
      {saved && wine && (
        <div className="grid gap-2">
          <Link href={`/keller/weine/${wine.wineId}`} className={buttonClasses({ size: "lg", block: true })}>
            Zur Bewertung
          </Link>
          <Link
            href="/profil/dna"
            className={buttonClasses({ size: "lg", block: true, variant: "secondary" })}
          >
            Meine Geschmacks-DNA
          </Link>
        </div>
      )}
    </div>
  );
}
