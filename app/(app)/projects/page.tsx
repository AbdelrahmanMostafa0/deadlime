import type { Metadata } from "next";
import { PageHeader } from "@/components/shell/app-shell";

export const metadata: Metadata = { title: "Projects" };

export default function Page() {
  return <PageHeader title="Projects" subtitle="Coming right up." />;
}
