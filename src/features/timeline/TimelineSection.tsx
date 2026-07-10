import { getArchiveSection } from "@/content/archive";
import { ArchiveSection } from "@/features/archive/ArchiveSection";

type TimelineSectionProps = Readonly<{
  revealEnabled: boolean;
}>;

export function TimelineSection({ revealEnabled }: TimelineSectionProps) {
  return (
    <ArchiveSection
      className="timeline-section"
      definition={getArchiveSection("timeline")}
      revealEnabled={revealEnabled}
    >
      <div aria-hidden="true" className="archive-section__trace archive-section__trace--timeline" />
    </ArchiveSection>
  );
}
