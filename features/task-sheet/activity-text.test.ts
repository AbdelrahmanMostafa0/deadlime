import { describe, expect, it } from "vitest";
import { RULES } from "@/lib/domain";
import { describeActivity, RULE_LABEL } from "./activity-text";

describe("RULE_LABEL", () => {
  it("has human text for every rule", () => {
    for (const rule of RULES) expect(RULE_LABEL[rule]).toMatch(/^Auto: /);
    expect(RULE_LABEL.done_moves_to_done).toBe("Auto: marked done → moved to Done");
  });
});

describe("describeActivity", () => {
  it("names the destination column of a move", () => {
    expect(describeActivity({ action: "moved", meta: { from: "backlog", to: "doing" } })).toBe("Moved to Doing");
    expect(describeActivity({ action: "moved", meta: { to: "nonsense" } })).toBe("Moved");
  });

  it("lists edited fields and skips unknown ones", () => {
    expect(describeActivity({ action: "updated", meta: { fields: ["title", "labels", "force", 3] } })).toBe(
      "Edited title, labels",
    );
    expect(describeActivity({ action: "updated", meta: {} })).toBe("Edited");
  });

  it("maps simple actions and falls back to a capitalized action", () => {
    expect(describeActivity({ action: "completed", meta: {} })).toBe("Marked done");
    expect(describeActivity({ action: "snoozed_forever", meta: {} })).toBe("Snoozed forever");
  });
});
