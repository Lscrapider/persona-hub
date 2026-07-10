import { getArchiveSection } from "@/content/archive";
import { ArchiveSection } from "@/features/archive/ArchiveSection";

type LogsSectionProps = Readonly<{
  revealEnabled: boolean;
}>;

export function LogsSection({ revealEnabled }: LogsSectionProps) {
  return (
    <ArchiveSection
      className="logs-section"
      definition={getArchiveSection("logs")}
      revealEnabled={revealEnabled}
    >
      <div aria-hidden="true" className="archive-section__trace archive-section__trace--logs" />
    </ArchiveSection>
  );
}
