import { describe, expect, it } from "vitest";
import { issueLinkState, pullRequestLinkState } from "./mapping";

describe("issueLinkState", () => {
  it("maps open and closed", () => {
    expect(issueLinkState({ state: "open" })).toBe("open");
    expect(issueLinkState({ state: "closed" })).toBe("closed");
  });
});

describe("pullRequestLinkState", () => {
  it("maps merged, closed, draft and open", () => {
    expect(pullRequestLinkState({ state: "closed", merged: true })).toBe("merged");
    expect(pullRequestLinkState({ state: "closed", merged: false, draft: false })).toBe("closed");
    expect(pullRequestLinkState({ state: "open", draft: true })).toBe("draft");
    expect(pullRequestLinkState({ state: "open", draft: false })).toBe("open");
    expect(pullRequestLinkState({ state: "open" })).toBe("open");
  });

  it("a closed draft is closed, not draft", () => {
    expect(pullRequestLinkState({ state: "closed", draft: true })).toBe("closed");
  });
});
