"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

import type { ArchitectureRenderer } from "./architectureRenderer";
import type { ArchitectureFlowStep } from "./projectArchitecture";

/** Frame progress stays outside React; only semantic step changes rerender UI. */
export function useArchitecturePlayback(
  steps: readonly ArchitectureFlowStep[],
  renderer: RefObject<ArchitectureRenderer | null>,
  host: RefObject<HTMLDivElement | null>,
  enabled: boolean,
) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [complete, setComplete] = useState(false);
  const [speed, setSpeed] = useState(2);
  const [revision, setRevision] = useState(0);
  const progress = useRef(0);
  const meter = useRef<HTMLInputElement>(null);
  const pendingProgress = useRef<number | null>(null);
  const step = steps[index];

  useEffect(() => {
    progress.current = pendingProgress.current ?? 0;
    pendingProgress.current = null;
    const total = (index + progress.current) / steps.length;
    if (meter.current) {
      meter.current.value = String(Math.round(total * 1000));
      meter.current.style.setProperty("--flow-progress", `${total * 100}%`);
      meter.current.setAttribute("aria-valuetext", `${Math.round(total * 100)}%`);
    }
    const instance = renderer.current;
    instance?.setPlayback(step ? { ...step, progress: progress.current } : null);
    return () => instance?.setPlayback(null);
  }, [step, index, revision, renderer, steps.length]);

  useEffect(() => {
    if (!step || !playing || !enabled || complete) return;
    let frame = 0;
    let previous = 0;
    let visible = false;
    let finished = false;
    const tick = (time: number) => {
      if (previous) progress.current = Math.min(1, progress.current + Math.min(time - previous, 80) * speed / 3600);
      previous = time;
      renderer.current?.setPlayback({ ...step, progress: progress.current });
      const total = (index + progress.current) / steps.length;
      if (meter.current) {
        meter.current.value = String(Math.round(total * 1000));
        meter.current.style.setProperty("--flow-progress", `${total * 100}%`);
        meter.current.setAttribute("aria-valuetext", `${Math.round(total * 100)}%`);
      }
      if (progress.current >= 1) {
        finished = true;
        if (index + 1 < steps.length) setIndex(index + 1);
        else { setComplete(true); setPlaying(false); }
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    const sync = () => {
      cancelAnimationFrame(frame);
      previous = 0;
      if (visible && !document.hidden && !finished) frame = requestAnimationFrame(tick);
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? false;
      sync();
    }, { threshold: 0.05 });
    if (host.current) observer.observe(host.current);
    document.addEventListener("visibilitychange", sync);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, [complete, enabled, host, index, playing, renderer, revision, speed, step, steps.length]);

  const seek = (next: number) => {
    pendingProgress.current = 0;
    setPlaying(false);
    setComplete(false);
    setIndex(Math.max(0, Math.min(steps.length - 1, next)));
    setRevision((value) => value + 1);
  };
  const seekFraction = (fraction: number) => {
    const position = Math.max(0, Math.min(1, fraction)) * steps.length;
    const nextIndex = Math.min(steps.length - 1, Math.floor(position));
    pendingProgress.current = position - nextIndex;
    setPlaying(false);
    setComplete(fraction >= 1);
    setIndex(nextIndex);
    setRevision((value) => value + 1);
  };
  const replay = () => {
    pendingProgress.current = 0;
    setIndex(0);
    setComplete(false);
    setPlaying(true);
    setRevision((value) => value + 1);
  };
  return { index, step, playing, complete, speed, meter, seek, seekFraction, replay, toggle: () => setPlaying((value) => !value), toggleSpeed: () => setSpeed((value) => value === 1 ? 2 : 1) };
}
