"use client";

import { useMemo, useRef, useState } from "react";

import { CopyReveal } from "@/effects/primitives/CopyReveal";
import { useSceneActivity } from "@/effects/runtime/useSceneActivity";
import type { LocaleUiCopy, LogRecord } from "@/lib/content/types";
import { containsCjk } from "@/lib/typography";

import { LogWordField } from "./LogWordField";
import { MarkdownArticle } from "./MarkdownArticle";
import { useLogReadingProgress } from "./useLogReadingProgress";

type LogExplorerProps = Readonly<{
  copy: LocaleUiCopy["logs"];
  logs: readonly LogRecord[];
  revealEnabled: boolean;
}>;

function normalizeDateTime(date: string) {
  return date.replace(/^(\d{4})\.(\d{2})\.(\d{2})$/, "$1-$2-$3");
}

function getWordFieldTokens(logs: readonly LogRecord[], selectedLog: LogRecord) {
  return Array.from(
    new Set(
      [
        selectedLog.title,
        selectedLog.date,
        ...selectedLog.tags,
        ...logs.flatMap((log) => [log.title, log.date, ...log.tags]),
      ].filter(Boolean),
    ),
  );
}

export function LogExplorer({ copy, logs, revealEnabled }: LogExplorerProps) {
  const [selectedId, setSelectedId] = useState(logs[0]?.id ?? null);
  const rootRef = useRef<HTMLDivElement>(null);
  const readerRef = useRef<HTMLElement>(null);
  const selectedLog = logs.find((log) => log.id === selectedId) ?? logs[0] ?? null;
  const wordFieldTokens = useMemo(
    () => (selectedLog ? getWordFieldTokens(logs, selectedLog) : []),
    [logs, selectedLog],
  );
  const sceneActive = useSceneActivity(rootRef);
  const canObserveScene = typeof IntersectionObserver !== "undefined";
  useLogReadingProgress(
    readerRef,
    selectedLog?.id ?? "",
    revealEnabled && Boolean(selectedLog) && (sceneActive || !canObserveScene),
  );

  if (!selectedLog) {
    return <p className="logs-explorer__empty">{copy.empty}</p>;
  }

  const articleTitleId = `log-${selectedLog.id}-title`;

  function selectLog(id: string) {
    if (id === selectedId) {
      return;
    }

    readerRef.current?.scrollTo({ behavior: "auto", top: 0 });
    setSelectedId(id);
  }

  return (
    <div
      className="logs-explorer"
      data-physics-surface="logs"
      data-physics-target={`logs/${selectedLog.id}`}
      ref={rootRef}
    >
      <LogWordField targetRef={rootRef} tokens={wordFieldTokens} />
      <div className="logs-explorer__layout">
        <nav
          aria-label={copy.indexLabel}
          className="logs-explorer__index"
          data-physics-ignore
        >
          <div className="logs-explorer__index-heading">
            <p>{copy.indexHeading}</p>
            <span>{logs.length.toString().padStart(2, "0")}</span>
          </div>
          <ol className="logs-explorer__choices">
            {logs.map((log) => {
              const isSelected = log.id === selectedLog.id;
              const hasCjkTitle = containsCjk(log.title);

              return (
                <li key={log.id}>
                  <button
                    aria-controls="logs-reader"
                    aria-pressed={isSelected}
                    className="logs-explorer__choice"
                    data-selected={isSelected || undefined}
                    data-runtime-activate-action="select"
                    data-runtime-hover-action="inspect"
                    data-runtime-target={`logs/${log.id}`}
                    onClick={() => selectLog(log.id)}
                    type="button"
                  >
                    <span aria-hidden="true" className="logs-explorer__choice-id">
                      {log.id}
                    </span>
                    <span className="logs-explorer__choice-copy">
                      <time dateTime={normalizeDateTime(log.date)}>{log.date}</time>
                      <span
                        className="logs-explorer__choice-title"
                        data-cjk-heading={hasCjkTitle || undefined}
                      >
                        <CopyReveal enabled={revealEnabled} text={log.title} />
                      </span>
                      <span className="logs-explorer__choice-summary">{log.summary}</span>
                      <span className="logs-explorer__choice-meta">
                        <span>{log.status}</span>
                        <span>{log.tags.join(" · ")}</span>
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        <div className="logs-explorer__reader-stage">
          <svg
            aria-hidden="true"
            className="logs-explorer__reader-surface"
            focusable="false"
            preserveAspectRatio="none"
            viewBox="0 0 100 100"
          >
            <path
              className="logs-explorer__reader-shape"
              d="M 68 0 C 58 6, 49 13, 41 24 C 34 35, 31 46, 34 56 C 37 67, 29 75, 31 85 C 33 94, 38 98, 44 100 H 100 V 0 Z"
            />
            <path
              className="logs-explorer__compile-path"
              d="M 68 0 C 58 6, 49 13, 41 24 C 34 35, 31 46, 34 56 C 37 67, 29 75, 31 85 C 33 94, 38 98, 44 100"
              pathLength="1"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          <article
            aria-labelledby={articleTitleId}
            aria-live="polite"
            className="logs-reader"
            data-physics-ignore
            data-runtime-hover-action="inspect"
            data-runtime-target={`logs/${selectedLog.id}`}
            id="logs-reader"
            ref={readerRef}
          >
            <header className="logs-reader__header">
              <div
                className="logs-reader__metadata"
                key={`metadata-${selectedLog.id}`}
              >
                <div className="logs-reader__meta-primary">
                  <span>{`${copy.logPrefix} ${selectedLog.id}`}</span>
                  <span aria-hidden="true">·</span>
                  <time dateTime={normalizeDateTime(selectedLog.date)}>
                    {selectedLog.date}
                  </time>
                </div>
                <span className="logs-reader__meta-tags">
                  {selectedLog.tags.join(" / ")}
                </span>
              </div>
              <h3
                data-cjk-heading={containsCjk(selectedLog.title) || undefined}
                id={articleTitleId}
                key={`title-${selectedLog.id}`}
              >
                {selectedLog.title}
              </h3>
              <p>{selectedLog.summary}</p>
            </header>
            <MarkdownArticle blocks={selectedLog.blocks} logId={selectedLog.id} />
          </article>
        </div>
      </div>
    </div>
  );
}
