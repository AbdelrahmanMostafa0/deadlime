import { PageHeader } from "@/components/shell/app-shell";

export default async function Page({ params }: PageProps<"/projects/[id]">) {
  const { id } = await params;
  return <PageHeader title="Project" subtitle={id} />;
}
