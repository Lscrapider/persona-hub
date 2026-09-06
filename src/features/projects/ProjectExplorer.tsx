"use client";

import { useMemo, useState } from "react";

import { useLocaleContent } from "@/i18n/LocaleProvider";
import type { LocaleUiCopy, ProjectRecord } from "@/lib/content/types";

import { ProjectArchitectureStage } from "./ProjectArchitectureStage";
import { ProjectDocumentDialog } from "./ProjectDocumentDialog";
import { getProjectArchitecture, type ArchitectureNode } from "./projectArchitecture";

type ProjectExplorerProps = Readonly<{
  copy: LocaleUiCopy["projects"];
  onSelectProject: (projectId: string) => void;
  projects: readonly ProjectRecord[];
  revealEnabled: boolean;
  selectedProjectId: string | null;
}>;

function safeUrl(value: string | undefined) {
  try {
    const url = new URL(value ?? "");
    return ["https:", "http:"].includes(url.protocol) ? url.href : null;
  } catch { return null; }
}

export function ProjectExplorer({ copy, onSelectProject, projects, selectedProjectId }: ProjectExplorerProps) {
  const { locale } = useLocaleContent();
  const selectedProject = projects.find((project) => project.id === selectedProjectId) ?? projects[0];
  const [openNode, setOpenNode] = useState<ArchitectureNode | null>(null);
  const architecture = useMemo(() => selectedProject ? getProjectArchitecture(selectedProject, locale) : null, [selectedProject, locale]);
  const zh = locale === "zh";
  if (!selectedProject || !architecture) return <p>{copy.empty}</p>;
  const repositoryUrl = safeUrl(selectedProject.url);

  return (
    <div className="project-atlas" id="project-explorer-workspace">
      <nav aria-label={copy.indexLabel} className="project-atlas__index">
        {projects.map((project) => (
          <button
            aria-controls="project-atlas-selected"
            aria-pressed={selectedProject.id === project.id}
            className="project-atlas__project"
            data-project-id={project.id}
            data-runtime-target={`projects/${project.id}`}
            data-runtime-activate-action="select"
            key={project.id}
            onClick={() => { setOpenNode(null); onSelectProject(project.id); }}
            type="button"
          >
            <span className="project-atlas__project-meta">{project.year}<span aria-hidden="true">↗</span></span>
            <strong>{project.title}</strong>
            <span className="project-atlas__project-description">{project.summary}</span>
          </button>
        ))}
      </nav>
      <div className="project-atlas__selected" id="project-atlas-selected" key={selectedProject.id}>
        <header className="project-atlas__intro">
          <div>
            <p className="project-atlas__eyebrow"><span className="project-atlas__status-dot" aria-hidden="true" />{selectedProject.status}<span>/</span>{selectedProject.year}</p>
            <h3>{selectedProject.title}</h3>
          </div>
          <p className="project-atlas__description">{selectedProject.summary}<span>{selectedProject.slug === "scrapider-guidelines" ? zh ? "从规范入口，展开技术栈参考与审查规则。" : "Explore stack references and review rules from the Skill entry." : zh ? "点击服务模型，阅读它所承载的业务设计。" : "Select a service model to read the designs it owns."}</span></p>
          {repositoryUrl ? <a className="project-atlas__source" href={repositoryUrl} rel="noreferrer" target="_blank">GitHub<span aria-hidden="true">↗</span></a> : null}
        </header>
        <ProjectArchitectureStage architecture={architecture} locale={locale} onOpenNode={setOpenNode} paused={openNode !== null} />
        <div className="project-atlas__stack"><span>{zh ? "构建于" : "BUILT WITH"}</span>{selectedProject.stack.map((technology) => <span key={technology}>{technology}</span>)}</div>
      </div>
      {openNode ? <ProjectDocumentDialog key={`${selectedProject.id}-${openNode.id}`} project={selectedProject} node={openNode} locale={locale} onClose={() => setOpenNode(null)} /> : null}
    </div>
  );
}
