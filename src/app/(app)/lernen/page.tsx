import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { LearnHub } from "./learn-hub";

export const metadata: Metadata = { title: "Lernen" };

export default function LearnPage() {
  return (
    <>
      <PageHeader eyebrow="Lernen" title="Kurz, visuell, spielerisch">
        Kein Lehrbuch – sondern Böden, Rebsorten und Aromen zum Anfassen. Jedes Modul schaltet eine
        Sammelkarte frei.
      </PageHeader>
      <LearnHub />
    </>
  );
}
