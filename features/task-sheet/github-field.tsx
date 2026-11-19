"use client";

import { useState } from "react";
import { Input } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { useLinkTask, useTaskLinks, useUnlinkTask } from "@/features/github/api";
import { toApiError } from "@/lib/api-client";
import type { TaskDTO } from "@/lib/api-types";
import { GithubLinkChip } from "./github-link-chip";

/** Linked issues, PRs and branches. Paste a URL or `owner/repo#12` and press Enter. */
export function GithubField({ task }: { task: TaskDTO }) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string>();
  const links = useTaskLinks(task.id);
  const add = useLinkTask(task.id);
  const remove = useUnlinkTask(task.id);
  const id = `task-github-${task.id}`;

  const submit = () => {
    const ref = text.trim();
    if (!ref || add.isPending) return;
    setError(undefined);
    add.mutate(ref, {
      onSuccess: () => setText(""),
      onError: (e) => setError(toApiError(e).message),
    });
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="label-mono text-ink">GitHub</label>
      {links.isPending ? (
        <div role="status" aria-label="Loading">
          <Skeleton className="h-11" />
        </div>
      ) : links.isError ? (
        <p role="alert" className="text-[13px] font-semibold text-danger">Links didn&apos;t load. {toApiError(links.error).message}</p>
      ) : (
        links.data.length > 0 && (
          <ul className="flex flex-col gap-1.5" aria-label="GitHub links">
            {links.data.map((link) => (
              <GithubLinkChip key={link.id} link={link} onRemove={() => remove.mutate(link.id)} />
            ))}
          </ul>
        )
      )}
      <Input
        id={id}
        value={text}
        disabled={add.isPending}
        autoComplete="off"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        placeholder="paste a GitHub URL or owner/repo#12, press Enter"
        onChange={(e) => {
          setText(e.target.value);
          setError(undefined);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            submit();
          }
        }}
      />
      {error && (
        <p id={`${id}-error`} role="alert" className="text-[13px] font-semibold text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
