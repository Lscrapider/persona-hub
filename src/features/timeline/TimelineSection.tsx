import { ArchiveSection } from "@/features/archive/ArchiveSection";
import { useLocaleContent } from "@/i18n/LocaleProvider";

import { TimelineRail } from "./TimelineRail";

import "./timeline.css";

type TimelineSectionProps = Readonly<{ revealEnabled: boolean }>;

export function TimelineSection({ revealEnabled }: TimelineSectionProps) {
  const { content } = useLocaleContent();
  const { archive, site } = content;

  return (
    <ArchiveSection
      className="timeline-section"
      definition={site.sections.timeline}
      revealEnabled={revealEnabled}
      status={`${archive.timeline.length.toString().padStart(2, "0")} ${site.ui.timeline.verifiedMilestones}`}
    >
      <TimelineRail
        labels={site.ui.timeline}
        records={archive.timeline}
        revealEnabled={revealEnabled}
      />
    </ArchiveSection>
  );
}
