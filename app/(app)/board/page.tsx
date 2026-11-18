import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/shell/app-shell";
import { CardListSkeleton } from "@/components/ui/skeleton";
import { Board } from "@/features/board/board";

export const metadata: Metadata = { title: "Board" };

export default function Page() {
  return (
    <>
      <PageHeader title="Board" subtitle="Five columns of good intentions. Drag responsibly." />
      {/* Board reads ?project= via useSearchParams, so it needs its own Suspense boundary. */}
      <Suspense fallback={<CardListSkeleton count={3} />}>
        <Board />
      </Suspense>
    </>
  );
}
