import type { Metadata } from "next";
import { Suspense } from "react";
import { GuidedScreen } from "./guided-screen";

export const metadata: Metadata = { title: "Geführte Verkostung" };

export default function GuidedWinePage() {
  return (
    <Suspense>
      <GuidedScreen />
    </Suspense>
  );
}
