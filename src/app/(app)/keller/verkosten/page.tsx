import type { Metadata } from "next";
import { ChooseBottle } from "./choose-bottle";

export const metadata: Metadata = { title: "Geführte Verkostung" };

export default function GuidedPage() {
  return <ChooseBottle />;
}
