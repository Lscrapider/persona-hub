"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { TimelineRecord } from "@/lib/content/types";

type TimelineRecordRef = (element: HTMLElement | null) => void;

export function useActiveTimelineRecord(records: readonly TimelineRecord[]) {
  const [activeId, setActiveId] = useState<string | null>(
    records[0]?.id ?? null,
  );
  const recordElementsRef = useRef(new Map<string, HTMLElement>());
  const recordRefCallbacks = useRef(new Map<string, TimelineRecordRef>());

  const getRecordRef = useCallback((id: string): TimelineRecordRef => {
    const existingCallback = recordRefCallbacks.current.get(id);

    if (existingCallback) {
      return existingCallback;
    }

    const recordRef: TimelineRecordRef = (element) => {
      if (element) {
        recordElementsRef.current.set(id, element);
        return;
      }

      recordElementsRef.current.delete(id);
    };

    recordRefCallbacks.current.set(id, recordRef);

    return recordRef;
  }, []);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleRecord = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visibleRecord) {
          setActiveId(visibleRecord.target.getAttribute("data-timeline-id"));
        }
      },
      {
        rootMargin: "-32% 0px -42% 0px",
        threshold: [0.15, 0.5, 0.85],
      },
    );

    records.forEach((record) => {
      const element = recordElementsRef.current.get(record.id);

      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, [records]);

  return [activeId, setActiveId, getRecordRef] as const;
}
