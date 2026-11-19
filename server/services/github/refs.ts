export type GithubRef =
  | { owner: string; repo: string; kind: "issue" | "pr" | "unknown-number"; number: number }
  | { owner: string; repo: string; kind: "branch"; ref: string };

const OWNER = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/;
const REPO = /^[A-Za-z0-9._-]{1,100}$/;
const NUMBER = /^[1-9][0-9]{0,9}$/;

function slug(owner: string, repo: string) {
  if (!OWNER.test(owner) || !REPO.test(repo) || repo === "." || repo === "..") return null;
  return { owner, repo };
}

function decode(part: string) {
  try {
    return decodeURIComponent(part);
  } catch {
    return null;
  }
}

function fromUrl(url: URL): GithubRef | null {
  if (url.protocol !== "https:" || !["github.com", "www.github.com"].includes(url.hostname)) return null;
  const [owner, repo, section, ...rest] = url.pathname.split("/").filter(Boolean);
  const target = owner && repo ? slug(owner, repo) : null;
  if (!target || !rest.length) return null;
  if (section === "issues" || section === "pull") {
    if (!NUMBER.test(rest[0])) return null;
    return { ...target, kind: section === "issues" ? "issue" : "pr", number: Number(rest[0]) };
  }
  if (section === "tree") {
    const parts = rest.map(decode);
    if (parts.some((p) => !p)) return null;
    return { ...target, kind: "branch", ref: parts.join("/") };
  }
  return null;
}

/**
 * Parse what a user pastes to link a task: an issue/PR/branch URL, `owner/repo#12`
 * or `owner/repo@branch`. Returns null for anything else. Pure: no network.
 */
export function parseGithubRef(input: string): GithubRef | null {
  const text = input.trim();
  if (!text || text.length > 2048 || /\s/.test(text)) return null;
  if (/^https?:\/\//i.test(text)) {
    try {
      return fromUrl(new URL(text));
    } catch {
      return null;
    }
  }
  const short = /^([^/#@\s]+)\/([^/#@\s]+)(?:#(\d+)|@(.+))$/.exec(text);
  if (!short) return null;
  const [, owner, repo, number, branch] = short;
  const target = slug(owner, repo);
  if (!target) return null;
  if (number !== undefined)
    return NUMBER.test(number) ? { ...target, kind: "unknown-number", number: Number(number) } : null;
  return { ...target, kind: "branch", ref: branch };
}
