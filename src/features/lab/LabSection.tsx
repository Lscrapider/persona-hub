import { ArchiveSection } from "@/features/archive/ArchiveSection";
import type { ArchiveSectionDefinition } from "@/lib/content/types";

type LabSectionProps = Readonly<{
  definition: ArchiveSectionDefinition;
  revealEnabled: boolean;
}>;

export function LabSection({ definition, revealEnabled }: LabSectionProps) {
  return (
    <ArchiveSection
      className="lab-section"
      definition={definition}
      revealEnabled={revealEnabled}
    >
      <div aria-hidden="true" className="archive-section__trace archive-section__trace--lab" />
    </ArchiveSection>
  );
}
