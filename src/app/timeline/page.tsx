import type { Metadata } from "next";

import { ModuleReserved } from "@/ui/ModuleReserved";

const summary =
  "Timeline will map verified stages of work and learning into a chronological path.";

export const metadata: Metadata = {
  title: "Timeline",
  description: summary,
};

export default function TimelinePage() {
  return (
    <ModuleReserved
      moduleName="Timeline"
      nextStep="This route remains reserved until the underlying milestones and source material are ready."
      summary={summary}
    />
  );
}
