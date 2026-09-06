"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { TimelineRecord } from "@/lib/content/types";

type RecordRef = (element: HTMLElement | null) => void;

/** Native scrolling is the only owner of the current timeline record. */
export function useActiveTimelineRecord(records: readonly TimelineRecord[]) {
  const [activeId, setActiveId] = useState<string | null>(records[0]?.id ?? null);
  const elements = useRef(new Map<string, HTMLElement>());
  const callbacks = useRef(new Map<string, RecordRef>());
  const getRecordRef = useCallback((id: string): RecordRef => {
    if (!callbacks.current.has(id)) callbacks.current.set(id, (element) => {
      if (element) elements.current.set(id, element);
      else elements.current.delete(id);
    });
    return callbacks.current.get(id)!;
  }, []);
  useEffect(() => {
    let frame = 0;
    let visible = false;
    const reconcile = () => {
      frame = 0;
      if (!visible || document.hidden) return;
      let closest: string | null = null;
      let distance = Infinity;
      for (const [id, element] of elements.current) {
        const rect = element.getBoundingClientRect();
        const next = Math.abs(rect.top + Math.min(rect.height / 2, 150) - window.innerHeight * 0.42);
        if (next < distance) { closest = id; distance = next; }
      }
      if (closest) setActiveId(closest);
    };
    const schedule = () => { if (!frame && visible && !document.hidden) frame = requestAnimationFrame(reconcile); };
    const section = elements.current.values().next().value?.closest(".timeline-section");
    const observer = new IntersectionObserver(([entry]) => { visible = !!entry?.isIntersecting; schedule(); });
    if (section) observer.observe(section);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    document.addEventListener("visibilitychange", schedule);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      document.removeEventListener("visibilitychange", schedule);
    };
  }, [records]);
  return [activeId, getRecordRef] as const;
}
