"use client";

import { useEffect, useRef, useState } from "react";

import { CopyReveal } from "@/effects/primitives/CopyReveal";
import { useEffectMode } from "@/effects/runtime/EffectMode";
import type { LocaleUiCopy, TimelineRecord } from "@/lib/content/types";
import { containsCjk } from "@/lib/typography";

import { useActiveTimelineRecord } from "./useActiveTimelineRecord";

type TimelineRailProps = Readonly<{
  labels: LocaleUiCopy["timeline"];
  records: readonly TimelineRecord[];
  revealEnabled: boolean;
}>;

function normalizeDateTime(sortDate: string): string {
  return sortDate.replaceAll(".", "-");
}

export function TimelineRail({ labels, records, revealEnabled }: TimelineRailProps) {
  const { mode } = useEffectMode();
  const railRef = useRef<HTMLDivElement>(null);
  const [hasTraceEntered, setHasTraceEntered] = useState(false);
  const canObserveTrace = typeof IntersectionObserver !== "undefined";
  const shouldDrawTrace =
    hasTraceEntered || (revealEnabled && mode === "full" && !canObserveTrace);
  const [activeId, setActiveId, getRecordRef] =
    useActiveTimelineRecord(records);
  const displayRecords = [...records].reverse().map((record, index, reversedRecords) => {
    const year = record.sortDate.slice(0, 4);
    const previousYear = reversedRecords[index - 1]?.sortDate.slice(0, 4);
    const showYear = year !== previousYear;

    return {
      record,
      side: index % 2 === 0 ? "right" : "left",
      showYear,
      year,
    } as const;
  });

  useEffect(() => {
    if (
      hasTraceEntered ||
      !revealEnabled ||
      mode !== "full" ||
      !railRef.current
    ) {
      return;
    }

    if (!canObserveTrace) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) {
          return;
        }

        setHasTraceEntered(true);
        observer.disconnect();
      },
      {
        rootMargin: "0px 0px -18% 0px",
        threshold: 0.08,
      },
    );

    observer.observe(railRef.current);

    return () => {
      observer.disconnect();
    };
  }, [canObserveTrace, hasTraceEntered, mode, revealEnabled]);

  return (
    <div
      className="timeline-rail"
      data-trace-state={shouldDrawTrace ? "drawing" : "idle"}
      ref={railRef}
    >
      <svg
        aria-hidden="true"
        className="timeline-rail__trace"
        focusable="false"
        preserveAspectRatio="none"
        viewBox="0 0 100 100"
      >
        <path
          className="timeline-rail__trace-path"
          d="M 50 0 V 100"
          pathLength="1"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <ol aria-label={labels.recordsLabel} className="timeline-rail__records">
        {displayRecords.map(({ record, side, showYear, year }) => {
          const isActive = record.id === activeId;
          const context = [record.organisation, record.location]
            .filter(Boolean)
            .join(" · ");

          return (
            <li className="timeline-rail__item" key={record.id}>
              <article
                className="timeline-rail__record"
                data-active={isActive || undefined}
                data-side={side}
                data-timeline-id={record.id}
                ref={getRecordRef(record.id)}
              >
                <button
                  aria-label={`${labels.focusLabel} ${record.period}: ${record.title}`}
                  aria-pressed={isActive}
                  className="timeline-rail__marker"
                  onClick={() => setActiveId(record.id)}
                  type="button"
                >
                  <span className="timeline-rail__marker-label">{labels.markerLabel}</span>
                </button>
                {showYear ? (
                  <span aria-hidden="true" className="timeline-rail__year">
                    {year}
                  </span>
                ) : null}
                <time
                  className="timeline-rail__period"
                  dateTime={normalizeDateTime(record.sortDate)}
                >
                  <CopyReveal enabled={revealEnabled} text={record.period} />
                </time>
                <div className="timeline-rail__details">
                  <div className="timeline-rail__metadata">
                    <p>
                      <CopyReveal enabled={revealEnabled} text={record.kind} />
                    </p>
                  </div>
                  <h3 data-cjk-heading={containsCjk(record.title) || undefined}>
                    <CopyReveal enabled={revealEnabled} text={record.title} />
                  </h3>
                  {context ? (
                    <p className="timeline-rail__context">
                      <CopyReveal enabled={revealEnabled} text={context} />
                    </p>
                  ) : null}
                  <p className="timeline-rail__description">
                    <CopyReveal enabled={revealEnabled} text={record.description} />
                  </p>
                  {record.highlights?.length ? (
                    <ul className="timeline-rail__highlights">
                      {record.highlights.map((highlight) => (
                        <li key={highlight}>
                          <CopyReveal enabled={revealEnabled} text={highlight} />
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </article>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
