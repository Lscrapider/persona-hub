import type { EffectMode } from "@/core/effect-mode";
import {
  type RuntimeAction,
  type RuntimeSectionId,
  type RuntimeSignal,
} from "@/effects/runtime/archiveRuntimeContract";

export const ARCHIVE_SCENE_ORDER = [
  "index",
  "timeline",
  "projects",
  "logs",
] as const satisfies readonly RuntimeSectionId[];

export type ArchiveRendererState =
  | "initializing"
  | "ready"
  | "fallback"
  | "lost";

export type ArchivePointerFrame = {
  active: boolean;
  velocityX: number;
  velocityY: number;
  x: number;
  y: number;
};

export type ArchiveSemanticPoint = Readonly<{
  active: boolean;
  x: number;
  y: number;
}>;

export type ArchiveSemanticRect = Readonly<{
  height: number;
  width: number;
  x: number;
  y: number;
}>;

export type ArchiveSemanticMap = Readonly<{
  heroScene: ArchiveSemanticRect | null;
  logChoice: ArchiveSemanticPoint | null;
  logReaderNodes: readonly ArchiveSemanticPoint[];
  projectChoices: readonly ArchiveSemanticPoint[];
  projectDetail: ArchiveSemanticPoint | null;
  projectNodes: readonly ArchiveSemanticPoint[];
  timelineNodes: readonly ArchiveSemanticPoint[];
}>;

export type ArchiveMotionSnapshot = {
  activeScene: RuntimeSectionId;
  elapsedMs: number;
  entryEnergy: number;
  interactionAction: RuntimeAction | null;
  interactionEnergy: number;
  interactionSeed: number;
  interactionTarget: string | null;
  logReadProgress: number;
  mode: EffectMode;
  nextScene: RuntimeSectionId;
  pointer: ArchivePointerFrame;
  scrollProgress: number;
  scrollVelocity: number;
  scrollY: number;
  sceneMix: number;
  scenePosition: number;
  semantics: ArchiveSemanticMap;
  sectionProgress: number;
  transitionProgress: number;
  viewportHeight: number;
  viewportWidth: number;
};

export type ArchiveMotionSnapshotRef = {
  current: ArchiveMotionSnapshot;
};

export type ArchiveSectionMetric = Readonly<{
  height: number;
  id: RuntimeSectionId;
  top: number;
}>;

export function clampUnit(value: number) {
  return Math.min(1, Math.max(0, value));
}

export function createArchiveMotionSnapshot(
  mode: EffectMode,
): ArchiveMotionSnapshot {
  return {
    activeScene: "index",
    elapsedMs: 0,
    entryEnergy: 0,
    interactionAction: null,
    interactionEnergy: 0,
    interactionSeed: 0,
    interactionTarget: null,
    logReadProgress: 0,
    mode,
    nextScene: "timeline",
    pointer: {
      active: false,
      velocityX: 0,
      velocityY: 0,
      x: 0.5,
      y: 0.5,
    },
    scrollProgress: 0,
    scrollVelocity: 0,
    scrollY: 0,
    sceneMix: 0,
    scenePosition: 0,
    semantics: {
      heroScene: null,
      logChoice: null,
      logReaderNodes: [],
      projectChoices: [],
      projectDetail: null,
      projectNodes: [],
      timelineNodes: [],
    },
    sectionProgress: 0,
    transitionProgress: 0,
    viewportHeight: 1,
    viewportWidth: 1,
  };
}

export function stableTargetSeed(value: string) {
  let hash = 2_166_136_261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }

  return (hash >>> 0) / 4_294_967_295;
}

export function applyArchiveMotionSignal(
  snapshot: ArchiveMotionSnapshot,
  signal: RuntimeSignal,
) {
  snapshot.interactionAction = signal.action;
  snapshot.interactionTarget = signal.target;
  snapshot.interactionSeed = stableTargetSeed(signal.target);
  snapshot.interactionEnergy =
    signal.action === "charge" || signal.action === "grab"
      ? 1
      : Math.max(snapshot.interactionEnergy, 0.78);
}
