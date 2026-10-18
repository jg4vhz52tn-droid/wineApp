import type { Metadata } from "next";
import { DnaScreen } from "./dna-screen";

export const metadata: Metadata = { title: "Geschmacks-DNA" };

export default function DnaPage() {
  return <DnaScreen />;
}
