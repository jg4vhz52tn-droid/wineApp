import type { Metadata } from "next";
import { GrapeCompare } from "@/components/learn/grape-compare";
import { ModuleHeader } from "@/components/learn/module-header";
import { Quiz } from "@/components/learn/quiz";
import { GRAPE_QUIZ } from "@/config/learn/grapes";

export const metadata: Metadata = { title: "Rebsorten" };

export default function GrapesPage() {
  return (
    <div className="space-y-8">
      <ModuleHeader id="rebsorten">
        Wähl zwei Rebsorten und vergleiche sie: Säure, Körper, Aromatik, Tannin – und warum die Schale so viel
        ausmacht.
      </ModuleHeader>
      <GrapeCompare />
      <Quiz moduleId="rebsorten" quiz={GRAPE_QUIZ} />
    </div>
  );
}
