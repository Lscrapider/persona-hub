import {
  isRuntimeSectionId,
  type RuntimeSectionId,
  type RuntimeSignal,
} from "@/effects/runtime/archiveRuntimeContract";

export const PHYSICAL_INTERACTION_EVENT = "scra:physical-interaction";
export const PHYSICAL_CANCEL_REQUEST_EVENT = "scra:physical-cancel-request";

export type PhysicalPointerType = "mouse" | "pen" | "touch";
export type PhysicsPoint = Readonly<{ x: number; y: number }>;
export type PhysicalCancelReason =
  | "movement"
  | "pointercancel"
  | "lost-capture"
  | "capture-failed"
  | "multi-pointer"
  | "blur"
  | "hidden"
  | "lifecycle";

export type PhysicalInteractionSample = Readonly<{
  origin: PhysicsPoint;
  position: PhysicsPoint;
  velocityCssPxPerSecond: PhysicsPoint;
  elapsedMs: number;
  charge: number;
  dragDistanceCssPx: number;
  strength: number;
}>;

type PhysicalInteractionBase = Readonly<{
  pointerId: number;
  pointerType: PhysicalPointerType;
  sequenceId: number;
  surface: RuntimeSectionId;
  target: string;
  sample: PhysicalInteractionSample;
}>;

export type PhysicalInteractionSignal =
  | (PhysicalInteractionBase &
      Readonly<{
        action: "impulse" | "charge" | "grab" | "release";
      }>)
  | (PhysicalInteractionBase &
      Readonly<{
        action: "cancel";
        reason: PhysicalCancelReason;
      }>);

const PHYSICAL_ACTIONS = [
  "impulse",
  "charge",
  "grab",
  "release",
  "cancel",
] as const;

const PHYSICAL_CANCEL_REASONS = [
  "movement",
  "pointercancel",
  "lost-capture",
  "capture-failed",
  "multi-pointer",
  "blur",
  "hidden",
  "lifecycle",
] as const;

function isFinitePoint(value: unknown): value is PhysicsPoint {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<PhysicsPoint>;

  return Number.isFinite(candidate.x) && Number.isFinite(candidate.y);
}

function isPhysicalPointerType(value: unknown): value is PhysicalPointerType {
  return value === "mouse" || value === "pen" || value === "touch";
}

function isNormalizedNumber(value: unknown) {
  return (
    typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1
  );
}

export function isPhysicalInteractionSignal(
  value: unknown,
): value is PhysicalInteractionSignal {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<PhysicalInteractionSignal>;
  const sample = candidate.sample as Partial<PhysicalInteractionSample> | undefined;
  const action = candidate.action;

  if (
    !PHYSICAL_ACTIONS.some((physicalAction) => physicalAction === action) ||
    !isRuntimeSectionId(candidate.surface) ||
    !isPhysicalPointerType(candidate.pointerType) ||
    !Number.isInteger(candidate.pointerId) ||
    !Number.isInteger(candidate.sequenceId) ||
    typeof candidate.target !== "string" ||
    candidate.target.trim().length === 0 ||
    !sample ||
    !isFinitePoint(sample.origin) ||
    !isFinitePoint(sample.position) ||
    !isFinitePoint(sample.velocityCssPxPerSecond) ||
    typeof sample.elapsedMs !== "number" ||
    !Number.isFinite(sample.elapsedMs) ||
    sample.elapsedMs < 0 ||
    typeof sample.dragDistanceCssPx !== "number" ||
    !Number.isFinite(sample.dragDistanceCssPx) ||
    sample.dragDistanceCssPx < 0 ||
    !isNormalizedNumber(sample.charge) ||
    !isNormalizedNumber(sample.strength)
  ) {
    return false;
  }

  if (action !== "cancel") {
    return true;
  }

  return PHYSICAL_CANCEL_REASONS.some(
    (reason) => reason === (candidate as Partial<{ reason: unknown }>).reason,
  );
}

export function toPhysicalRuntimeSignal(
  signal: PhysicalInteractionSignal,
): RuntimeSignal | null {
  if (signal.action === "cancel") {
    return null;
  }

  return {
    action: signal.action,
    source: "pointer",
    target: signal.target,
  };
}
