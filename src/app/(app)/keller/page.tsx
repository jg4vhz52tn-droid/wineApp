import type { Metadata } from "next";
import { CellarScreen } from "./cellar-screen";

export const metadata: Metadata = { title: "Keller" };

export default function CellarPage() {
  return <CellarScreen />;
}
