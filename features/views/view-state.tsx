import type { ReactNode } from "react";
import { copy } from "@/lib/copy";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { CardListSkeleton } from "@/components/ui/skeleton";
import { OpenPaletteButton } from "./open-palette-button";

type Props = {
  isPending: boolean;
  isError: boolean;
  refetch: () => void;
  isEmpty: boolean;
  empty: { title: string; body: string };
  children: ReactNode;
};

/** Loading, error and empty states shared by every list view. */
export function ViewState({ isPending, isError, refetch, isEmpty, empty, children }: Props) {
  if (isPending) return <CardListSkeleton />;
  if (isError) return <ErrorState message={copy.error} onRetry={refetch} />;
  if (isEmpty) return <EmptyState title={empty.title} body={empty.body} action={<OpenPaletteButton />} />;
  return children;
}
