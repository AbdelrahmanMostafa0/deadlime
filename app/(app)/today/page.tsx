import type { Metadata } from "next";
import { PageHeader } from "@/components/shell/app-shell";

export const metadata: Metadata = { title: "Today" };

export default function Page() {
  return <PageHeader title="Today" subtitle="Coming right up." />;
}
