# Deadlime

A mobile-first project and task manager with attitude. One place for every project, its tasks and the weekly focus, with sarcastic micro-copy, springy motion, and an MCP server so Claude can update the board for you.

Stack: Next.js 16 (App Router, Cache Components) · React 19 · TypeScript · Tailwind v4 · TanStack Query · Zustand · dnd-kit · cmdk · Tiptap · Motion · Drizzle + Neon Postgres · Better Auth (Google, GitHub) · Sentry · mcp-handler.

---

## Getting started

### 1. What you need to provide

Copy `.env.example` to `.env.local` and fill it in. Every key has a comment saying where to get it.

| Service | Keys | Required |
| --- | --- | --- |
| Neon (Postgres) | `DATABASE_URL` (pooled), `DATABASE_URL_UNPOOLED` (direct, for migrations) | yes |
| Better Auth | `BETTER_AUTH_SECRET` (`openssl rand -base64 32`), `BETTER_AUTH_URL` | yes |
| Google Cloud Console | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, redirect `<APP_URL>/api/auth/callback/google` | yes |
| GitHub OAuth app | `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, callback `<APP_URL>/api/auth/callback/github` | yes |
| Sentry | `NEXT_PUBLIC_SENTRY_DSN`, plus `SENTRY_AUTH_TOKEN` / `SENTRY_ORG` / `SENTRY_PROJECT` for source maps on Vercel | optional |

Not needed for V1, so they're not in `.env.example`: Resend, Cloudflare R2, Vercel Cron, the GitHub App and PostHog. Each comes back with the feature that needs it.

### 2. Run it

```bash
npm install
npm run db:migrate   # applies db/migrations to the database in DATABASE_URL_UNPOOLED
npm run dev
```

`drizzle-kit` reads `DATABASE_URL_UNPOOLED` from the shell environment, so export it first (for example `vercel env pull` and then export it, or set it inline).

### 3. Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` / `build` / `start` | Next.js |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint (Next core-web-vitals + TypeScript) |
| `npm test` | Vitest unit tests (automations, capture parser, helpers) |
| `npm run db:generate` | Generate a migration from `db/schema.ts` |
| `npm run db:migrate` | Apply migrations |
| `npm run format` | Prettier with the Tailwind class sorter |

---

## Project map

```
app/
  (app)/            authenticated screens: today, week, inbox, board, projects, review
  api/              REST route handlers (thin: parse → service → JSON)
  sign-in/          OAuth sign-in
components/
  ui/               design-system primitives (Button, Card, tags, Sheet, CheckButton, Field…)
  shell/            app shell: sidebar (desktop), bottom nav (mobile), global overlays
features/           one folder per feature: UI + hooks + pure helpers, colocated
  board/ capture/ projects/ task-sheet/ tasks/ views/ week/ auth/
server/
  api.ts            route() wrapper: auth, same-origin check, timezone, error mapping
  services/         ALL business logic + DB access, shared by REST and MCP
db/                 Drizzle schema (auth + app) and migrations
lib/                shared, framework-free code: domain vocabulary, automations, validation, dates, parser
stores/ui.ts        Zustand: UI-only state (palette open, task being edited)
```

---

## Design system: "Citrus Playground"

The Claude Design canvas was used as a reference, not copied pixel for pixel. The tokens live in `app/globals.css` (`@theme`) and every component uses them.

- **Palette:** paper `#FFF8EC`, ink `#1E1B18`, lime `#B8F23A`, tangerine `#FF8A3D`, pink `#FF4F9A`, plus sky, lilac and sun for project colors.
- **Type:** Unbounded (display), DM Sans (UI), JetBrains Mono (labels, tags, kbd). All loaded through `next/font`.
- **Shape:** 2px ink outlines, hard offset "pop" shadows (`shadow-pop-*`), big radii (`rounded-card`, `rounded-panel`, `rounded-sheet`).
- **Motion:** spring easing (`--ease-spring`). Cards lift and tilt on hover and buttons squish on press. Overdue cards go `sour`: desaturated, with a slight wobble. All motion respects `prefers-reduced-motion`.
- **Primitives:** `Button` (pill), `Card`/`Panel`, `Chip`, `PriorityTag`, `SizeTag`, `Sticker`, `Kbd`, `CheckButton`, `Field`/`Input`/`Select`/`Textarea`, `Sheet`, `EmptyState`/`ErrorState`, `Skeleton`, `toastUndo`.
- **Voice:** sarcastic micro-copy lives in `lib/copy.ts`, so the tone stays in one place.

---

## Engineering decisions

Each decision lists what was chosen, what was rejected, and why. Tags show who proposed or challenged it:

- **[Claude]:** the orchestrating agent.
- **[Codex]:** OpenAI Codex, used as an architecture reviewer and as the MCP implementer.
- **[agent]:** a feature sub-agent.

### Product scope

