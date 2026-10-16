import type { Metadata } from "next";
import { EventList } from "./event-list";

export const metadata: Metadata = { title: "Abende" };

export default function EventsPage() {
  return <EventList />;
}
