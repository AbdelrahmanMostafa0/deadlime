import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shell/app-shell";
import { serverEnv } from "@/lib/env";
import { getSessionUser } from "@/server/session";
import { ConnectClaude } from "./connect-claude";
import { ConnectionsList } from "./connections-list";
import { ProfileCard } from "./profile-card";

const Section = ({ title, body, children }: { title: string; body?: string; children: ReactNode }) => (
  <section className="flex flex-col gap-4">
    <div>
      <h2 className="font-display-tight text-2xl font-extrabold">{title}</h2>
      {body && <p className="mt-1 text-sm text-ink-2">{body}</p>}
    </div>
    {children}
  </section>
);

/** Request-time: reads the session, so render it inside Suspense. */
export async function SettingsScreen() {
  const user = await getSessionUser();
  if (!user) redirect("/sign-in");
  const mcpUrl = `${serverEnv().BETTER_AUTH_URL}/api/mcp`;

  return (
    <div className="flex max-w-4xl flex-col gap-10">
      <PageHeader eyebrow="Settings" title="You, basically." />
      <ProfileCard user={user} />
      <Section
        title="Connect Claude"
        body="Let Claude read and update your projects, tasks and week. It only gets your Deadlime data, nothing else."
      >
        <ConnectClaude mcpUrl={mcpUrl} />
      </Section>
      <Section
        title="Connected apps"
        body="Everything you've let in. Disconnect anything you don't recognize."
      >
        <ConnectionsList />
      </Section>
    </div>
  );
}