1. **Open sign-up instead of a single allowed email.** *Owner request.*
   - Any Google or GitHub account can sign in and gets its own empty workspace. `ALLOWED_EMAIL` was removed.
   - Consequences:
     - Every domain table (`project`, `task`, `week_plan`, `activity_log`) has a `user_id` foreign key, and every query is scoped by it in the service layer.
     - Payload sizes and per-user counts are capped (100 projects, 5,000 tasks, bounded strings and arrays in `lib/validation.ts`), because strangers can now write to the database.
   - **Rejected: Postgres row-level security.** It's a stronger guarantee, but with neon-http and Better Auth it means setting a per-request role/GUC on every query. One service layer that always receives an authenticated `Actor` is simpler and easy to audit. [Claude; Codex agreed and suggested isolation tests as the follow-up.]
2. **V1 only.** The content pipeline, GitHub integration, recurring tasks, calendar and dashboard are V2, so their services (Resend, R2, Cron, GitHub App) aren't wired up yet.

### Architecture

3. **One service layer (`server/services/*`) shared by REST and MCP. REST route handlers + axios + TanStack Query on the client.**
   - **Rejected: Server Actions.** The MCP tools need the same logic outside React, and TanStack Query gives optimistic updates, rollback, cache invalidation and Undo out of the box.
   - Route handlers are thin: `route()` in `server/api.ts` does auth, the same-origin check, "today" in the user's time zone, and error mapping. [Claude; Codex agreed.]
4. **Automations are one pure function, `applyTaskRules(before, patch, {now, today})`.**
   - The task service runs it before every write and logs each fired rule to `activity_log.rule`.
   - The client runs the same function for optimistic updates, so a card lands in the right column before the server answers.
   - It's unit-tested in `lib/automations.test.ts`.
   - Explicit intents (`completed`, `start`) take priority over field changes. An explicit `status` (a drag) beats the derived rules.
   - **Rejected: database triggers.** They're invisible to the client and can't drive optimistic UI. [Claude; Codex asked for explicit intent and context instead of a bare patch, which is reflected in the signature.]
5. **"Today" is computed in the user's time zone.** The browser sends `x-timezone` and MCP tools take a `timezone` argument. Dates are stored as plain `date` values (`yyyy-MM-dd`).
   - **Rejected: UTC "today".** "Due today" would be wrong for anyone not in UTC after midnight.
6. **Pages are thin server components; data is fetched on the client with TanStack Query.**
   - With `cacheComponents`, the session read happens inside `<Suspense>` in `app/(app)/layout.tsx`. `proxy.ts` only does an optimistic cookie check, and every API call is authenticated again.
   - **Rejected for V1: RSC prefetch + hydration.** It adds complexity, and nearly every screen is interactive and per-user anyway. [Claude; Codex agreed.]
7. **The DB and auth clients are lazy (`getDb()`, `getAuth()`), and env is validated on first use with zod.** `next build` succeeds with no secrets, and a missing variable gives a clear error that names it.

### Data

8. **Subtasks and labels are `jsonb` arrays on the task row.**
   - They're always loaded with the task, updated atomically, and give MCP a simple shape.
   - **Rejected: separate tables.** That means extra joins for no V1 query that needs them. The arrays are capped (50 subtasks, 12 labels), so the rows stay small. [Claude; Codex agreed.]
9. **Board order is an integer position, and a move rewrites the destination column in one batch.**
   - **Rejected: floating-point midpoints.** The original plan was a midpoint `double`. Codex pointed out that midpoints lose precision after repeated inserts in the same gap and need renormalising, while boards here hold tens of cards. [Codex challenged, Claude changed it.]
10. **Task descriptions are stored as Tiptap JSON** (`task.description jsonb`). `lib/rich-text.ts` converts it to and from plain text without a DOM, for MCP and search.
    - **Rejected: storing HTML,** which needs a server-side sanitiser (a new dependency) and is an XSS risk.
    - **Rejected: Markdown,** which needs a Tiptap markdown extension that isn't on the approved list. [Codex challenged HTML, Claude changed it.]
11. **Tasks are soft-deleted** (`deleted_at`). Delete becomes reversible, so the UI can offer Undo instead of a confirm dialog, as the spec asks.
12. **The week plan stores a frozen review snapshot** (`review_snapshot jsonb`).
    - "Done / slipped / carried over" are computed live while you review, then frozen when you close the week, so later edits can't rewrite history.
    - **Rejected: recomputing from current task state.** Codex noted it can't reliably reconstruct "not done by week end". [Codex challenged, Claude changed it.]
13. **neon-http driver plus `db.batch()`** for multi-statement writes (change + activity row), which Neon runs as one transaction.
    - **Codex recommended `neon-serverless`** (WebSocket pool) for real interactive read-then-write transactions.
    - **Kept neon-http:** each request is one HTTP round trip with no pool to manage on serverless, and the remaining race (read, rule, write) only matters for concurrent edits of the same task by the same user. Last write wins and is acceptable for V1. [Disagreement, documented.]
14. **The WIP limit is enforced on the server.** It returns 409 `wip_limit`, and the client offers "Do it anyway" (`force: true`). Waiting doesn't count.
    - **Rejected: a client-only check.** Claude (MCP) would bypass it.
    - Codex noted that admission isn't serialised per user; two simultaneous starts can exceed the limit by one. Accepted for a personal tool.

### UI

