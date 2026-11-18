export const MAX_LABELS = 12;
const MAX_LABEL_LENGTH = 30;

/** Same shape the server stores: trimmed, lowercase, no leading "#". */
export function normalizeLabel(raw: string) {
  return raw.trim().replace(/^#+/, "").trim().toLowerCase().slice(0, MAX_LABEL_LENGTH);
}

/** Returns the same array when nothing changes (empty, duplicate, or full). */
export function addLabel(labels: string[], raw: string): string[] {
  const label = normalizeLabel(raw);
  if (!label || labels.includes(label) || labels.length >= MAX_LABELS) return labels;
  return [...labels, label];
}
