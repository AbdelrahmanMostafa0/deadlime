// Small dependency-free fuzzy matcher for task titles.
// Scores: whole-phrase substring > every word present > word prefixes > subsequence.

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

function isSubsequence(needle: string, hay: string) {
  let i = 0;
  for (const ch of hay) if (ch === needle[i]) i++;
  return i === needle.length;
}

/** 0 = no match, higher = better. */
export function fuzzyScore(query: string, title: string): number {
  const q = norm(query);
  const t = norm(title);
  if (!q) return 0;
  if (t === q) return 100;
  if (t.includes(q)) return 80 - Math.min(20, t.length - q.length) / 2;

  const words = q.split(" ").filter((w) => w.length > 1);
  if (!words.length) return 0;
  const titleWords = t.split(" ");
  let hits = 0;
  let prefixHits = 0;
  for (const w of words) {
    if (t.includes(w)) hits++;
    else if (titleWords.some((tw) => tw.startsWith(w.slice(0, Math.max(3, w.length - 2))))) prefixHits++;
  }
  const coverage = (hits + prefixHits * 0.6) / words.length;
  if (coverage >= 0.5) return 30 + coverage * 40;
  if (isSubsequence(q.replace(/ /g, ""), t.replace(/ /g, ""))) return 15;
  return 0;
}

export function fuzzyRank<T>(query: string, items: T[], getText: (item: T) => string, limit = 10) {
  return items
    .map((item) => ({ item, score: fuzzyScore(query, getText(item)) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
