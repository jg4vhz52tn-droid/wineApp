import type { Metadata } from "next";
import { AllPatches } from "./all-patches";

export const metadata: Metadata = { title: "Alle Patches" };

export default function PatchesPage() {
  return <AllPatches />;
}
