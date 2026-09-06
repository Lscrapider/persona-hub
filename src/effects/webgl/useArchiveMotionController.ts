"use client";

import { type RefObject, useCallback, useEffect, useRef } from "react";

import type { EffectMode } from "@/core/effect-mode";
import {
  isRuntimeSectionId,
  type RuntimeSignal,
} from "@/effects/runtime/archiveRuntimeContract";

import {
  ARCHIVE_SCENE_ORDER,
  applyArchiveMotionSignal,
  clampUnit,
  createArchiveMotionSnapshot,
  type ArchiveMotionSnapshot,
  type ArchiveSectionMetric,
  type ArchiveSemanticMap,
  type ArchiveSemanticPoint,
} from "./archiveStageContract";

type UseArchiveMotionControllerOptions = Readonly<{
  enabled: boolean;
  mode: EffectMode;
  rootRef: RefObject<HTMLElement | null>;
}>;

type LogsProgressDetail = Readonly<{
  logId?: unknown;
  progress?: unknown;
}>;

const TRANSITION_VIEWPORT_SPAN = 0.64;
const MAX_PROJECT_NODES = 12;
const MAX_LOG_READER_NODES = 12;

function measureSections(root: HTMLElement): ArchiveSectionMetric[] {
  const scrollY = window.scrollY;

  return Array.from(
    root.querySelectorAll<HTMLElement>("[data-runtime-section]"),
  )
    .flatMap((section) => {
      const id = section.dataset.runtimeSection;

      if (!isRuntimeSectionId(id)) {
        return [];
      }

      const rect = section.getBoundingClientRect();

      return [
        {
          height: Math.max(1, rect.height),
          id,
          top: rect.top + scrollY,
        },
      ];
    })
    .sort(
      (left, right) =>
        ARCHIVE_SCENE_ORDER.indexOf(left.id) -
        ARCHIVE_SCENE_ORDER.indexOf(right.id),
    );
}

function isElementActive(element: HTMLElement) {
  return (
    element.dataset.selected === "true" ||
    element.dataset.motionActive === "true" ||
    element.getAttribute("aria-pressed") === "true"
  );
}

function centerPoint(element: HTMLElement): ArchiveSemanticPoint {
  const rect = element.getBoundingClientRect();

  return {
    active: isElementActive(element),
    x: rect.left + rect.width * 0.5,
    y: rect.top + window.scrollY + rect.height * 0.5,
  };
}

function edgePoint(
  element: HTMLElement,
  edge: "left" | "right",
): ArchiveSemanticPoint {
  const rect = element.getBoundingClientRect();

  return {
    active: isElementActive(element),
    x: edge === "left" ? rect.left : rect.right,
    y: rect.top + window.scrollY + rect.height * 0.5,
  };
}

function measurePathPoints(path: SVGPathElement): ArchiveSemanticPoint[] {
  const matrix = path.getScreenCTM();

  if (!matrix) {
    return [];
  }

  const length = path.getTotalLength();

  return Array.from({ length: MAX_LOG_READER_NODES }, (_, index) => {
    const progress = index / Math.max(1, MAX_LOG_READER_NODES - 1);
    const localPoint = path.getPointAtLength(length * progress);
    const screenPoint = new DOMPoint(localPoint.x, localPoint.y).matrixTransform(
      matrix,
    );

    return {
      active: true,
      x: screenPoint.x,
      y: screenPoint.y + window.scrollY,
    };
  });
}

function measureSemantics(root: HTMLElement): ArchiveSemanticMap {
  const heroSceneElement = root.querySelector<HTMLElement>(".home-hero__scene");
  const heroSceneRect = heroSceneElement?.getBoundingClientRect();
  const projectChoices = Array.from(
    root.querySelectorAll<HTMLElement>(
      '[data-webgl-anchor="project-choice"]',
    ),
    (element) => edgePoint(element, "left"),
  );
  const projectDetailElement = root.querySelector<HTMLElement>(
    '[data-webgl-anchor="project-detail"]',
  );
  const projectNodes = Array.from(
    root.querySelectorAll<HTMLElement>('[data-webgl-anchor="project-node"]'),
  )
    .slice(0, MAX_PROJECT_NODES)
    .map((element) => edgePoint(element, "right"));
  const selectedLogChoice =
    root.querySelector<HTMLElement>(
      '[data-webgl-anchor="log-choice"][data-selected="true"]',
    ) ??
    root.querySelector<HTMLElement>('[data-webgl-anchor="log-choice"]');
  const logReaderPath = root.querySelector<SVGPathElement>(
    '[data-webgl-anchor="log-reader-boundary"]',
  );

  return {
    heroScene: heroSceneRect
      ? {
          height: Math.max(1, heroSceneRect.height),
          width: Math.max(1, heroSceneRect.width),
          x: heroSceneRect.left,
          y: heroSceneRect.top + window.scrollY,
        }
      : null,
    logChoice: selectedLogChoice
      ? edgePoint(selectedLogChoice, "right")
      : null,
    logReaderNodes: logReaderPath ? measurePathPoints(logReaderPath) : [],
    projectChoices,
    projectDetail: projectDetailElement
      ? centerPoint(projectDetailElement)
      : null,
    projectNodes,
  };
}

