import { ArchiveSection } from "@/features/archive/ArchiveSection";
import { useLocaleContent } from "@/i18n/LocaleProvider";

import { ProjectExplorer } from "./ProjectExplorer";

import "./projects.css";

type ProjectsSectionProps = Readonly<{
  onSelectProject: (projectId: string) => void;
  revealEnabled: boolean;
  selectedProjectId: string | null;
}>;

export function ProjectsSection({
  onSelectProject,
  revealEnabled,
  selectedProjectId,
}: ProjectsSectionProps) {
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
        onSelectProject={onSelectProject}
        projects={archive.projects}
        revealEnabled={revealEnabled}
        selectedProjectId={selectedProjectId}
      />
    </ArchiveSection>
  );
}
