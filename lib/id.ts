/** Client-safe unique id (≤ 40 chars). `crypto.randomUUID` needs a secure context, so fall back. */
export function newId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}