function smootherStep(value: number) {
  const amount = clampUnit(value);

  return amount * amount * amount * (amount * (amount * 6 - 15) + 10);
}

function resolveScene(
  snapshot: ArchiveMotionSnapshot,
  metrics: readonly ArchiveSectionMetric[],
) {
  if (!metrics.length) {
    return;
  }

  const viewportCenter = snapshot.scrollY + snapshot.viewportHeight * 0.52;
  const halfTransition =
    snapshot.viewportHeight * TRANSITION_VIEWPORT_SPAN * 0.5;
  let scenePosition = 0;

  for (let index = 1; index < metrics.length; index += 1) {
    const boundary = metrics[index]!.top;
    const transitionStart = boundary - halfTransition;
    const transitionEnd = boundary + halfTransition;

    if (viewportCenter < transitionStart) {
      break;
    }

    if (viewportCenter <= transitionEnd) {
      scenePosition =
        index -
        1 +
        smootherStep(
          (viewportCenter - transitionStart) /
            Math.max(1, transitionEnd - transitionStart),
        );
      break;
    }

    scenePosition = index;
  }

  const maxSceneIndex = ARCHIVE_SCENE_ORDER.length - 1;
  const boundedPosition = Math.max(
    0,
    Math.min(maxSceneIndex, scenePosition),
  );
  const lowerIndex = Math.floor(boundedPosition);
  const upperIndex = Math.min(maxSceneIndex, Math.ceil(boundedPosition));
  const activeIndex = Math.min(maxSceneIndex, Math.round(boundedPosition));
  const activeMetric = metrics[activeIndex] ?? metrics[0]!;
  const sectionProgress = clampUnit(
    (viewportCenter - activeMetric.top) / activeMetric.height,
  );

  snapshot.activeScene = ARCHIVE_SCENE_ORDER[activeIndex]!;
  snapshot.nextScene = ARCHIVE_SCENE_ORDER[upperIndex]!;
  snapshot.sceneMix = boundedPosition - lowerIndex;
  snapshot.scenePosition = boundedPosition;
  snapshot.sectionProgress = sectionProgress;
  snapshot.transitionProgress = snapshot.sceneMix;
}

