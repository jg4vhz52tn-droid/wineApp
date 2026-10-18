import type { Metadata } from "next";
import { MyWines } from "./my-wines";

export const metadata: Metadata = { title: "Meine Weine" };

export default function MyWinesPage() {
  return <MyWines />;
}
