import type { Metadata } from "next";
import { ModuleHeader } from "@/components/learn/module-header";
import { StoryModule } from "@/components/learn/story-module";
import { STORIES } from "@/config/learn/stories";

export const metadata: Metadata = { title: "Richtig lagern" };

export default function LagernPage() {
  return (
    <div className="space-y-8">
      <ModuleHeader id="lagern">Kühl, dunkel, ruhig – sechs Karten, dann eine Frage.</ModuleHeader>
      <StoryModule id="lagern" story={STORIES.lagern} />
    </div>
  );
}
