import { expect, it } from "vitest";
import { safeNext } from "./auth-redirect";

it("preserves local destinations including signed consent queries", () => {
  expect(safeNext("/oauth/consent?client_id=x&sig=abc")).toBe("/oauth/consent?client_id=x&sig=abc");
});
it("rejects off-origin, backslash and control-character destinations", () => {
  for (const value of [null, "https://evil.test", "//evil.test", "/\\evil.test", "/\n/evil.test"]) {
    expect(safeNext(value)).toBe("/today");
  }
});
