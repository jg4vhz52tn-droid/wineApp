import type { Metadata } from "next";
import { ModuleHeader } from "@/components/learn/module-header";
import { StoryModule } from "@/components/learn/story-module";
import { STORIES } from "@/config/learn/stories";

export const metadata: Metadata = { title: "Etikett lesen" };

export default function EtikettPage() {
  return (
    <div className="space-y-8">
      <ModuleHeader id="etikett">Was die Begriffe auf dem Etikett bedeuten – und was nicht.</ModuleHeader>
      <StoryModule id="etikett" story={STORIES.etikett} />
    </div>
  );
}
