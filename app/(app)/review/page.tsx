import type { Metadata } from "next";
import { PageHeader } from "@/components/shell/app-shell";

export const metadata: Metadata = { title: "Sunday review" };

export default function Page() {
  return <PageHeader title="Sunday review" subtitle="Coming right up." />;
}
