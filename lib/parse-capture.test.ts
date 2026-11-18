import { describe, expect, it } from "vitest";
import { parseCapture, type CaptureProject } from "./parse-capture";

// Wednesday 18 Nov 2026.
const REF = new Date(2026, 10, 18, 9, 30);
const projects: CaptureProject[] = [
  { id: "p-pharm", slug: "pharmacy", name: "Pharmacy App" },
  { id: "p-port", slug: "portfolio", name: "My Portfolio" },
  { id: "p-deadlime", slug: "dl", name: "Deadlime" },
];
const parse = (s: string) => parseCapture(s, projects, REF);

describe("parseCapture", () => {
  it("parses the full example", () => {
    expect(parse("fix login bug #pharmacy !high tomorrow")).toEqual({
      title: "fix login bug",
      projectId: "p-pharm",
      projectToken: "pharmacy",
      priority: "high",
      dueDate: "2026-11-19",
      dueText: "tomorrow",
      size: null,
      labels: [],
    });
  });

  it("returns only a title for plain text", () => {
    const r = parse("  buy   milk ");
    expect(r.title).toBe("buy milk");
    expect(r.projectId).toBeNull();
    expect(r.dueDate).toBeNull();
  });

  it("returns an empty title for empty input", () => {
    expect(parse("").title).toBe("");
    expect(parse("   ").title).toBe("");
  });

  describe("projects", () => {
    it("matches slug prefix case-insensitively", () => {
      expect(parse("x #PHARM").projectId).toBe("p-pharm");
    });
    it("matches exact slug before a prefix of another", () => {
      expect(parse("x #dl").projectId).toBe("p-deadlime");
    });
    it("matches name prefix", () => {
      expect(parse("x #deadl").projectId).toBe("p-deadlime");
    });
    it("turns an unknown #word into a label", () => {
      const r = parse("call mum #family #Family");
      expect(r.projectId).toBeNull();
      expect(r.labels).toEqual(["family"]);
      expect(r.title).toBe("call mum");
    });
    it("works anywhere in the text", () => {
      expect(parse("#port redesign hero").title).toBe("redesign hero");
    });
    it("keeps the first matching project", () => {
      expect(parse("x #pharm #port").projectId).toBe("p-pharm");
    });
  });

  describe("priority", () => {
    it.each([
      ["!high", "high"],
      ["!h", "high"],
      ["!urgent", "high"],
      ["!med", "med"],
      ["!m", "med"],
      ["!low", "low"],
      ["!l", "low"],
      ["!HIGH", "high"],
    ])("%s -> %s", (token, expected) => {
      expect(parse(`task ${token}`).priority).toBe(expected);
    });
    it("leaves unknown !words in the title", () => {
      const r = parse("wow !amazing");
      expect(r.priority).toBeNull();
      expect(r.title).toBe("wow !amazing");
    });
  });

  describe("size", () => {
    it.each([
      ["~s", "S"],
      ["~m", "M"],
      ["~L", "L"],
    ])("%s -> %s", (token, expected) => {
      expect(parse(`task ${token}`).size).toBe(expected);
    });
    it("ignores unknown sizes", () => {
      expect(parse("task ~xl").title).toBe("task ~xl");
    });
  });

  describe("dates", () => {
    it("today", () => expect(parse("call dentist today").dueDate).toBe("2026-11-18"));
    it("tonight", () => expect(parse("laundry tonight").dueDate).toBe("2026-11-18"));
    it("tomorrow in the middle of text", () => {
      const r = parse("send tomorrow invoice");
      expect(r.dueDate).toBe("2026-11-19");
      expect(r.title).toBe("send invoice");
    });
    it("bare weekday looks forward", () => {
      expect(parse("review fri").dueDate).toBe("2026-11-20");
      expect(parse("review friday").dueDate).toBe("2026-11-20");
    });
    it("the weekday that is today means today", () => {
      expect(parse("standup wednesday").dueDate).toBe("2026-11-18");
    });
    it("next <weekday>", () => {
      const r = parse("plan next monday");
      expect(r.dueDate).toBe("2026-11-23");
      expect(r.title).toBe("plan");
    });
    it("in N days", () => {
      const r = parse("renew passport in 3 days");
      expect(r.dueDate).toBe("2026-11-21");
      expect(r.title).toBe("renew passport");
    });
    it("explicit month and day", () => {
      expect(parse("pay rent dec 5").dueDate).toBe("2026-12-05");
    });
    it("past explicit date rolls forward", () => {
      expect(parse("taxes jan 10").dueDate).toBe("2027-01-10");
    });
    it("strips a dangling preposition", () => {
      expect(parse("ship it by friday").title).toBe("ship it");
      expect(parse("ship it on friday").title).toBe("ship it");
    });
    it("does not treat 'may' or 'march' as dates", () => {
      expect(parse("you may proceed").dueDate).toBeNull();
      expect(parse("you may proceed").title).toBe("you may proceed");
      expect(parse("march to the beat").dueDate).toBeNull();
    });
    it("does not treat bare sat/sun/mon/wed as dates", () => {
      expect(parse("the cat sat down").dueDate).toBeNull();
      expect(parse("sun cream").dueDate).toBeNull();
    });
    it("does not treat times or plain numbers as dates", () => {
      expect(parse("meeting 5pm").dueDate).toBeNull();
      expect(parse("buy 3 apples").dueDate).toBeNull();
    });
    it("handles a leap into the next year", () => {
      const r = parseCapture("x tomorrow", projects, new Date(2026, 11, 31, 22));
      expect(r.dueDate).toBe("2027-01-01");
    });
  });

  it("combines every token", () => {
    const r = parse("#pharm write tests ~m !low next friday #qa");
    expect(r).toEqual({
      title: "write tests",
      projectId: "p-pharm",
      projectToken: "pharm",
      priority: "low",
      dueDate: "2026-11-27",
      dueText: "next friday",
      size: "M",
      labels: ["qa"],
    });
  });
});
