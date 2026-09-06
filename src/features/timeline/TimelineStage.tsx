"use client";

import { useEffect, useRef } from "react";
import { useEffectMode } from "@/effects/runtime/EffectMode";
import type { TimelineRecord } from "@/lib/content/types";
import { useLocaleContent } from "@/i18n/LocaleProvider";
import type { TimelineRenderer } from "./timelineRenderer";

type Props = {
  records: readonly TimelineRecord[];
  activeId: string | null;
};

export function TimelineStage({ records, activeId }: Props) {
  const track = useRef<HTMLDivElement>(null);
  const host = useRef<HTMLDivElement>(null);
  const surface = useRef<HTMLCanvasElement>(null);
  const renderer = useRef<TimelineRenderer | null>(null);
  const { mode } = useEffectMode();
  const { locale } = useLocaleContent();
  const current = useRef({ activeId, full: mode === "full" });
  useEffect(() => {
    current.current = { activeId, full: mode === "full" };
    renderer.current?.update(current.current);
  }, [activeId, mode]);
  useEffect(() => {
    const container = host.current;
    const canvas = surface.current;
    const rail = track.current?.parentElement;
    if (!container || !canvas || !rail) return;
    let disposed = false;
    let started = false;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting || started) return;
      started = true;
      void import("./timelineRenderer").then(({ createTimelineRenderer }) => {
        if (disposed) return;
        renderer.current = createTimelineRenderer(container, canvas, rail, records);
        renderer.current.update(current.current);
      }).catch(() => { if (!disposed) container.dataset.renderer = "fallback"; });
    }, { rootMargin: "300px" });
    observer.observe(rail);
    return () => { disposed = true; observer.disconnect(); renderer.current?.dispose(); renderer.current = null; };
  }, [records]);
  return (
    <div className="timeline-stage-track" ref={track}>
      <div className="timeline-stage" ref={host} data-renderer="pending">
        <div className="timeline-stage__model-zone" aria-hidden="true" />
        <canvas aria-hidden="true" ref={surface} />
        <button className="timeline-stage__companion" type="button" data-companion-hit tabIndex={-1} aria-label={locale === "zh" ? "与小鸟互动" : "Interact with the bird"} />
      </div>
    </div>
  );
}
