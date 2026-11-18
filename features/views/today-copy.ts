/** Sarcastic subtitle for the Today header, from how much is left. */
export function todaySubtitle(left: number, overdue: number, doneToday: number) {
  if (left === 0) return doneToday > 0 ? "Everything's done. Suspiciously competent." : "Nothing on the list. Enjoy it.";
  if (overdue > 0) return `${overdue} overdue. They noticed you before you noticed them.`;
  if (left === 1) return "One thing. You can do one thing.";
  return "Here's the damage. Pick one and start.";
}
