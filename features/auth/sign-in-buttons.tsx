"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

type Provider = "google" | "github";

const PROVIDERS: { id: Provider; label: string }[] = [
  { id: "google", label: "Continue with Google" },
  { id: "github", label: "Continue with GitHub" },
];

/** Only allow same-site relative paths as the post-login destination. */
function safeNext(next: string | null) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/today";
}

export function SignInButtons() {
  const params = useSearchParams();
  const [pending, setPending] = useState<Provider | null>(null);

  const signIn = async (provider: Provider) => {
    setPending(provider);
    const { error } = await authClient.signIn.social({ provider, callbackURL: safeNext(params.get("next")) });
    if (error) {
      setPending(null);
      toast.error(error.message ?? "Sign-in failed. The internet sends its regards.");
    }
  };

  return (
    <div className="flex w-full flex-col gap-3">
      {PROVIDERS.map((p, i) => (
        <Button
          key={p.id}
          variant={i === 0 ? "lime" : "default"}
          size="lg"
          disabled={pending !== null}
          onClick={() => signIn(p.id)}
        >
          {pending === p.id ? "Redirecting…" : p.label}
        </Button>
      ))}
    </div>
  );
}