15. **No shadcn/ui yet. Native `<dialog>` for sheets and modals.**
    - The spec allows shadcn restyled heavily. What V1 actually needs is a modal sheet, a command palette (cmdk) and selects.
    - The native `<dialog>` gives focus trap, Esc, inert background and top-layer stacking with zero dependencies, and the design restyles everything anyway.
    - shadcn/Radix can still be added later for menus and popovers.
16. **Toasts follow the open dialog.**
    - A modal `<dialog>` makes the page inert, so Undo toasts from the page toaster were unclickable while a sheet was open.
    - `lib/toast.ts` routes toasts to a second toaster mounted inside the open `Sheet`.
    - **Rejected: non-modal dialogs,** which lose the focus trap. [agent found the problem, Claude generalised the fix.]
17. **Undo everywhere, no confirm dialogs.**
    - Every move, done and delete shows `toastUndo`.
    - For an update, Undo sends the inverse patch with the previous explicit status and `force: true`.
    - For a delete, Undo calls `/restore`.
    - Text edits are `silent` (no toast per keystroke). A due-date change or a subtask tick only shows Undo when it would trigger an automation, decided by running the same rules function. [agent]
18. **Mobile gestures:**
    - Swipe right on a card = done, swipe left = snooze to tomorrow (motion drag).
    - On the board, touch users drag from a handle (200ms long press) so swipes and scrolling still work. Mouse users drag the whole card.
    - Swipe vs. drag is decided by `(pointer: fine)`, not screen width.
    - Mobile shows one board column at a time with scroll-snap and tabs.
    - Every card also has a non-drag "Move to…" control for keyboard and touch. [agent]
19. **The board's project filter runs on the client.** The reorder API needs the full order of the destination column. With a filter on, the moved card is placed next to its visible neighbours and hidden cards keep their order.
    - **Rejected: server-side filtering.** It would send back an order list that silently reshuffles other projects' cards. [agent]
20. **Quick-capture parser (`lib/parse-capture.ts`):**
    - `#project` matches a project handle or name by prefix. An unknown `#word` becomes a label.
    - `!high|med|low` sets priority and `~s|m|l` sets size.
    - Dates use chrono's casual parser plus an allowlist (today/tomorrow, weekdays, "in N days", explicit dates with a digit). Strict mode drops "tomorrow", and casual alone turns "may" or "march" in a title into dates.
    - It's covered by 37 unit tests.
    - Enter creates in This Week, Shift+Enter in Backlog, and a task with no project lands in Inbox. [agent]
21. **Global shortcuts:**
    - ⌘K / Ctrl+K toggles the palette and `c` opens it.
    - `g` then `t/w/i/b/p/r` jumps to a screen.
    - Single-key shortcuts are ignored while typing or while a dialog is open. [agent]
22. **The task editor keeps a draft only while you type.**
    - Text fields hold local state while focused and show the server/cache value otherwise, so an Undo from elsewhere appears immediately without `useEffect` syncing.
    - Notes autosave 800ms after you stop typing, plus on blur and on close.
    - **Rejected: react-hook-form for the editor.** A form copy goes stale against optimistic updates. It's still used for the project form. [agent]
23. **Rule-fired moves are visible.** The task's activity log shows "Auto: marked done → moved to Done", and a "via Claude" badge for MCP changes. This covers the spec's "each card shows which rule moved it".
24. **Stale projects** (active, no activity for 14+ days) get the "oh, you again?" treatment in the sidebar and on project cards. [agent]

### Security

25. **Same-origin check on every mutating API call, on top of Better Auth's SameSite cookies.** Post-login redirects only accept same-site relative paths. [Codex flagged CSRF for open sign-up.]
26. **The sign-out clears the TanStack Query cache,** so one account's data never flashes for the next. [Codex flagged it.]
27. **No secrets in the repo or the build.** Only `.env.example` is committed. Sentry and the database are initialised only when their env exists.

### Tooling

28. **Sentry is opt-in.** `instrumentation.ts` and `instrumentation-client.ts` initialise only when `NEXT_PUBLIC_SENTRY_DSN` is set, and source maps upload only when `SENTRY_AUTH_TOKEN` exists. Route and global error boundaries report to it.
29. **Tests cover the logic that can silently break:** the automation rules, the capture parser, the date and week helpers, the board ordering, and the task-sheet helpers. UI is checked by typecheck and lint. End-to-end tests are a follow-up.
30. **Parallel development:** the foundation (schema, services, automations, design system, shell) was built first so each feature branch shared the same contracts. Five features were then built in parallel git worktrees by sub-agents and merged; the only conflict was the one-line overlay mount.

---

## Known follow-ups

- **End-to-end tests:** Playwright for capture → board → done, and user-isolation tests across REST and MCP.
- **`placeholderData` for task detail:** done. Next is optimistic create in the palette (it currently waits for the server, about 1 round trip).
- **Popover "Move to…" menu:** the native `<select>` fires on arrow keys in some desktop browsers.
- **Board drag correction:** dnd-kit's "below the hovered card" correction for smoother cross-column drags.
- **Lighthouse mobile pass:** run it against the deployed build. The spec's target is 90+.
