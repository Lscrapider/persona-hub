import type {
  LocaleUiCopy,
  MarkdownBlock,
  ProjectDocument,
  ProjectRecord,
} from "@/lib/content/types";
import { containsCjk } from "@/lib/typography";

type ProjectDocumentViewProps = Readonly<{
  copy: LocaleUiCopy["projects"];
  document: ProjectDocument;
  project: ProjectRecord;
  repositoryUrl: string | null;
  sourceUrl: string | null;
}>;

function renderBlock(block: MarkdownBlock, index: number) {
  const key = `${block.type}-${index.toString()}`;

  switch (block.type) {
    case "heading":
      return <h4 key={key}>{block.text}</h4>;
    case "paragraph":
      return <p key={key}>{block.text}</p>;
    case "list": {
      const List = block.ordered ? "ol" : "ul";

      return (
        <List key={key}>
          {block.items.map((item, itemIndex) => (
            <li key={`${key}-${itemIndex.toString()}`}>{item}</li>
          ))}
        </List>
      );
    }
    case "quote":
      return <blockquote key={key}>{block.text}</blockquote>;
    case "code":
      return (
        <pre key={key}>
          <code data-language={block.language}>{block.code}</code>
        </pre>
      );
    case "rule":
      return <hr key={key} />;
  }
}

export function ProjectDocumentView({
  copy,
  document,
  project,
  repositoryUrl,
  sourceUrl,
}: ProjectDocumentViewProps) {
  const repositoryAddress = repositoryUrl?.replace(/^https?:\/\//u, "") ?? null;

  return (
    <article
      aria-labelledby="project-document-title"
      className="project-explorer__document"
      data-physics-ignore
      data-runtime-hover-action="inspect"
      data-runtime-target={`projects/${project.id}/document/${document.path}`}
      id="project-document"
    >
      <div className="project-explorer__document-bar">
        <div
          className="project-explorer__document-tab"
          data-webgl-anchor="project-detail"
        >
          <span aria-hidden="true" className="project-explorer__tab-mark" />
          {repositoryUrl && repositoryAddress ? (
            <a
              className="project-explorer__repository-address"
              href={repositoryUrl}
              rel="noreferrer"
              target="_blank"
            >
              {repositoryAddress}
            </a>
          ) : (
            <span>{project.slug}</span>
          )}
          <span aria-hidden="true" className="project-explorer__address-separator">
            /
          </span>
          <span className="project-explorer__document-path">{document.path}</span>
        </div>
        <div className="project-explorer__document-actions">
          {repositoryUrl ? (
            <a
              className="project-explorer__repository-link"
              href={repositoryUrl}
              rel="noreferrer"
              target="_blank"
            >
              {copy.openPublicProject}
              <span aria-hidden="true">↗</span>
            </a>
          ) : null}
          {sourceUrl ? (
            <a
              className="project-explorer__source-link"
              href={sourceUrl}
              rel="noreferrer"
              target="_blank"
            >
              {copy.sourceDocument}
              <span aria-hidden="true">↗</span>
            </a>
          ) : null}
        </div>
      </div>

      <div className="project-explorer__document-scroll" key={document.path}>
        <header className="project-explorer__document-header">
          <div className="project-explorer__document-meta">
            <strong>
              {project.id} / {project.title}
            </strong>
            <span>{document.path}</span>
            <span>{copy.document}</span>
          </div>
          <h3
            data-cjk-heading={containsCjk(document.title) || undefined}
            id="project-document-title"
          >
            {document.title}
          </h3>
          <p className="project-explorer__document-summary">
            {document.summary}
          </p>
          <div aria-label={copy.technicalStack} className="project-explorer__technical-stack">
            <span>{copy.technicalStack}</span>
            <ul>
              {project.stack.map((technology) => (
                <li key={technology}>{technology}</li>
              ))}
            </ul>
          </div>
        </header>

        <div className="project-explorer__document-body">
          {document.blocks.map(renderBlock)}
        </div>
      </div>
    </article>
  );
}
