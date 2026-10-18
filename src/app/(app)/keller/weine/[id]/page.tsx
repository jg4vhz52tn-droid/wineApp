import type { Metadata } from "next";
import { Suspense } from "react";
import { WineScreen } from "./wine-screen";

export const metadata: Metadata = { title: "Wein" };

export default function WinePage() {
  return (
    <Suspense>
      <WineScreen />
    </Suspense>
  );
}
