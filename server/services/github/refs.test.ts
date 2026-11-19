import { describe, expect, it } from "vitest";
import { parseGithubRef } from "./refs";

describe("parseGithubRef", () => {
  it("parses issue and PR URLs, ignoring extra path, query and hash", () => {
    expect(parseGithubRef("https://github.com/o/r/issues/12")).toEqual({
      owner: "o",
      repo: "r",
      kind: "issue",
      number: 12,
    });
    expect(parseGithubRef("https://github.com/o/r/pull/12/files?diff=split#diff-1")).toEqual({
      owner: "o",
      repo: "r",
      kind: "pr",
      number: 12,
    });
    expect(parseGithubRef("  https://www.github.com/o/r.js/pull/3/commits  ")).toEqual({
      owner: "o",
      repo: "r.js",
      kind: "pr",
      number: 3,
    });
  });

  it("parses short forms", () => {
    expect(parseGithubRef("o/r#12")).toEqual({ owner: "o", repo: "r", kind: "unknown-number", number: 12 });
    expect(parseGithubRef("o/r@feat/login")).toEqual({
      owner: "o",
      repo: "r",
      kind: "branch",
      ref: "feat/login",
    });
  });

  it("parses branch URLs, keeping slashes and decoding", () => {
    expect(parseGithubRef("https://github.com/o/r/tree/feat/new%20thing?x=1")).toEqual({
      owner: "o",
      repo: "r",
      kind: "branch",
      ref: "feat/new thing",
    });
  });

  it("rejects anything else", () => {
    for (const bad of [
      "",
      "hello",
      "o/r",
      "o/r#0",
      "o/r#abc",
      "o/r@",
      "http://github.com/o/r/issues/1",
      "https://gitlab.com/o/r/issues/1",
      "https://github.com/o/r",
      "https://github.com/o/r/issues/x",
      "https://github.com/o/r/blob/main/a.ts",
      "https://github.com/-bad/r/issues/1",
      "o/../x#1",
      "o/r#1 extra",
    ])
      expect(parseGithubRef(bad), bad).toBeNull();
  });
});
