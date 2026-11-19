"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { toast } from "@/lib/toast";

/** Reads `?github=connected|error` from the setup redirect, toasts it once, then clears the param. */
export function useInstallToast() {
  const router = useRouter();
  const pathname = usePathname();
  const status = useSearchParams().get("github");

  useEffect(() => {
    if (status === "connected") toast.success("GitHub connected.", { id: "github-install" });
    else if (status === "error") toast.error("GitHub didn't connect. Try the install again.", { id: "github-install" });
    else return;
    router.replace(pathname);
  }, [status, pathname, router]);
}
