import type { Metadata } from "next";
import { ChoiceGame } from "@/components/learn/choice-game";
import { ModuleHeader } from "@/components/learn/module-header";
import { StoryModule } from "@/components/learn/story-module";
import { FAULT_CASES, STORIES } from "@/config/learn/stories";

export const metadata: Metadata = { title: "Weinfehler erkennen" };

export default function WeinfehlerPage() {
  return (
    <div className="space-y-8">
      <ModuleHeader id="weinfehler">Woran du merkst, dass mit einer Flasche etwas nicht stimmt.</ModuleHeader>
      <StoryModule id="weinfehler" story={STORIES.weinfehler}>
        <ChoiceGame title="Fehler-Detektiv" rounds={FAULT_CASES} />
      </StoryModule>
    </div>
  );
}
