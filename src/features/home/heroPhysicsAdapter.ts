import {
  HERO_FIELD_COLUMNS,
  HERO_FIELD_ROWS,
  HERO_FIXED_STEP_MS,
  HERO_MAX_ELAPSED_MS,
  HERO_MAX_SUBSTEPS,
  MAX_LIVE_IMPULSES,
} from "@/effects/physics/physicsConstants";
import {
  createPhysicsKernel,
  type PhysicsFieldView,
} from "@/effects/physics/physicsKernel";
import type { PhysicalInteractionSignal } from "@/effects/physics/physicalInteractionContract";
import type { SceneBounds } from "@/features/home/kineticTypeFieldScene";

export type HeroPhysicsFrame = Readonly<{
  active: boolean;
  field: PhysicsFieldView;
  maxBoundaryDisplacement: number;
}>;

export type HeroPhysicsAdapter = Readonly<{
  frame: HeroPhysicsFrame;
  applySignal: (
    signal: PhysicalInteractionSignal,
    surfaceRect: DOMRectReadOnly,
    bounds: SceneBounds,
  ) => void;
  advance: (nowMs: number) => boolean;
  resize: (bounds: SceneBounds) => void;
  reset: () => void;
}>;

type MutableHeroPhysicsFrame = {
  active: boolean;
  field: PhysicsFieldView;
  maxBoundaryDisplacement: number;
};

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function getMaxBoundaryDisplacement(bounds: SceneBounds) {
  return Math.min(36, Math.min(bounds.width, bounds.height) * 0.035);
}

export function createHeroPhysicsAdapter(
  initialBounds: SceneBounds,
): HeroPhysicsAdapter {
  const initialMaxDisplacement = getMaxBoundaryDisplacement(initialBounds);
  const kernel = createPhysicsKernel({
    columns: HERO_FIELD_COLUMNS,
    rows: HERO_FIELD_ROWS,
    impulseCapacity: MAX_LIVE_IMPULSES,
    fixedStepMs: HERO_FIXED_STEP_MS,
    maxElapsedMs: HERO_MAX_ELAPSED_MS,
    maxSubsteps: HERO_MAX_SUBSTEPS,
    maxDisplacement: initialMaxDisplacement,
  });
  const frame: MutableHeroPhysicsFrame = {
    active: false,
    field: kernel.field,
    maxBoundaryDisplacement: initialMaxDisplacement,
  };
  let width = Math.max(1, initialBounds.width);
  let height = Math.max(1, initialBounds.height);

  kernel.resize(width, height, initialMaxDisplacement);

  const resize = (bounds: SceneBounds) => {
    width = Math.max(1, bounds.width);
    height = Math.max(1, bounds.height);
    frame.maxBoundaryDisplacement = getMaxBoundaryDisplacement(bounds);
    kernel.resize(width, height, frame.maxBoundaryDisplacement);
  };

  const applySignal = (
    signal: PhysicalInteractionSignal,
    surfaceRect: DOMRectReadOnly,
    bounds: SceneBounds,
  ) => {
    if (signal.action === "cancel") {
      kernel.apply({ kind: "cancel" });
      frame.active = kernel.advance(window.performance.now());
      return;
    }

    const scaleX = bounds.width / Math.max(1, surfaceRect.width);
    const scaleY = bounds.height / Math.max(1, surfaceRect.height);
    const x = clamp(
      (signal.sample.position.x - surfaceRect.left) * scaleX,
      0,
      bounds.width,
    );
    const y = clamp(
      (signal.sample.position.y - surfaceRect.top) * scaleY,
      0,
      bounds.height,
    );
    const velocityX = signal.sample.velocityCssPxPerSecond.x * scaleX;
    const velocityY = signal.sample.velocityCssPxPerSecond.y * scaleY;

    if (signal.action === "impulse") {
      kernel.apply({
        kind: "impulse",
        x,
        y,
        radius: Math.min(bounds.width, bounds.height) * 0.075,
        strength: Math.max(0.72, signal.sample.strength),
        velocityX,
        velocityY,
      });
    } else if (signal.action === "charge" || signal.action === "grab") {
      kernel.apply({
        kind: signal.action,
        x,
        y,
        strength: signal.sample.charge,
      });
    } else {
      kernel.apply({
        kind: "release",
        x,
        y,
        strength: signal.sample.strength,
        velocityX,
        velocityY,
      });
    }

    frame.active = true;
  };

  const advance = (nowMs: number) => {
    frame.active = kernel.advance(nowMs);
    return frame.active;
  };

  const reset = () => {
    kernel.reset();
    frame.active = false;
  };

  return Object.freeze({
    frame,
    applySignal,
    advance,
    resize,
    reset,
  });
}
