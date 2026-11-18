"use client";

import { useId, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Textarea } from "@/components/ui/field";
import { useCreateProject } from "./api";
import { colorAt, slugify } from "./project-meta";

/** Turns "one name per line" into unique slugs, so a batch never collides with itself. */
function toDrafts(text: string) {
  const seen = new Set<string>();
  return text
    .split(/\n|,/)
    .map((n) => n.trim())
    .filter(Boolean)
    .slice(0, 20)
    .map((name, i) => {
      const base = slugify(name) || `project-${i + 1}`;
      let slug = base;
      for (let n = 2; seen.has(slug); n++) slug = `${base.slice(0, 28)}-${n}`;
      seen.add(slug);
      return { name: name.slice(0, 60), slug, color: colorAt(i) };
    });
}

/** Bulk create: one name per line, colors assigned in palette order. Details can be edited later. */
export function FirstRunSetup() {
  const id = useId();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const create = useCreateProject();
  const drafts = toDrafts(text);

  const submit = async () => {
    setBusy(true);
    let made = 0;
    for (const draft of drafts) {
      try {
        await create.mutateAsync(draft);
        made += 1;
      } catch {
        break; // the hook already toasted the reason
      }
    }
    setBusy(false);
    if (made > 0) {
      setText("");
      toast(`${made} project${made === 1 ? "" : "s"} created.`);
    }
  };

  return (
    <Card tone="sun" className="p-4 md:p-5">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
        className="flex flex-col gap-3"
      >
        <h2 className="font-display-tight text-xl font-extrabold">Set up your projects</h2>
        <Field id={id} label="Names" hint="One per line (or comma separated). Each gets its own color. Tweak icons and links later.">
          <Textarea id={id} rows={5} value={text} onChange={(e) => setText(e.target.value)} />
        </Field>
        <Button type="submit" variant="ink" className="self-start" disabled={busy || drafts.length === 0}>
          {busy ? "Creating..." : `Create ${drafts.length || ""} project${drafts.length === 1 ? "" : "s"}`}
        </Button>
      </form>
    </Card>
  );
}
