import { ArchiveSection } from "@/features/archive/ArchiveSection";
import { useLocaleContent } from "@/i18n/LocaleProvider";

import { ProjectExplorer } from "./ProjectExplorer";

import "./projects.css";

type ProjectsSectionProps = Readonly<{ revealEnabled: boolean }>;

export function ProjectsSection({ revealEnabled }: ProjectsSectionProps) {
  const { content } = useLocaleContent();
  const { archive, site } = content;

  return (
    <ArchiveSection
      className="projects-section"
      definition={site.sections.projects}
      revealEnabled={revealEnabled}
      status={`${archive.projects.length.toString().padStart(2, "0")} ${site.ui.projects.indexed}`}
    >
      <ProjectExplorer
        copy={site.ui.projects}
        projects={archive.projects}
        revealEnabled={revealEnabled}
      />
    </ArchiveSection>
  );
}
