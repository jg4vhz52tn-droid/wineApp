"use client";

import { useRef } from "react";
import type { ModuleId } from "@/config/learn/modules";
import type { Story } from "@/config/learn/stories";
import { Quiz } from "./quiz";
import { StoryCards } from "./story-cards";

export function StoryModule({ id, story }: { id: ModuleId; story: Story }) {
  const quiz = useRef<HTMLDivElement>(null);
  return (
    <div className="space-y-8">
      <StoryCards
        cards={story.cards}
        onFinish={() => quiz.current?.scrollIntoView({ behavior: "smooth", block: "center" })}
      />
      <div ref={quiz}>
        <Quiz moduleId={id} quiz={story.quiz} />
      </div>
    </div>
  );
}
