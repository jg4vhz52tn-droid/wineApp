import type { Metadata } from "next";
import { CuveeBuilder } from "@/components/learn/cuvee-builder";
import { ModuleHeader } from "@/components/learn/module-header";
import { Quiz } from "@/components/learn/quiz";
import { CUVEE_QUIZ } from "@/config/learn/cuvee";

export const metadata: Metadata = { title: "Cuvée-Baukasten" };

export default function CuveePage() {
  return (
    <div className="space-y-8">
      <ModuleHeader id="cuvee">
        Viele große Weine sind Mischungen. Jede Rebsorte bringt etwas mit – probier aus, was passiert, wenn du
        die Anteile verschiebst.
      </ModuleHeader>
      <CuveeBuilder />
      <Quiz moduleId="cuvee" quiz={CUVEE_QUIZ} />
    </div>
  );
}
