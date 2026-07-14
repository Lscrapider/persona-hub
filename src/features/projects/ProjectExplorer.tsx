"use client";

import { CopyReveal } from "@/effects/primitives/CopyReveal";
import type { LocaleUiCopy, ProjectRecord } from "@/lib/content/types";
import { containsCjk } from "@/lib/typography";

import { ProjectTree } from "./ProjectTree";

type ProjectExplorerProps = Readonly<{
  copy: LocaleUiCopy["projects"];
  onSelectProject: (projectId: string) => void;
  projects: readonly ProjectRecord[];
  revealEnabled: boolean;
  selectedProjectId: string | null;
}>;

function getSafeExternalUrl(value: string | undefined) {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);

    return url.protocol === "http:" || url.protocol === "https:"
      ? url.href
      : null;
  } catch {
    return null;
  }
}

export function ProjectExplorer({
  copy,
  onSelectProject,
  projects,
  revealEnabled,
  selectedProjectId,
}: ProjectExplorerProps) {
  const selectedProject =
    projects.find((project) => project.id === selectedProjectId) ??
    projects[0] ??
    null;

  if (!selectedProject) {
    return (
      <p className="project-explorer__empty">
        {copy.empty}
      </p>
    );
  }

  const externalUrl = getSafeExternalUrl(selectedProject.url);
  const projectSignature = selectedProject.stack.join(" / ");

  return (
    <div
      className="project-explorer"
      data-physics-surface="projects"
      data-physics-target={`projects/${selectedProject.id}`}
    >
      <div className="project-explorer__index" data-physics-ignore>
        <div className="project-explorer__index-heading">
          <p>{copy.indexHeading}</p>
          <span>{projects.length.toString().padStart(2, "0")}</span>
        </div>
        <ol aria-label={copy.indexLabel} className="project-explorer__choices">
          {projects.map((project) => {
            const isSelected = project.id === selectedProject.id;
            const hasCjkTitle = containsCjk(project.title);

            return (
              <li key={project.id}>
                <button
                  aria-controls="project-explorer-detail"
                  aria-pressed={isSelected}
                  className="project-explorer__choice"
                  data-runtime-activate-action="select"
                  data-runtime-hover-action="inspect"
                  data-runtime-target={`projects/${project.id}`}
                  data-selected={isSelected || undefined}
                  onClick={() => onSelectProject(project.id)}
                  type="button"
                >
                  <span aria-hidden="true" className="project-explorer__choice-id">
                    {project.id}
                  </span>
                  <span
                    className="project-explorer__choice-name"
                    data-cjk-heading={hasCjkTitle || undefined}
                  >
                    <CopyReveal enabled={revealEnabled} text={project.title} />
                  </span>
                  <span className="project-explorer__choice-status">
                    <CopyReveal
                      enabled={revealEnabled}
                      text={project.stack.join(", ") || project.status}
                    />
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      <article
        aria-labelledby="project-explorer-title"
        className="project-explorer__detail"
        data-physics-ignore
        data-runtime-hover-action="inspect"
        data-runtime-target={`projects/${selectedProject.id}`}
        id="project-explorer-detail"
        key={selectedProject.id}
      >
        <p aria-live="polite" className="project-explorer__announcement">
          {copy.activeProject}: {selectedProject.title}
        </p>
        <header className="project-explorer__detail-header">
          <div className="project-explorer__detail-meta">
            <p>{copy.activeProject}</p>
            <p>
              {selectedProject.status} / {selectedProject.year}
            </p>
          </div>
          <h3
            data-cjk-heading={containsCjk(selectedProject.title) || undefined}
            id="project-explorer-title"
            key={selectedProject.id}
          >
            <span className="project-explorer__title-reveal">
              {selectedProject.title}
            </span>
          </h3>
          {projectSignature ? (
            <p className="project-explorer__signature">{projectSignature}</p>
          ) : null}
        </header>

        <div className="project-explorer__detail-body">
          <div className="project-explorer__brief">
            <p className="project-explorer__summary">{selectedProject.summary}</p>
            <p className="project-explorer__content">{selectedProject.content}</p>
            {externalUrl ? (
              <a
                className="project-explorer__external-link"
                href={externalUrl}
                rel="noreferrer"
                target="_blank"
              >
                {copy.openPublicProject}
                <span aria-hidden="true">↗</span>
              </a>
            ) : null}

            <div className="project-explorer__facts">
              <section aria-labelledby="project-stack-title">
                <h4 id="project-stack-title">{copy.technicalStack}</h4>
                <ul className="project-explorer__token-list">
                  {selectedProject.stack.map((item, index) => (
                    <li key={`${selectedProject.id}-stack-${index.toString()}`}>
                      {item}
                    </li>
                  ))}
                </ul>
              </section>
              <section aria-labelledby="project-capabilities-title">
                <h4 id="project-capabilities-title">{copy.capabilities}</h4>
                <ul className="project-explorer__capabilities">
                  {selectedProject.capabilities.map((capability, index) => (
                    <li key={`${selectedProject.id}-capability-${index.toString()}`}>
                      {capability}
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </div>

          <section
            aria-labelledby="project-system-map-title"
            className="project-explorer__tree-panel"
          >
            <h4 id="project-system-map-title">{copy.systemMap}</h4>
            <ProjectTree
              key={selectedProject.id}
              nodes={selectedProject.tree}
              projectId={selectedProject.id}
            />
          </section>
        </div>
      </article>
    </div>
  );
}
