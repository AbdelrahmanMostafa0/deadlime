import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shell/app-shell";
import { GithubSettings } from "@/features/github/github-settings";
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
    <>
      <PageHeader eyebrow="Settings" title="You, basically." />
      {/* Phone: profile, guide, apps. Wide screens: the guide gets the room, account stuff sits on the right. */}
      <div className="grid grid-cols-1 items-start gap-10 xl:grid-cols-[minmax(0,1fr)_minmax(0,380px)] xl:grid-rows-[auto_1fr]">
        <div className="xl:col-start-2">
          <ProfileCard user={user} />
        </div>
        <div className="xl:col-start-1 xl:row-span-2 xl:row-start-1">
          <Section
            title="Connect Claude"
            body="Let Claude read and update your projects, tasks and week. It only gets your Deadlime data, nothing else."
          >
            <ConnectClaude mcpUrl={mcpUrl} />
          </Section>
        </div>
        <div className="flex flex-col gap-10 xl:col-start-2">
          <Section
            title="Connected apps"
            body="Everything you've let in. Disconnect anything you don't recognize."
          >
            <ConnectionsList />
          </Section>
          <Section
            title="GitHub"
            body="Link repos to projects and issues, PRs and branches to tasks."
          >
            <GithubSettings />
          </Section>
        </div>
      </div>
    </>
  );
}
