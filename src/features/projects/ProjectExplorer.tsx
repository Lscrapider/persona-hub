"use client";

import { useState } from "react";

import { CopyReveal } from "@/effects/primitives/CopyReveal";
import type { LocaleUiCopy, ProjectRecord } from "@/lib/content/types";
import { containsCjk } from "@/lib/typography";

import { ProjectDocumentView } from "./ProjectDocument";
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

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }

    return url.href;
  } catch {
    return null;
  }
}

function getSafeDocumentUrl(value: string | null, documentPath: string) {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);

    const repositoryPath = url.pathname.replace(/\/$/u, "");
    const encodedDocumentPath = documentPath
      .split("/")
      .map((segment) => encodeURIComponent(segment))
      .join("/");
    url.pathname = `${repositoryPath}/blob/main/${encodedDocumentPath}`;

    return url.href;
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
  const [activeDocumentPath, setActiveDocumentPath] = useState(
    selectedProject?.documents[0]?.path ?? "",
  );

  if (!selectedProject) {
    return <p className="project-explorer__empty">{copy.empty}</p>;
  }

  const activeDocument =
    selectedProject.documents.find(
      (document) => document.path === activeDocumentPath,
    ) ?? selectedProject.documents[0] ?? null;

  if (!activeDocument) {
    return <p className="project-explorer__empty">{copy.empty}</p>;
  }

  const repositoryUrl = getSafeExternalUrl(selectedProject.url);
  const sourceUrl = getSafeDocumentUrl(repositoryUrl, activeDocument.path);
  const sortedProjects = [...projects].sort((left, right) =>
    left.id.localeCompare(right.id),
  );

  return (
    <div
      className="project-explorer"
      data-physics-surface="projects"
      data-physics-target={`projects/${selectedProject.id}`}
      id="project-explorer-workspace"
    >
      <p aria-live="polite" className="project-explorer__announcement">
        {copy.activeProject}: {selectedProject.title} / {activeDocument.path}
      </p>

      <aside
        aria-labelledby="project-filesystem-title"
        className="project-explorer__filesystem"
      >
        <div className="project-explorer__pane-heading">
          <h3 id="project-filesystem-title">01 / {copy.filesystem}</h3>
          <span>{selectedProject.documents.length.toString().padStart(2, "0")}</span>
        </div>
        <div className="project-explorer__repository-root">
          <span aria-hidden="true">⌄</span>
          <strong>{selectedProject.slug}</strong>
        </div>
        <ProjectTree
          activePath={activeDocument.path}
          documents={selectedProject.documents}
          onOpenDocument={setActiveDocumentPath}
          projectId={selectedProject.id}
        />
      </aside>

      <ProjectDocumentView
        copy={copy}
        document={activeDocument}
        project={selectedProject}
        repositoryUrl={repositoryUrl}
        sourceUrl={sourceUrl}
      />

      <aside
        aria-labelledby="project-index-title"
        className="project-explorer__projects"
      >
        <div className="project-explorer__pane-heading">
          <h3 id="project-index-title">03 / {copy.indexHeading}</h3>
          <span>{projects.length.toString().padStart(2, "0")}</span>
        </div>
        <ol aria-label={copy.indexLabel} className="project-explorer__choices">
          {sortedProjects.map((project) => {
            const isSelected = project.id === selectedProject.id;

            return (
              <li key={project.id}>
                <button
                  aria-controls="project-explorer-workspace"
                  aria-pressed={isSelected}
                  className="project-explorer__choice"
                  data-project-id={project.id}
                  data-runtime-activate-action="select"
                  data-runtime-hover-action="inspect"
                  data-runtime-target={`projects/${project.id}`}
                  data-selected={isSelected || undefined}
                  data-webgl-anchor="project-choice"
                  onClick={() => onSelectProject(project.id)}
                  type="button"
                >
                  <span aria-hidden="true" className="project-explorer__choice-id">
                    {project.id}
                  </span>
                  <span className="project-explorer__choice-copy">
                    <span
                      className="project-explorer__choice-name"
                      data-cjk-heading={containsCjk(project.title) || undefined}
                    >
                      <CopyReveal enabled={revealEnabled} text={project.title} />
                    </span>
                    <span className="project-explorer__choice-status">
                      <CopyReveal
                        enabled={revealEnabled}
                        text={`${project.status} / ${project.year}`}
                      />
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </aside>
    </div>
  );
}
