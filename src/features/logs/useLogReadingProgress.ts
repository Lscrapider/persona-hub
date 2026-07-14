"use client";

import { type RefObject, useEffect } from "react";

import {
  RUNTIME_SIGNAL_EVENT,
  type RuntimeSignal,
} from "@/effects/runtime/archiveRuntimeContract";

export function useLogReadingProgress(
  readerRef: RefObject<HTMLElement | null>,
  logId: string,
  enabled: boolean,
) {
  useEffect(() => {
    const reader = readerRef.current;

    if (!enabled || !reader) {
      return;
    }

    let progressFrame = 0;
    const blocks = Array.from(
      reader.querySelectorAll<HTMLElement>("[data-log-block]"),
    );

    const writeProgress = () => {
      progressFrame = 0;
      const range = Math.max(1, reader.scrollHeight - reader.clientHeight);
      const progress = Math.min(1, Math.max(0, reader.scrollTop / range));
      reader.style.setProperty(
        "--logs-read-progress",
        `${(progress * 100).toFixed(2)}%`,
      );
    };
    const scheduleProgress = () => {
      if (!progressFrame) {
        progressFrame = window.requestAnimationFrame(writeProgress);
      }
    };
    const dispatchRead = (target: string) => {
      const signal: RuntimeSignal = {
        action: "read",
        source: "scroll",
        target,
      };

      reader.dispatchEvent(
        new CustomEvent<RuntimeSignal>(RUNTIME_SIGNAL_EVENT, {
          bubbles: true,
          detail: signal,
        }),
      );
    };

    blocks.forEach((block) => {
      block.dataset.readPhase = "queued";
    });

    const blockObserver =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(
            (entries) => {
              const fallbackFocusTop =
                reader.getBoundingClientRect().top + reader.clientHeight * 0.18;

              for (const entry of entries) {
                const block = entry.target as HTMLElement;

                if (entry.isIntersecting) {
                  if (block.dataset.readPhase !== "mounted") {
                    block.dataset.readPhase = "mounted";
                    const target = block.dataset.runtimeTarget;

                    if (target) {
                      dispatchRead(target);
                    }
                  }
                } else {
                  const focusTop = entry.rootBounds?.top ?? fallbackFocusTop;

                  block.dataset.readPhase =
                    entry.boundingClientRect.bottom <= focusTop
                      ? "stable"
                      : "queued";
                }
              }
            },
            {
              root: reader,
              rootMargin: "-18% 0px -62% 0px",
              threshold: 0,
            },
          );

    if (blockObserver) {
      blocks.forEach((block) => blockObserver.observe(block));
    } else {
      blocks.forEach((block) => {
        block.dataset.readPhase = "mounted";
      });
    }

    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(scheduleProgress);
    const article = reader.querySelector<HTMLElement>(".markdown-article");

    resizeObserver?.observe(reader);
    if (article) {
      resizeObserver?.observe(article);
    }
    reader.addEventListener("scroll", scheduleProgress, { passive: true });
    scheduleProgress();

    return () => {
      if (progressFrame) {
        window.cancelAnimationFrame(progressFrame);
      }

      blockObserver?.disconnect();
      resizeObserver?.disconnect();
      reader.removeEventListener("scroll", scheduleProgress);
      reader.style.removeProperty("--logs-read-progress");
      blocks.forEach((block) => delete block.dataset.readPhase);
    };
  }, [enabled, logId, readerRef]);
}
