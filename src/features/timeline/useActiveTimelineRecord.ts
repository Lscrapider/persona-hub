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

    let observer: IntersectionObserver | null = null;
    let resizeFrame = 0;

    const reconcileActiveRecord = () => {
      const viewportHeight = Math.max(1, window.innerHeight);
      const bandStart = viewportHeight * 0.32;
      const bandEnd = viewportHeight * 0.58;
      const bandCenter = (bandStart + bandEnd) / 2;
      let bestId: string | null = null;
      let bestOverlap = -1;
      let bestDistance = Number.POSITIVE_INFINITY;

      records.forEach((record) => {
        const element = recordElementsRef.current.get(record.id);

        if (!element) {
          return;
        }

        const rect = element.getBoundingClientRect();
        const overlap = Math.max(
          0,
          Math.min(rect.bottom, bandEnd) - Math.max(rect.top, bandStart),
        );
        const distance = Math.abs((rect.top + rect.bottom) / 2 - bandCenter);

        if (
          overlap > bestOverlap ||
          (overlap === bestOverlap && distance < bestDistance)
        ) {
          bestId = record.id;
          bestOverlap = overlap;
          bestDistance = distance;
        }
      });

      if (bestId) {
        setActiveId(bestId);
      }
    };

    const connectObserver = () => {
      observer?.disconnect();

      const viewportHeight = Math.max(1, window.innerHeight);
      const topInset = Math.round(viewportHeight * 0.32);
      const bottomInset = Math.round(viewportHeight * 0.42);

      observer = new IntersectionObserver(reconcileActiveRecord, {
        rootMargin:
          `-${topInset.toString()}px 0px ` +
          `-${bottomInset.toString()}px 0px`,
        threshold: [0, 0.15, 0.5, 0.85],
      });

      records.forEach((record) => {
        const element = recordElementsRef.current.get(record.id);

        if (element) {
          observer?.observe(element);
        }
      });
    };

    const handleResize = () => {
      if (resizeFrame) {
        window.cancelAnimationFrame(resizeFrame);
      }

      resizeFrame = window.requestAnimationFrame(() => {
        resizeFrame = 0;
        connectObserver();
        reconcileActiveRecord();
      });
    };

    connectObserver();
    resizeFrame = window.requestAnimationFrame(() => {
      resizeFrame = 0;
      reconcileActiveRecord();
    });
    window.addEventListener("resize", handleResize, { passive: true });
    window.visualViewport?.addEventListener("resize", handleResize, {
      passive: true,
    });

    return () => {
      if (resizeFrame) {
        window.cancelAnimationFrame(resizeFrame);
      }

      observer?.disconnect();
      window.removeEventListener("resize", handleResize);
      window.visualViewport?.removeEventListener("resize", handleResize);
    };
  }, [records]);

  return [activeId, setActiveId, getRecordRef] as const;
}
