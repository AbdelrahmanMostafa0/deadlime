import * as chrono from "chrono-node";
import { format } from "date-fns";
import type { Priority, Size } from "./domain";

export type CaptureProject = { id: string; slug: string; name: string };

export type ParsedCapture = {
  title: string;
  projectId: string | null;
  /** The `#word` the user typed (without `#`), even when it matched nothing. */
  projectToken: string | null;
  priority: Priority | null;
  /** yyyy-MM-dd, local. */
  dueDate: string | null;
  /** The text that produced `dueDate` ("next friday"). */
  dueText: string | null;
  size: Size | null;
  labels: string[];
};

const PRIORITY_WORDS: Record<string, Priority> = {
  high: "high",
  h: "high",
  urgent: "high",
  med: "med",
  m: "med",
  medium: "med",
  low: "low",
  l: "low",
};

const SIZE_WORDS: Record<string, Size> = { s: "S", m: "M", l: "L" };

const WEEKDAY = "(?:mon(?:day)?|tue(?:s|sday)?|wed(?:nesday)?|thu(?:r|rs|rsday)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?)";
/** Weekday names that are also ordinary words: only count with a qualifier. */
const AMBIGUOUS_WEEKDAY = /^(?:mon|wed|sat|sun)$/i;

/** Date phrases we trust. Anything else chrono finds without a digit is ignored. */
const SAFE_DATE = new RegExp(
  [
    "^(?:today|tonight|tomorrow|tmrw|tmr)$",
    `^(?:on |next |this |coming )?${WEEKDAY}$`,
    "^in \\d+ (?:day|days|week|weeks)$",
    "^next (?:week|month)$",
    "^in (?:a|one|two|three) (?:day|days|week|weeks)$",
  ].join("|"),
  "i",
);

const DANGLING = new Set(["on", "by", "due", "before", "until", "till", "at", "for", "next", "this"]);

function isTrustedDate(text: string) {
  const t = text.trim();
  if (SAFE_DATE.test(t)) {
    // A bare "sat"/"sun"/"mon"/"wed" is almost always just a word.
    return !AMBIGUOUS_WEEKDAY.test(t);
  }
  // Explicit calendar dates carry digits: "dec 5", "5/12", "2026-12-01", "5th of may".
  const hasDigit = /\d/.test(t);
  const hasMonthOrSep = /[a-z]{3,}|[/.-]/i.test(t);
  return hasDigit && hasMonthOrSep && !/^\d+\s*(?:am|pm)$/i.test(t);
}

function matchProject(token: string, projects: CaptureProject[]): CaptureProject | undefined {
  const q = token.toLowerCase();
  return (
    projects.find((p) => p.slug.toLowerCase() === q) ??
    projects.find((p) => p.slug.toLowerCase().startsWith(q)) ??
    projects.find((p) => p.name.toLowerCase().startsWith(q))
  );
}

/**
 * Parse a quick-capture line like `fix login bug #pharmacy !high tomorrow ~s`.
 * Pure: depends only on its arguments, so it is cheap to run on every keystroke.
 */
export function parseCapture(input: string, projects: CaptureProject[], ref: Date = new Date()): ParsedCapture {
  const out: ParsedCapture = {
    title: "",
    projectId: null,
    projectToken: null,
    priority: null,
    dueDate: null,
    dueText: null,
    size: null,
    labels: [],
  };

  // Pass 1: `#`, `!` and `~` tokens. Everything else stays, with whitespace kept.
  const kept = input.split(/(\s+)/).map((part) => {
    if (!part || /^\s+$/.test(part)) return part;
    const tag = /^#([\p{L}\p{N}_-]+)$/u.exec(part);
    if (tag) {
      const word = tag[1];
      const hit = matchProject(word, projects);
      if (hit && out.projectToken === null) {
        out.projectId = hit.id;
        out.projectToken = word;
      } else if (!hit) {
        const label = word.toLowerCase();
        if (!out.labels.includes(label)) out.labels.push(label);
      }
      return "";
    }
    const prio = /^!([a-z]+)$/i.exec(part);
    if (prio && PRIORITY_WORDS[prio[1].toLowerCase()]) {
      out.priority ??= PRIORITY_WORDS[prio[1].toLowerCase()];
      return "";
    }
    const size = /^~([a-z])$/i.exec(part);
    if (size && SIZE_WORDS[size[1].toLowerCase()]) {
      out.size ??= SIZE_WORDS[size[1].toLowerCase()];
      return "";
    }
    return part;
  });
  let text = kept.join("");

  // Pass 2: the first trustworthy date phrase.
  const refNoon = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate(), 12);
  const hit = chrono.parse(text, refNoon, { forwardDate: true }).find((r) => isTrustedDate(r.text));
  if (hit) {
    out.dueDate = format(hit.start.date(), "yyyy-MM-dd");
    out.dueText = hit.text.trim();
    let before = text.slice(0, hit.index);
    const after = text.slice(hit.index + hit.text.length);
    const words = before.trimEnd().split(/\s+/);
    const last = words[words.length - 1]?.toLowerCase();
    if (last && DANGLING.has(last)) {
      words.pop();
      before = words.join(" ") + " ";
    }
    text = `${before} ${after}`;
  }

  out.title = text.replace(/\s+/g, " ").trim();
  return out;
}
