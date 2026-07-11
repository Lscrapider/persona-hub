import { ArchiveSection } from "@/features/archive/ArchiveSection";
import { useLocaleContent } from "@/i18n/LocaleProvider";

import { LogExplorer } from "./LogExplorer";

import "./logs.css";

type LogsSectionProps = Readonly<{ revealEnabled: boolean }>;

export function LogsSection({ revealEnabled }: LogsSectionProps) {
  const { content } = useLocaleContent();
  const { archive, site } = content;

  return (
    <ArchiveSection
      className="logs-section"
      definition={site.sections.logs}
      revealEnabled={revealEnabled}
      status={`${archive.logs.length.toString().padStart(2, "0")} ${site.ui.logs.authoredRecords}`}
    >
      <LogExplorer copy={site.ui.logs} logs={archive.logs} revealEnabled={revealEnabled} />
    </ArchiveSection>
  );
}
