import type { Metadata } from "next";
import { ModuleHeader } from "@/components/learn/module-header";
import { Quiz } from "@/components/learn/quiz";
import { DecantGuide, GlassGuide, TemperatureGuide } from "@/components/learn/serving";
import { SERVING_QUIZ } from "@/config/learn/serving";

export const metadata: Metadata = { title: "Richtig servieren" };

export default function ServingPage() {
  return (
    <div className="space-y-10">
      <ModuleHeader id="servieren">
        Derselbe Wein schmeckt zu kalt, zu warm oder im falschen Glas wie ein anderer. Drei Stellschrauben,
        die jeder drehen kann.
      </ModuleHeader>
      <TemperatureGuide />
      <GlassGuide />
      <DecantGuide />
      <Quiz moduleId="servieren" quiz={SERVING_QUIZ} />
    </div>
  );
}
