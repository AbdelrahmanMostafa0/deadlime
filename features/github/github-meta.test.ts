import { describe, expect, it } from "vitest";
import { installationSettingsUrl, linkLabel } from "./github-meta";

describe("installationSettingsUrl", () => {
  it("uses the personal settings page for users", () => {
    expect(installationSettingsUrl({ id: 7, accountLogin: "me", accountType: "User" })).toBe(
      "https://github.com/settings/installations/7",
    );
  });
  it("uses the org settings page for organizations", () => {
    expect(installationSettingsUrl({ id: 7, accountLogin: "acme", accountType: "Organization" })).toBe(
      "https://github.com/organizations/acme/settings/installations/7",
    );
  });
});

describe("linkLabel", () => {
  it("labels issues and PRs repo#number", () => {
    expect(linkLabel({ kind: "pr", repo: "a/b", number: 12, ref: null })).toBe("a/b#12");
  });
  it("labels branches by name", () => {
    expect(linkLabel({ kind: "branch", repo: "a/b", number: null, ref: "feat/x" })).toBe("feat/x");
  });
});
