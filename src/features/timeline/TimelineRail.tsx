"use client";

import { useMemo } from "react";
import type { LocaleUiCopy, TimelineRecord } from "@/lib/content/types";
import { containsCjk } from "@/lib/typography";
import { TimelineStage } from "./TimelineStage";
import { useActiveTimelineRecord } from "./useActiveTimelineRecord";

type TimelineRailProps = Readonly<{
  labels: LocaleUiCopy["timeline"];
  records: readonly TimelineRecord[];
  revealEnabled: boolean;
}>;

export function TimelineRail({ labels, records }: TimelineRailProps) {
  const displayRecords = useMemo(() => [...records].reverse(), [records]);
  const [activeId, getRecordRef] = useActiveTimelineRecord(displayRecords);
  return (
    <div className="timeline-rail">
      <TimelineStage records={displayRecords} activeId={activeId} />
      <ol aria-label={labels.recordsLabel} className="timeline-rail__records">
        {displayRecords.map((record) => {
          const context = [record.organisation, record.location].filter(Boolean).join(" · ");
          return (
            <li className="timeline-rail__item" key={record.id}>
              <article id={`timeline-record-${record.id}`} className="timeline-rail__record" data-active={record.id === activeId || undefined} data-timeline-id={record.id} ref={getRecordRef(record.id)}>
                <div className="timeline-rail__date">
                  <span aria-hidden="true" className="timeline-rail__year">{record.sortDate.slice(0, 4)}</span>
                  <time dateTime={record.sortDate.replaceAll(".", "-")}>{record.period}</time>
                </div>
                <div className="timeline-rail__details">
                  <p className="timeline-rail__kind">{record.kind}</p>
                  <h3 data-cjk-heading={containsCjk(record.title) || undefined}>{record.title}</h3>
                  {context ? <p className="timeline-rail__context">{context}</p> : null}
                  <p className="timeline-rail__description">{record.description}</p>
                  {record.highlights?.length ? <ul>{record.highlights.map((item) => <li key={item}>{item}</li>)}</ul> : null}
                </div>
              </article>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
