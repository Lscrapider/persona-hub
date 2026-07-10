import { getArchiveSection, projectRecords } from "@/content/archive";
import { CopyReveal } from "@/effects/primitives/CopyReveal";
import { ArchiveSection } from "@/features/archive/ArchiveSection";

type ProjectsSectionProps = Readonly<{
  revealEnabled: boolean;
}>;

export function ProjectsSection({ revealEnabled }: ProjectsSectionProps) {
  return (
    <ArchiveSection
      className="projects-section"
      definition={getArchiveSection("projects")}
      revealEnabled={revealEnabled}
    >
      <ol className="projects-section__records">
        {projectRecords.map((record) => (
          <li className="projects-section__record" key={record.id}>
            <a className="projects-section__link" href={record.href}>
              <span className="projects-section__id">
                <CopyReveal enabled={revealEnabled} text={record.id} />
              </span>
              <span className="projects-section__name">
                <CopyReveal enabled={revealEnabled} text={record.title} />
              </span>
              <span className="projects-section__meta">
                <CopyReveal enabled={revealEnabled} text={record.meta} />
              </span>
              <span aria-hidden="true" className="projects-section__arrow">
                →
              </span>
            </a>
          </li>
        ))}
      </ol>
    </ArchiveSection>
  );
}
