import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { CopyField } from "./copy-field";

type ConnectClaudeProps = { mcpUrl: string };

const isLocal = (url: string) => /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:|\/)/.test(url);

const Step = ({ n, children }: { n: number; children: ReactNode }) => (
  <li className="flex gap-3">
    <span
      aria-hidden
      className="grid size-7 shrink-0 place-items-center rounded-full border-2 border-ink bg-lime font-mono text-xs font-bold"
    >
      {n}
    </span>
    <div className="flex min-w-0 flex-1 flex-col gap-2.5 pt-0.5 text-sm leading-relaxed">{children}</div>
  </li>
);

/** How to plug Claude into this workspace over MCP. */
export function ConnectClaude({ mcpUrl }: ConnectClaudeProps) {
  const local = isLocal(mcpUrl);
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card className="flex flex-col gap-4 p-5">
        <div>
          <h3 className="font-display-tight text-lg font-extrabold">Claude app</h3>
          <p className="text-sm text-ink-2">claude.ai, desktop and mobile.</p>
        </div>
        {local && (
          <p role="note" className="rounded-btn border-2 border-ink bg-sun/40 p-3 text-sm">
            This only works on the deployed site. Claude&apos;s servers can&apos;t reach your localhost. Use
            Claude Code for local testing.
          </p>
        )}
        <ol className="flex flex-col gap-3">
          <Step n={1}>
            <p>
              Open <strong>Settings → Connectors → Add custom connector</strong>.
            </p>
          </Step>
          <Step n={2}>
            <p>
              Name it <strong>Deadlime</strong> and paste this URL. Leave the client ID and secret empty.
            </p>
            <CopyField label="MCP server URL" value={mcpUrl} />
          </Step>
          <Step n={3}>
            <p>
              Click <strong>Connect</strong>, sign in here, and hit <strong>Allow</strong>.
            </p>
          </Step>
        </ol>
      </Card>

      <Card className="flex flex-col gap-4 p-5">
        <div>
          <h3 className="font-display-tight text-lg font-extrabold">Claude Code</h3>
          <p className="text-sm text-ink-2">The terminal one. Works with localhost too.</p>
        </div>
        <ol className="flex flex-col gap-3">
          <Step n={1}>
            <p>Add the server from your terminal:</p>
            <CopyField
              label="Claude Code command"
              value={`claude mcp add --transport http deadlime ${mcpUrl}`}
            />
          </Step>
          <Step n={2}>
            <p>
              In Claude Code, run <code className="font-mono">/mcp</code>, pick <strong>deadlime</strong>,
              then <strong>Authenticate</strong>. A browser tab opens: sign in and hit <strong>Allow</strong>.
            </p>
          </Step>
        </ol>
      </Card>

      <Card tone="paper" className="p-5 lg:col-span-2">
        <h3 className="font-display-tight text-lg font-extrabold">Then try</h3>
        <ul className="mt-2 flex flex-col gap-1.5 text-sm text-ink-2">
          <li>&ldquo;What&apos;s due today?&rdquo;</li>
          <li>&ldquo;Add three tasks to #taanaq: fix login, write docs, ship.&rdquo;</li>
          <li>&ldquo;I finished the login bug. Mark it done.&rdquo;</li>
          <li>&ldquo;Run my Sunday review.&rdquo;</li>
        </ul>
        <p className="mt-3 text-xs text-ink-3">
          Changes Claude makes show up in each task&apos;s activity as &ldquo;via Claude&rdquo;.
        </p>
      </Card>
    </div>
  );
}
