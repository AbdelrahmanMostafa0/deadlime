import type { Metadata } from "next";
import { PageHeader } from "@/components/shell/app-shell";

export const metadata: Metadata = { title: "Board" };

export default function Page() {
  return <PageHeader title="Board" subtitle="Coming right up." />;
}
