import type { Metadata } from "next";

import { ModuleReserved } from "@/ui/ModuleReserved";

const summary =
  "Projects will organize real systems as an explorable archive tree, with each branch tied to evidence and implementation context.";

export const metadata: Metadata = {
  title: "Projects",
  description: summary,
};

export default function ProjectsPage() {
  return (
    <ModuleReserved
      moduleName="Projects"
      nextStep="This route is reserved while verified project records and their supporting material are assembled."
      summary={summary}
    />
  );
}
