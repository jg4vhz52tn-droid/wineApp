import type { Metadata } from "next";
import { NewEvent } from "./new-event";

export const metadata: Metadata = { title: "Neuer Abend" };

export default function NewEventPage() {
  return <NewEvent />;
}
