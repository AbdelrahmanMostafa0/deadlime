import { Plus, Trash2 } from "lucide-react";
import { useFieldArray, type Control, type FieldErrors, type UseFormRegister } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { LINK_KINDS } from "@/lib/domain";
import type { ProjectCreateInput } from "@/lib/validation";
import { LINK_KIND_TEXT } from "./project-meta";

const MAX_LINKS = 12;

export function LinksEditor({
  control,
  register,
  errors,
}: {
  control: Control<ProjectCreateInput>;
  register: UseFormRegister<ProjectCreateInput>;
  errors: FieldErrors<ProjectCreateInput>;
}) {
  const { fields, append, remove } = useFieldArray({ control, name: "links" });

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="label-mono mb-1.5 text-ink">Links</legend>
      {fields.map((field, i) => {
        const urlError = errors.links?.[i]?.url?.message;
        return (
          <div key={field.id} className="flex flex-col gap-2 rounded-card border-2 border-line bg-card-soft p-2.5">
            <div className="flex gap-2">
              <Select aria-label={`Link ${i + 1} kind`} className="w-32 shrink-0" {...register(`links.${i}.kind`)}>
                {LINK_KINDS.map((k) => (
                  <option key={k} value={k}>
                    {LINK_KIND_TEXT[k]}
                  </option>
                ))}
              </Select>
              <Input
                type="url"
                inputMode="url"
                placeholder="https://"
                aria-label={`Link ${i + 1} URL`}
                aria-invalid={!!urlError}
                {...register(`links.${i}.url`)}
              />
              <Button size="icon" variant="ghost" aria-label={`Remove link ${i + 1}`} onClick={() => remove(i)}>
                <Trash2 aria-hidden className="size-5" />
              </Button>
            </div>
            <Input placeholder="Label (optional)" aria-label={`Link ${i + 1} label`} {...register(`links.${i}.label`)} />
            {urlError && (
              <p role="alert" className="text-[13px] font-semibold text-danger">
                {urlError}
              </p>
            )}
          </div>
        );
      })}
      {fields.length < MAX_LINKS && (
        <Button size="sm" className="self-start" onClick={() => append({ kind: "repo", url: "" })}>
          <Plus aria-hidden className="size-4" /> Add link
        </Button>
      )}
    </fieldset>
  );
}
