"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useId } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import type { ProjectDTO } from "@/lib/api-types";
import { copy } from "@/lib/copy";
import { projectCreateSchema, type ProjectCreateInput } from "@/lib/validation";
import { useCreateProject, useUpdateProject } from "./api";
import { ColorPicker } from "./color-picker";
import { IconPicker } from "./icon-picker";
import { LinksEditor } from "./links-editor";
import { colorAt, slugify } from "./project-meta";
import { StatusControl } from "./status-control";

function defaults(project: ProjectDTO | null | undefined, colorIndex: number): ProjectCreateInput {
  if (!project) return { name: "", slug: "", color: colorAt(colorIndex), icon: "folder", status: "active", links: [], notes: "" };
  return {
    name: project.name,
    slug: project.slug,
    color: project.color,
    icon: project.icon,
    status: project.status,
    links: project.links.map((l) => ({ kind: l.kind, url: l.url, label: l.label ?? "" })),
    notes: project.notes,
  };
}

type Props = { project?: ProjectDTO | null; colorIndex?: number; onDone: () => void };

export function ProjectForm({ project, colorIndex = 0, onDone }: Props) {
  const uid = useId();
  const create = useCreateProject();
  const update = useUpdateProject();
  const {
    register,
    control,
    handleSubmit,
    setValue,
    getFieldState,
    formState: { errors, isSubmitting },
  } = useForm<ProjectCreateInput>({
    resolver: zodResolver(projectCreateSchema),
    defaultValues: defaults(project, colorIndex),
  });

  const submit = handleSubmit(async (values) => {
    const input = { ...values, links: (values.links ?? []).map((l) => ({ ...l, label: l.label || undefined })) };
    try {
      if (project) await update.mutateAsync({ id: project.id, patch: input });
      else {
        await create.mutateAsync(input);
        toast(copy.created());
      }
    } catch {
      return; // the mutation hooks already toast the error; keep the sheet open
    }
    onDone();
  });

  const nameField = register("name", {
    onChange: (e: { target: { value: string } }) => {
      if (!project && !getFieldState("slug").isDirty) setValue("slug", slugify(e.target.value));
    },
  });

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5 px-5 pt-2 pb-6">
      <Field id={`${uid}-name`} label="Name" error={errors.name?.message}>
        <Input id={`${uid}-name`} autoComplete="off" aria-invalid={!!errors.name} {...nameField} />
      </Field>
      <Field id={`${uid}-slug`} label="Handle" hint="Used as #handle in quick capture." error={errors.slug?.message}>
        <Input
          id={`${uid}-slug`}
          autoCapitalize="none"
          autoComplete="off"
          spellCheck={false}
          aria-invalid={!!errors.slug}
          {...register("slug", { setValueAs: (v: string) => v.trim().toLowerCase() || undefined })}
        />
      </Field>
      <div className="flex flex-col gap-1.5">
        <span className="label-mono text-ink">Color</span>
        <Controller control={control} name="color" render={({ field }) => <ColorPicker name={`${uid}-color`} value={field.value} onChange={field.onChange} />} />
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="label-mono text-ink">Icon</span>
        <Controller control={control} name="icon" render={({ field }) => <IconPicker name={`${uid}-icon`} value={field.value ?? "folder"} onChange={field.onChange} />} />
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="label-mono text-ink">Status</span>
        <Controller control={control} name="status" render={({ field }) => <StatusControl name={`${uid}-status`} value={field.value ?? "active"} onChange={field.onChange} />} />
      </div>
      <LinksEditor control={control} register={register} errors={errors} />
      <Field id={`${uid}-notes`} label="Notes" error={errors.notes?.message}>
        <Textarea id={`${uid}-notes`} rows={5} {...register("notes")} />
      </Field>
      <Button type="submit" variant="lime" size="lg" disabled={isSubmitting}>
        {project ? "Save changes" : "Create project"}
      </Button>
    </form>
  );
}
