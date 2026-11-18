"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState, type ReactNode } from "react";
import { Toaster } from "sonner";

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 15_000, refetchOnWindowFocus: true, retry: 1 },
          mutations: { retry: 0 },
        },
      }),
  );

  return (
    <QueryClientProvider client={client}>
      {children}
      <Toaster
        position="bottom-center"
        offset={{ bottom: 96 }}
        mobileOffset={{ bottom: 96 }}
        toastOptions={{
          unstyled: true,
          classNames: {
            toast:
              "flex w-full items-center gap-3 rounded-chip border-2 border-ink bg-ink px-4 py-2.5 font-sans text-sm font-semibold text-paper shadow-pop-sm md:w-[356px]",
            title: "flex-1",
            actionButton:
              "min-h-9 rounded-chip border-2 border-paper bg-lime px-3 text-[13px] font-bold text-ink transition-spring hover:-rotate-3",
            error: "bg-pink text-ink",
          },
        }}
      />
      <ReactQueryDevtools initialIsOpen={false} buttonPosition="top-right" />
    </QueryClientProvider>
  );
}
