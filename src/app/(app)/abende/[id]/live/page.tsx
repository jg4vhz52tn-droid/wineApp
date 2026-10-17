import type { Metadata } from "next";
import { Suspense } from "react";
import { LiveScreen } from "./live-screen";

export const metadata: Metadata = { title: "Live-Verkostung", robots: { index: false } };

export default function LivePage() {
  return (
    <Suspense>
      <LiveScreen />
    </Suspense>
  );
}
