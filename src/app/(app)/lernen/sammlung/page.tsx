import type { Metadata } from "next";
import { Collection } from "./collection";

export const metadata: Metadata = { title: "Sammlung" };

export default function CollectionPage() {
  return <Collection />;
}
