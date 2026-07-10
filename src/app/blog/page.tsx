import type { Metadata } from "next";

import { ModuleReserved } from "@/ui/ModuleReserved";

const summary =
  "Logs will collect long-form engineering notes about systems, experiments, and the decisions behind them.";

export const metadata: Metadata = {
  title: "Logs",
  description: summary,
};

export default function BlogPage() {
  return (
    <ModuleReserved
      moduleName="Logs"
      nextStep="This route remains reserved until the first authored entries are ready for publication."
      summary={summary}
    />
  );
}
