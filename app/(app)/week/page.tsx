import type { Metadata } from "next";
import { WeekView } from "@/features/views/week-view";

export const metadata: Metadata = { title: "This Week" };

export default function Page() {
  return <WeekView />;
}
