import type { Metadata } from "next";
import { ModuleHeader } from "@/components/learn/module-header";
import { Quiz } from "@/components/learn/quiz";
import { VineYear, WineProcess } from "@/components/learn/winemaking";
import { WINEMAKING_QUIZ } from "@/config/learn/winemaking";

export const metadata: Metadata = { title: "Vom Weinberg ins Glas" };

export default function WinemakingPage() {
  return (
    <div className="space-y-10">
      <ModuleHeader id="weinbereitung">
        Ein Jahr im Weinberg, ein paar Wochen im Gärtank – und der Moment, der über Weiß, Rosé oder Rot
        entscheidet.
      </ModuleHeader>
      <VineYear />
      <WineProcess />
      <Quiz moduleId="weinbereitung" quiz={WINEMAKING_QUIZ} />
    </div>
  );
}
