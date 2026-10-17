import type { Metadata } from "next";
import { ChoiceGame } from "@/components/learn/choice-game";
import { AromaLayers } from "@/components/learn/aroma-layers";
import { ModuleHeader } from "@/components/learn/module-header";
import { Quiz } from "@/components/learn/quiz";
import { AROMA_QUIZ, AROMA_SORT } from "@/config/learn/aromas-learn";

export const metadata: Metadata = { title: "Was sind Aromen?" };

export default function AromasPage() {
  return (
    <div className="space-y-8">
      <ModuleHeader id="aromen">
        Was du im Glas riechst, hat drei Quellen: die Traube, den Keller und die Zeit.
      </ModuleHeader>
      <AromaLayers />
      <ChoiceGame title="Aromen sortieren" rounds={AROMA_SORT} />
      <Quiz moduleId="aromen" quiz={AROMA_QUIZ} />
    </div>
  );
}
