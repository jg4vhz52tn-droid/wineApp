"use client";

import { useRef } from "react";
import type { ModuleId } from "@/config/learn/modules";
import type { Story } from "@/config/learn/stories";
import { Quiz } from "./quiz";
import { StoryCards } from "./story-cards";

/** Story cards, then an optional interactive part, then the quiz. */
export function StoryModule({
  id,
  story,
  children,
}: {
  id: ModuleId;
  story: Story;
  children?: React.ReactNode;
}) {
  const next = useRef<HTMLDivElement>(null);
  return (
    <div className="space-y-8">
      <StoryCards
        cards={story.cards}
        onFinish={() => next.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
      />
      <div ref={next} className="scroll-mt-6 space-y-8">
        {children}
        <Quiz moduleId={id} quiz={story.quiz} />
      </div>
    </div>
  );
}
