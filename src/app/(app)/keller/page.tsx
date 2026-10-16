import type { Metadata } from "next";
import { ComingSoon } from "@/components/app/coming-soon";
import { PageHeader } from "@/components/app/page-header";

export const metadata: Metadata = { title: "Keller" };

export default function CellarPage() {
  return (
    <>
      <PageHeader eyebrow="Dein Keller" title="Flaschen mit Geschichte">
        Bestand, Lagerplatz und Trinkfenster – und ein Tagebuch für die besonderen Flaschen.
      </PageHeader>
      <ComingSoon
        phase={2}
        items={[
          "Etikett scannen statt abtippen",
          "Lagerplatz nach Regal, Fach und Reihe",
          "Trinkfenster-Ampel: noch warten, jetzt perfekt, dringend trinken",
          "Weintagebuch mit Fotos und Erinnerungskarte",
        ]}
      />
    </>
  );
}
