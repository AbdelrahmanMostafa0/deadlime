import type { Metadata } from "next";
import { PageHeader } from "@/components/shell/app-shell";

export const metadata: Metadata = { title: "This Week" };

export default function Page() {
  return <PageHeader title="This Week" subtitle="Coming right up." />;
}
