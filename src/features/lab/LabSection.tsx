import { getArchiveSection } from "@/content/archive";
import { ArchiveSection } from "@/features/archive/ArchiveSection";

type LabSectionProps = Readonly<{
  revealEnabled: boolean;
}>;

export function LabSection({ revealEnabled }: LabSectionProps) {
  return (
    <ArchiveSection
      className="lab-section"
      definition={getArchiveSection("lab")}
      revealEnabled={revealEnabled}
    >
      <div aria-hidden="true" className="archive-section__trace archive-section__trace--lab" />
    </ArchiveSection>
  );
}
