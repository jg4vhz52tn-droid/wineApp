"use client";

import Link from "next/link";
import { PageHeader } from "@/components/app/page-header";
import { useSession } from "@/components/app/session-provider";
import { PatchGrid } from "@/components/event/patch-gallery";
import { buttonClasses } from "@/components/ui/button";

export function AllPatches() {
  const { ready, session } = useSession();
  return (
    <>
      <Link href="/abende" className="text-sm text-muted">
        ← Abende
      </Link>
      <PageHeader eyebrow="Erinnerungen" title="Alle Patches">
        Ein Patch für jeden Abend, an dem du dabei warst. Antippen öffnet den Rückblick.
      </PageHeader>
      {ready && !session ? (
        <Link href="/login?next=/abende/patches" className={buttonClasses({ size: "lg", block: true })}>
          Anmelden
        </Link>
      ) : (
        <PatchGrid emptyText="Noch keine Patches – nach eurem ersten Lagenabend liegt hier der erste." />
      )}
    </>
  );
}
