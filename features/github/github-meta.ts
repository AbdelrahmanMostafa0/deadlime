import type { TaskLinkDTO } from "@/lib/api-types";

/** Where the user manages an installation on GitHub. Orgs live under /organizations/<login>. */
export function installationSettingsUrl(i: { id: number; accountLogin: string; accountType: string }) {
  return i.accountType === "Organization"
    ? `https://github.com/organizations/${encodeURIComponent(i.accountLogin)}/settings/installations/${i.id}`
    : `https://github.com/settings/installations/${i.id}`;
}

export const repoUrl = (fullName: string) => `https://github.com/${fullName}`;

/** `owner/repo#12` for issues and PRs, the branch name for branches. */
export function linkLabel(link: Pick<TaskLinkDTO, "kind" | "repo" | "number" | "ref">) {
  return link.kind === "branch" ? (link.ref ?? link.repo) : `${link.repo}#${link.number}`;
}