export function useArchiveMotionController({
  enabled,
  mode,
  rootRef,
}: UseArchiveMotionControllerOptions) {
  const snapshotRef = useRef(createArchiveMotionSnapshot(mode));
  const previousEnabledRef = useRef(enabled);

  const applySignal = useCallback((signal: RuntimeSignal) => {
    applyArchiveMotionSignal(snapshotRef.current, signal);
  }, []);

  useEffect(() => {
    const snapshot = snapshotRef.current;
    snapshot.mode = mode;

    if (enabled && !previousEnabledRef.current) {
      snapshot.entryEnergy = 1;
    }

    previousEnabledRef.current = enabled;
  }, [enabled, mode]);

  useEffect(() => {
    const root = rootRef.current;

    if (!root) {
      return;
    }

    const snapshot = snapshotRef.current;
    let metrics = measureSections(root);
    snapshot.semantics = measureSemantics(root);
    let frameId = 0;
    let measureBeforeCommit = false;
    let lastScrollY = window.scrollY;
    let lastScrollTime = window.performance.now();
    let lastPointerX = document.documentElement.clientWidth * 0.5;
    let lastPointerY = document.documentElement.clientHeight * 0.5;
    let lastPointerTime = lastScrollTime;

    const commit = () => {
      frameId = 0;

      if (measureBeforeCommit) {
        metrics = measureSections(root);
        snapshot.semantics = measureSemantics(root);
        measureBeforeCommit = false;
      }

      const now = window.performance.now();
      const scrollY = window.scrollY;
      const viewportWidth = Math.max(
        1,
        document.documentElement.clientWidth,
      );
      const viewportHeight = Math.max(
        1,
        document.documentElement.clientHeight,
      );
      const elapsed = Math.max(8, now - lastScrollTime);
      const rawVelocity = ((scrollY - lastScrollY) / elapsed) * 16.667;
      const maxScroll = Math.max(
        1,
        document.documentElement.scrollHeight - viewportHeight,
      );

      snapshot.viewportWidth = viewportWidth;
      snapshot.viewportHeight = viewportHeight;
      snapshot.scrollY = scrollY;
      snapshot.scrollProgress = clampUnit(scrollY / maxScroll);
      snapshot.scrollVelocity =
        snapshot.scrollVelocity * 0.72 +
        Math.max(-3, Math.min(3, rawVelocity)) * 0.28;
      resolveScene(snapshot, metrics);

      root.dataset.activeScene = snapshot.activeScene;
      root.style.setProperty(
        "--motion-section-progress",
        snapshot.sectionProgress.toFixed(4),
      );
      root.style.setProperty(
        "--motion-scene-position",
        snapshot.scenePosition.toFixed(4),
      );
      root.style.setProperty(
        "--motion-scroll-progress",
        snapshot.scrollProgress.toFixed(4),
      );
      root.style.setProperty(
        "--motion-scroll-shift",
        `${Math.max(-8, Math.min(8, -snapshot.scrollVelocity * 2.2)).toFixed(2)}px`,
      );

      lastScrollY = scrollY;
      lastScrollTime = now;
    };

    const scheduleCommit = () => {
      if (!frameId) {
        frameId = window.requestAnimationFrame(commit);
      }
    };
    const scheduleRemeasure = () => {
      measureBeforeCommit = true;
      scheduleCommit();
    };
    const handlePointerMove = (event: PointerEvent) => {
      if (!enabled || mode !== "full" || event.pointerType !== "mouse") {
        return;
      }

      const now = window.performance.now();
      const elapsed = Math.max(8, now - lastPointerTime);
      const pointer = snapshot.pointer;
      const viewportWidth = Math.max(
        1,
        document.documentElement.clientWidth,
      );
      const viewportHeight = Math.max(
        1,
        document.documentElement.clientHeight,
      );

      pointer.active = true;
      pointer.x = clampUnit(event.clientX / viewportWidth);
      pointer.y = clampUnit(event.clientY / viewportHeight);
      pointer.velocityX =
        pointer.velocityX * 0.66 +
        ((event.clientX - lastPointerX) / elapsed) * 0.34;
      pointer.velocityY =
        pointer.velocityY * 0.66 +
        ((event.clientY - lastPointerY) / elapsed) * 0.34;
      root.style.setProperty("--motion-pointer-x", pointer.x.toFixed(4));
      root.style.setProperty("--motion-pointer-y", pointer.y.toFixed(4));
      lastPointerX = event.clientX;
      lastPointerY = event.clientY;
      lastPointerTime = now;
    };
    const clearPointer = (event: PointerEvent) => {
      if (!root.contains(event.relatedTarget as Node | null)) {
        snapshot.pointer.active = false;
      }
    };
    const handleLogsProgress = (event: Event) => {
      const detail = (event as CustomEvent<LogsProgressDetail>).detail;

      if (
        !detail ||
        typeof detail.logId !== "string" ||
        typeof detail.progress !== "number" ||
        !Number.isFinite(detail.progress)
      ) {
        return;
      }

      snapshot.logReadProgress = clampUnit(detail.progress);
    };

    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(scheduleRemeasure);
    const mutationObserver =
      typeof MutationObserver === "undefined"
        ? null
        : new MutationObserver(scheduleRemeasure);

    resizeObserver?.observe(root);
    mutationObserver?.observe(root, {
      attributeFilter: [
        "aria-pressed",
        "data-motion-active",
        "data-selected",
        "open",
      ],
      attributes: true,
      childList: true,
      subtree: true,
    });
    window.addEventListener("scroll", scheduleCommit, { passive: true });
    window.addEventListener("resize", scheduleRemeasure, { passive: true });
    root.addEventListener("scroll", scheduleRemeasure, {
      capture: true,
      passive: true,
    });
    root.addEventListener("pointermove", handlePointerMove, { passive: true });
    root.addEventListener("pointerout", clearPointer, { passive: true });
    root.addEventListener("scra:logs-progress", handleLogsProgress);
    commit();

    return () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }

      resizeObserver?.disconnect();
      mutationObserver?.disconnect();
      window.removeEventListener("scroll", scheduleCommit);
      window.removeEventListener("resize", scheduleRemeasure);
      root.removeEventListener("scroll", scheduleRemeasure, true);
      root.removeEventListener("pointermove", handlePointerMove);
      root.removeEventListener("pointerout", clearPointer);
      root.removeEventListener("scra:logs-progress", handleLogsProgress);
      delete root.dataset.activeScene;
      root.style.removeProperty("--motion-section-progress");
      root.style.removeProperty("--motion-scene-position");
      root.style.removeProperty("--motion-scroll-progress");
      root.style.removeProperty("--motion-scroll-shift");
      root.style.removeProperty("--motion-pointer-x");
      root.style.removeProperty("--motion-pointer-y");
    };
  }, [enabled, mode, rootRef]);

  return { applySignal, snapshotRef };
}
