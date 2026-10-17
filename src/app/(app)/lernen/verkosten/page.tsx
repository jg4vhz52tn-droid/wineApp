import type { Metadata } from "next";
import { ModuleHeader } from "@/components/learn/module-header";
import { Quiz } from "@/components/learn/quiz";
import { TastingSteps } from "@/components/learn/tasting-steps";
import { TASTING_QUIZ } from "@/config/learn/tasting-learn";

export const metadata: Metadata = { title: "Verkosten wie ein Profi" };

export default function TastingPage() {
  return (
    <div className="space-y-8">
      <ModuleHeader id="verkosten">
        Fünf Schritte, die jeder Sommelier macht – am besten mit einem Glas in der Hand durchgehen.
      </ModuleHeader>
      <TastingSteps />
      <Quiz moduleId="verkosten" quiz={TASTING_QUIZ} />
    </div>
  );
}
