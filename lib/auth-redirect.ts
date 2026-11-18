/** Only allow same-site relative paths as the post-login destination. */
export function safeNext(next: string | null) {
  return next && next.startsWith("/") && !next.startsWith("//") && !/[\\\x00-\x1f\x7f]/.test(next)
    ? next
    : "/today";
}
