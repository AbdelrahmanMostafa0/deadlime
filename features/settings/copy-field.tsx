"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";

type CopyFieldProps = { label: string; value: string };

/** Read-only monospace value with a copy button. */
export function CopyField({ label, value }: CopyFieldProps) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Couldn't copy. Select it and copy by hand.");
    }
  };

  return (
    <div className="flex items-stretch gap-2">
      <code
        aria-label={label}
        className="min-w-0 flex-1 overflow-x-auto rounded-btn border-2 border-ink bg-paper-2 px-3 py-2.5 font-mono text-[13px] whitespace-nowrap"
      >
        {value}
      </code>
      <Button size="icon" onClick={copy} aria-label={copied ? "Copied" : `Copy ${label}`}>
        {copied ? <Check aria-hidden className="size-5" /> : <Copy aria-hidden className="size-5" />}
      </Button>
    </div>
  );
}
