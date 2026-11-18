// Sarcastic micro-copy, in one place so the voice stays consistent.

const pick = <T,>(items: readonly T[]) => items[Math.floor(Math.random() * items.length)];

export const copy = {
  done: () => pick(["finally.", "look at you.", "one down.", "wow. productive.", "the list shrinks."]),
  undone: () => pick(["back to it, then.", "plot twist.", "un-done. bold."]),
  started: () => pick(["off you go.", "doing it. allegedly.", "the clock is ticking."]),
  deleted: () => pick(["gone. like it never mattered.", "deleted. no witnesses.", "poof."]),
  created: () => pick(["noted.", "on the list.", "captured. now do it."]),
  snoozed: () => pick(["see you later, then.", "snoozed. it will be back."]),
  stale: "oh, you again?",
  wipFull: (count: number, limit: number) => `Doing is full (${count}/${limit}). Finish something, hero.`,
  allSubtasksDone: "Every subtask is ticked. Mark the whole thing done?",
  empty: {
    today: { title: "Nothing due today.", body: "Suspicious. Pull something from This Week or enjoy it while it lasts." },
    week: { title: "This week is empty.", body: "Either you're done or you haven't planned. Press ⌘K and add something." },
    inbox: { title: "Inbox zero.", body: "Everything has a home. Frame this moment." },
    projects: { title: "No projects yet.", body: "Make one. Give it a color. Pretend you'll finish it." },
    column: { title: "Empty.", body: "Drag something here." },
    done: { title: "Nothing done yet.", body: "The bar is on the floor. Step over it." },
  },
  error: "Something broke. Not you. Probably.",
};
