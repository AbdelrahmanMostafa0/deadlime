import type { Metadata } from "next";
import { Suspense } from "react";
import { ReviewScreen } from "@/features/week/review-screen";

export const metadata: Metadata = { title: "Sunday review" };

export default function Page() {
  return (
    <Suspense>
      <ReviewScreen />
    </Suspense>
  );
}
