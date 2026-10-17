import type { Metadata } from "next";
import { Suspense } from "react";
import { Recap } from "./recap";

export const metadata: Metadata = { title: "Rückblick", robots: { index: false } };

export default function RecapPage() {
  return (
    <Suspense>
      <Recap />
    </Suspense>
  );
}
