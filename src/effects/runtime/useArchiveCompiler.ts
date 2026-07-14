"use client";

import { type RefObject, useEffect } from "react";

import {
  type CompilerPhase,
  RUNTIME_SECTION_IDS,
  type RuntimeSectionId,
  type RuntimeSignal,
} from "@/effects/runtime/archiveRuntimeContract";

type UseArchiveCompilerOptions = Readonly<{
  enabled: boolean;
  onSignal: (signal: RuntimeSignal) => void;
  rootRef: RefObject<HTMLElement | null>;
}>;

const PREWARM_MARGIN_RATIO = 0.18;
const CENTER_LINE_RATIO = 0.5;

function getSectionId(element: HTMLElement): RuntimeSectionId | null {
  const id = element.dataset.runtimeSection;

  return RUNTIME_SECTION_IDS.find((candidate) => candidate === id) ?? null;
}

function getInactivePhase(
  rect: DOMRectReadOnly,
  viewportHeight: number,
): Exclude<CompilerPhase, "mounted"> {
  const centerLine = viewportHeight * CENTER_LINE_RATIO;

  if (rect.bottom <= centerLine) {
    return "stable";
  }

  if (rect.top >= viewportHeight * (1 + PREWARM_MARGIN_RATIO)) {
    return "queued";
  }

  return "resolving";
}

export function useArchiveCompiler({
  enabled,
  onSignal,
  rootRef,
}: UseArchiveCompilerOptions) {
  useEffect(() => {
    const root = rootRef.current;

    if (!enabled || !root) {
      return;
    }

    const sections = Array.from(
      root.querySelectorAll<HTMLElement>("[data-runtime-section]"),
    ).filter((section) => getSectionId(section));
    let activeSection: HTMLElement | null = null;
    let reconciliationFrame = 0;
    let prewarmObserver: IntersectionObserver | null = null;
    let centerObserver: IntersectionObserver | null = null;

    const setPhase = (section: HTMLElement, phase: CompilerPhase) => {
      if (section.dataset.compilerPhase === phase) {
        return;
      }

      section.dataset.compilerPhase = phase;
      const id = getSectionId(section);

      if (!id || (phase !== "resolving" && phase !== "mounted")) {
        return;
      }

      onSignal({
        action: phase === "resolving" ? "resolve" : "mount",
        source: "scroll",
        target: id,
      });
    };

    sections.forEach((section) => {
      section.dataset.compilerPhase = "queued";
    });
    root.dataset.runtimeReady = "true";

    if (typeof IntersectionObserver === "undefined") {
      sections.forEach((section) => {
        section.dataset.compilerPhase = "mounted";
      });

      return () => {
        delete root.dataset.runtimeReady;
        sections.forEach((section) => delete section.dataset.compilerPhase);
      };
    }

    const reconcileCenter = () => {
      const viewportHeight = window.innerHeight;
      const centerLine = viewportHeight * CENTER_LINE_RATIO;
      const nextSection =
        sections.find((section) => {
          const rect = section.getBoundingClientRect();

          return rect.top <= centerLine && rect.bottom >= centerLine;
        }) ?? null;

      activeSection = nextSection;

      if (activeSection) {
        setPhase(activeSection, "mounted");
      }

      sections.forEach((section) => {
        if (section !== activeSection) {
          setPhase(
            section,
            getInactivePhase(section.getBoundingClientRect(), viewportHeight),
          );
        }
      });
    };

    const connectObservers = () => {
      prewarmObserver?.disconnect();
      centerObserver?.disconnect();

      const viewportHeight = Math.max(1, window.innerHeight);
      const prewarmMargin = Math.round(
        viewportHeight * PREWARM_MARGIN_RATIO,
      );
      const centerBandHeight = Math.min(2, viewportHeight);
      const centerTopInset = Math.max(
        0,
        Math.floor((viewportHeight - centerBandHeight) / 2),
      );
      const centerBottomInset = Math.max(
        0,
        viewportHeight - centerBandHeight - centerTopInset,
      );

      prewarmObserver = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            const section = entry.target as HTMLElement;

            if (section === activeSection) {
              continue;
            }

            if (entry.isIntersecting) {
              setPhase(section, "resolving");
              continue;
            }

            setPhase(
              section,
              getInactivePhase(entry.boundingClientRect, window.innerHeight),
            );
          }
        },
        {
          rootMargin: `${prewarmMargin.toString()}px 0px`,
          threshold: 0.01,
        },
      );
      centerObserver = new IntersectionObserver(reconcileCenter, {
        rootMargin:
          `-${centerTopInset.toString()}px 0px ` +
          `-${centerBottomInset.toString()}px 0px`,
        threshold: 0,
      });

      sections.forEach((section) => {
        prewarmObserver?.observe(section);
        centerObserver?.observe(section);
      });
    };

    const handleResize = () => {
      if (reconciliationFrame) {
        window.cancelAnimationFrame(reconciliationFrame);
      }

      reconciliationFrame = window.requestAnimationFrame(() => {
        reconciliationFrame = 0;
        connectObservers();
        reconcileCenter();
      });
    };

    connectObservers();
    reconciliationFrame = window.requestAnimationFrame(() => {
      reconciliationFrame = 0;
      reconcileCenter();
    });
    window.addEventListener("resize", handleResize, { passive: true });
    window.visualViewport?.addEventListener("resize", handleResize, {
      passive: true,
    });

    return () => {
      if (reconciliationFrame) {
        window.cancelAnimationFrame(reconciliationFrame);
      }

      prewarmObserver?.disconnect();
      centerObserver?.disconnect();
      window.removeEventListener("resize", handleResize);
      window.visualViewport?.removeEventListener("resize", handleResize);
      activeSection = null;
      delete root.dataset.runtimeReady;
      sections.forEach((section) => delete section.dataset.compilerPhase);
    };
  }, [enabled, onSignal, rootRef]);
}
