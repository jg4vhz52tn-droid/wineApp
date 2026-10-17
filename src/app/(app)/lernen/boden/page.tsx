import type { Metadata } from "next";
import { ModuleHeader } from "@/components/learn/module-header";
import { Quiz } from "@/components/learn/quiz";
import { SoilExplorer } from "@/components/learn/soil-explorer";
import { SOIL_QUIZ } from "@/config/learn/soils";

export const metadata: Metadata = { title: "Boden-Explorer" };

export default function SoilPage() {
  return (
    <div className="space-y-8">
      <ModuleHeader id="boden">
        Tipp einen Boden an und schau, wie tief die Wurzeln gehen, wie viel Wasser bleibt und wie warm es wird
        – und was das im Glas bedeutet.
      </ModuleHeader>
      <SoilExplorer />
      <Quiz moduleId="boden" quiz={SOIL_QUIZ} />
    </div>
  );
}
