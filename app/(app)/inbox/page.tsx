import type { Metadata } from "next";
import { PageHeader } from "@/components/shell/app-shell";

export const metadata: Metadata = { title: "Inbox" };

export default function Page() {
  return <PageHeader title="Inbox" subtitle="Coming right up." />;
}
