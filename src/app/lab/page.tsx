import type { Metadata } from "next";

import { ModuleReserved } from "@/ui/ModuleReserved";

const summary =
  "Lab will isolate visual experiments, interaction prototypes, and small engineering tools from the core archive.";

export const metadata: Metadata = {
  title: "Lab",
  description: summary,
};

export default function LabPage() {
  return (
    <ModuleReserved
      moduleName="Lab"
      nextStep="This route remains reserved while bounded experiments are prepared for public use."
      summary={summary}
    />
  );
}
