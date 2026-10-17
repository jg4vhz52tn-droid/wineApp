import type { Metadata } from "next";
import { ModuleHeader } from "@/components/learn/module-header";
import { Quiz } from "@/components/learn/quiz";
import { WineAtlas } from "@/components/learn/wine-atlas";
import { ATLAS_QUIZ } from "@/config/learn/atlas";

export const metadata: Metadata = { title: "Weinatlas" };

export default function AtlasPage() {
  return (
    <div className="space-y-8">
      <ModuleHeader id="atlas">
        Dreizehn Anbaugebiete, von der Ahr bis nach Sachsen. Tipp auf einen Kreis – je größer, desto mehr
        Reben stehen dort.
      </ModuleHeader>
      <WineAtlas />
      <Quiz moduleId="atlas" quiz={ATLAS_QUIZ} />
    </div>
  );
}
