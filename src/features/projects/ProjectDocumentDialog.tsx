"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

import type { ArchiveLocale, MarkdownBlock, ProjectRecord } from "@/lib/content/types";

import type { ArchitectureNode } from "./projectArchitecture";
import "./projectDocumentDialog.css";

type ProjectDocumentDialogProps = Readonly<{
  project: ProjectRecord;
  node: ArchitectureNode;
  locale: ArchiveLocale;
  onClose: () => void;
}>;

const dialogCopy = {
  zh: {
    close: "关闭文档",
    documents: "相关文档",
    repository: "项目仓库",
    source: "查看原文",
    empty: "该模块暂未收录文档，可前往项目仓库了解更多。",
    reading: "正在阅读",
    stack: "技术栈",
  },
  en: {
    close: "Close documentation",
    documents: "Related documents",
    repository: "Repository",
    source: "View source",
    empty: "No documents are indexed for this module yet. Explore the repository for more details.",
    reading: "Reading",
    stack: "Technology stack",
  },
} as const;

function safeRepositoryUrl(value: string | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password
      ? url.href
      : null;
  } catch {
    return null;
  }
}

function sourceDocumentUrl(repository: string | null, path: string) {
  if (!repository || path.startsWith("/") || path.split("/").includes("..")) return null;
  const url = new URL(repository);
  if (url.hostname !== "github.com") return null;
  url.pathname = `${url.pathname.replace(/\/$/u, "")}/blob/main/${path.split("/").map(encodeURIComponent).join("/")}`;
  url.search = "";
  url.hash = "";
  return url.href;
}

function documentBlock(block: MarkdownBlock, index: number) {
  const key = `${block.type}-${index}`;
  switch (block.type) {
    case "heading": {
      const Heading = block.level === 2 ? "h4" : block.level === 3 ? "h5" : "h6";
      return <Heading key={key}>{block.text}</Heading>;
    }
    case "paragraph":
      return <p key={key}>{block.text}</p>;
    case "quote":
      return <blockquote key={key}>{block.text}</blockquote>;
    case "list": {
      const List = block.ordered ? "ol" : "ul";
      return <List key={key}>{block.items.map((item, itemIndex) => <li key={`${key}-${itemIndex}`}>{item}</li>)}</List>;
    }
    case "code":
      return <pre key={key}><code data-language={block.language}>{block.code}</code></pre>;
    case "rule":
      return <hr key={key} />;
  }
}

export function ProjectDocumentDialog({ project, node, locale, onClose }: ProjectDocumentDialogProps) {
  const copy = dialogCopy[locale];
  const titleId = useId();
  const descriptionId = useId();
  const readerTitleId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const readerRef = useRef<HTMLElement>(null);
  const backdropPressed = useRef(false);
  const documents = [...new Set(node.documents)].flatMap((path) => {
    const entry = project.documents.find((document) => document.path === path);
    return entry ? [entry] : [];
  });
  const [selectedPath, setSelectedPath] = useState(documents[0]?.path ?? "");
  const activeDocument = documents.find((entry) => entry.path === selectedPath) ?? documents[0];
  const repositoryUrl = safeRepositoryUrl(project.url);
  const sourceUrl = activeDocument ? sourceDocumentUrl(repositoryUrl, activeDocument.path) : null;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const body = document.body;
    const root = document.documentElement;
    const previousOverflow = body.style.overflow;
    const previousPadding = body.style.paddingRight;
    const previousRootOverflow = root.style.overflow;
    const scrollbarWidth = window.innerWidth - root.clientWidth;
    const bodyPadding = Number.parseFloat(getComputedStyle(body).paddingRight) || 0;

    body.style.overflow = "hidden";
    root.style.overflow = "hidden";
    if (scrollbarWidth > 0) body.style.paddingRight = `${bodyPadding + scrollbarWidth}px`;
    dialog.showModal();
    headingRef.current?.focus({ preventScroll: true });

    return () => {
      dialog.close();
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPadding;
      root.style.overflow = previousRootOverflow;
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, []);

  if (typeof document === "undefined") return null;

  return createPortal(
    <dialog
      aria-describedby={descriptionId}
      aria-labelledby={titleId}
      className="project-document-dialog"
      data-physics-ignore
      lang={locale === "zh" ? "zh-CN" : "en"}
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClick={(event) => {
        if (event.target === event.currentTarget && backdropPressed.current) onClose();
        backdropPressed.current = false;
      }}
      onPointerDown={(event) => {
        const bounds = event.currentTarget.getBoundingClientRect();
        backdropPressed.current = event.target === event.currentTarget && (
          event.clientX < bounds.left || event.clientX > bounds.right ||
          event.clientY < bounds.top || event.clientY > bounds.bottom
        );
      }}
      ref={dialogRef}
    >
      <header className="project-document-dialog__header">
        <div className="project-document-dialog__heading">
          <span className="project-document-dialog__eyebrow">{project.title}</span>
          <h2 id={titleId} ref={headingRef} tabIndex={-1}>{node.label}</h2>
          <p id={descriptionId}>{node.description}</p>
        </div>
        <button aria-label={copy.close} className="project-document-dialog__close" onClick={onClose} type="button">
          <svg aria-hidden="true" fill="none" viewBox="0 0 24 24"><path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.5" /></svg>
        </button>
      </header>

      <div className="project-document-dialog__workspace">
        <nav aria-label={copy.documents} className="project-document-dialog__navigation">
          <div className="project-document-dialog__nav-heading"><span>{copy.documents}</span><span>{documents.length}</span></div>
          <ul>
            {documents.map((entry) => (
              <li key={entry.path}>
                <button
                  aria-current={entry.path === activeDocument?.path ? "page" : undefined}
                  className="project-document-dialog__document-link"
                  onClick={() => {
                    setSelectedPath(entry.path);
                    readerRef.current?.scrollTo({ top: 0, behavior: "instant" });
                  }}
                  type="button"
                >
                  <span>{entry.title}</span>
                  <small>{entry.path}</small>
                </button>
              </li>
            ))}
          </ul>
          {repositoryUrl ? <a className="project-document-dialog__repository" href={repositoryUrl} rel="noopener noreferrer" target="_blank">{copy.repository}<span aria-hidden="true">↗</span></a> : null}
        </nav>

        <article aria-labelledby={activeDocument ? readerTitleId : undefined} className="project-document-dialog__reader" ref={readerRef} tabIndex={0}>
          {activeDocument ? (
            <div className="project-document-dialog__reader-content">
              <div aria-atomic="true" aria-live="polite" className="project-document-dialog__sr-only">{copy.reading}: {activeDocument.title}</div>
              <div className="project-document-dialog__document-meta">
                <span>{activeDocument.path}</span>
                {sourceUrl ? <a href={sourceUrl} rel="noopener noreferrer" target="_blank">{copy.source}<span aria-hidden="true">↗</span></a> : null}
              </div>
              <h3 id={readerTitleId}>{activeDocument.title}</h3>
              <p className="project-document-dialog__summary">{activeDocument.summary}</p>
              <ul aria-label={copy.stack} className="project-document-dialog__stack">{project.stack.map((technology) => <li key={technology}>{technology}</li>)}</ul>
              <div className="project-document-dialog__prose" key={activeDocument.path}>{activeDocument.blocks.map(documentBlock)}</div>
            </div>
          ) : <p className="project-document-dialog__empty">{copy.empty}</p>}
        </article>
      </div>
    </dialog>,
    document.body,
  );
}
