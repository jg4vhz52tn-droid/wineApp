import type { Metadata } from "next";
import { ChoiceGame } from "@/components/learn/choice-game";
import { GrapeCompare } from "@/components/learn/grape-compare";
import { ModuleHeader } from "@/components/learn/module-header";
import { Quiz } from "@/components/learn/quiz";
import { GRAPE_GAME, GRAPE_QUIZ } from "@/config/learn/grapes";

export const metadata: Metadata = { title: "Rebsorten" };

export default function GrapesPage() {
  return (
    <div className="space-y-8">
      <ModuleHeader id="rebsorten">
        Wähl zwei Rebsorten und vergleiche sie: Säure, Körper, Aromatik, Tannin – und warum die Schale so viel
        ausmacht.
      </ModuleHeader>
      <GrapeCompare />
      <ChoiceGame title="Welche Rebsorte bin ich?" rounds={GRAPE_GAME} />
      <Quiz moduleId="rebsorten" quiz={GRAPE_QUIZ} />
    </div>
  );
}
