import type { Metadata } from "next";
import { ComingSoon } from "@/components/app/coming-soon";
import { PageHeader } from "@/components/app/page-header";

export const metadata: Metadata = { title: "Lernen" };

export default function LearnPage() {
  return (
    <>
      <PageHeader eyebrow="Lernen" title="Kurz, visuell, spielerisch">
        Kein Lehrbuch – sondern Böden, Rebsorten und Aromen zum Anfassen.
      </PageHeader>
      <ComingSoon
        phase={4}
        items={[
          "Boden-Explorer: Schiefer, Muschelkalk, Löss, Vulkan",
          "Rebsorten-Steckbriefe und Cuvée-Baukasten",
          "Interaktives Aromarad und Weinatlas",
          "Sammelkarten-Album mit Fortschritt",
        ]}
      />
    </>
  );
}
