import type { Metadata } from "next";
import { Suspense } from "react";
import { EventScreen } from "./event-screen";

export const metadata: Metadata = { title: "Lagenabend", robots: { index: false } };

export default function EventPage() {
  return (
    <Suspense>
      <EventScreen />
    </Suspense>
  );
}
