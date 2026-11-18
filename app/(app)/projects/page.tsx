import type { Metadata } from "next";
import { ProjectsOverview } from "@/features/projects/projects-overview";

export const metadata: Metadata = { title: "Projects" };

export default function Page() {
  return <ProjectsOverview />;
}
