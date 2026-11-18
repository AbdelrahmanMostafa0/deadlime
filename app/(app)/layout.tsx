import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AppShell } from "@/components/shell/app-shell";
import { GlobalOverlays } from "@/components/shell/global-overlays";
import { LogoMark } from "@/components/shell/logo";
import { getSessionUser } from "@/server/session";

/** Reads the session at request time, so it streams behind Suspense (cacheComponents). */
async function AuthedShell({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/sign-in");
  return (
    <AppShell user={{ name: user.name, image: user.image }} overlays={<GlobalOverlays />}>
      {children}
    </AppShell>
  );
}

function ShellFallback() {
  return (
    <div role="status" aria-label="Loading" className="grid min-h-dvh place-items-center">
      <LogoMark className="size-14 animate-spin [animation-duration:1.6s]" />
    </div>
  );
}

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <Suspense fallback={<ShellFallback />}>
      <AuthedShell>{children}</AuthedShell>
    </Suspense>
  );
}
