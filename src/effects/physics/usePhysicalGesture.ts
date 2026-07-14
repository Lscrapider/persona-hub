"use client";

import { type RefObject, useEffect, useRef } from "react";

import {
  getPhysicalReleaseStrength,
  MAX_CHARGE_MS,
  MAX_RELEASE_SPEED_CSS_PX_PER_SECOND,
  MOUSE_HOLD_THRESHOLD_MS,
  MOUSE_MOVEMENT_TOLERANCE_PX,
  TOUCH_HOLD_THRESHOLD_MS,
  TOUCH_MOVEMENT_TOLERANCE_PX,
} from "@/effects/physics/physicsConstants";
import {
  PHYSICAL_CANCEL_REQUEST_EVENT,
  PHYSICAL_INTERACTION_EVENT,
  type PhysicalCancelReason,
  type PhysicalInteractionSignal,
  type PhysicalPointerType,
} from "@/effects/physics/physicalInteractionContract";
import {
  isRuntimeSectionId,
  type RuntimeSectionId,
} from "@/effects/runtime/archiveRuntimeContract";

const SAFE_SURFACE_SELECTOR = "[data-physics-surface][data-physics-target]";
const INTERACTIVE_OR_READING_SELECTOR = [
  "[data-physics-ignore]",
  "a",
  "button",
  "input",
  "select",
  "textarea",
  "label",
  "option",
  "summary",
  "details",
  "[contenteditable]:not([contenteditable=\"false\"])",
  "[draggable=\"true\"]",
  "[tabindex]:not([tabindex=\"-1\"])",
  "[role=\"button\"]",
  "[role=\"link\"]",
  "[role=\"menuitem\"]",
  "[role=\"option\"]",
  "[role=\"slider\"]",
  "[role=\"switch\"]",
  "[role=\"tab\"]",
  "[role=\"textbox\"]",
  "article",
  "p",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "li",
  "dt",
  "dd",
  "time",
  "pre",
  "code",
  "blockquote",
].join(",");

const VELOCITY_SAMPLE_COUNT = 4;
const QUICK_TAP_STRENGTH = 0.42;

type GestureCandidate = {
  active: boolean;
  captured: boolean;
  input: "pointer" | "touch";
  moved: boolean;
  pointerId: number;
  pointerType: PhysicalPointerType;
  sequenceId: number;
  surface: HTMLElement;
  section: RuntimeSectionId;
  target: string;
  originX: number;
  originY: number;
  currentX: number;
  currentY: number;
  startTime: number;
  activatedAt: number;
  timer: number;
  moveFrame: number;
  sampleCursor: number;
  sampleCount: number;
  sampleTimes: Float64Array;
  sampleXs: Float32Array;
  sampleYs: Float32Array;
};

type UsePhysicalGestureOptions = Readonly<{
  enabled: boolean;
  rootRef: RefObject<HTMLElement | null>;
}>;

function isSupportedPointerType(value: string): value is PhysicalPointerType {
  return value === "mouse" || value === "pen" || value === "touch";
}

function hasRangeSelection() {
  const selection = window.getSelection();

  return Boolean(selection && !selection.isCollapsed);
}

function findSafeSurface(root: HTMLElement, eventTarget: EventTarget | null) {
  if (!(eventTarget instanceof Element)) {
    return null;
  }

  const surface = eventTarget.closest<HTMLElement>(SAFE_SURFACE_SELECTOR);

  if (!surface || !root.contains(surface)) {
    return null;
  }

  const blocked = eventTarget.closest(INTERACTIVE_OR_READING_SELECTOR);

  if (blocked && surface.contains(blocked)) {
    return null;
  }

  return surface;
}

function getThreshold(pointerType: PhysicalPointerType) {
  return pointerType === "touch"
    ? TOUCH_HOLD_THRESHOLD_MS
    : MOUSE_HOLD_THRESHOLD_MS;
}

function getMovementTolerance(pointerType: PhysicalPointerType) {
  return pointerType === "touch"
    ? TOUCH_MOVEMENT_TOLERANCE_PX
    : MOUSE_MOVEMENT_TOLERANCE_PX;
}

function getDistance(candidate: GestureCandidate) {
  return Math.hypot(
    candidate.currentX - candidate.originX,
    candidate.currentY - candidate.originY,
  );
}

function findTouch(touches: TouchList, identifier: number) {
  for (let index = 0; index < touches.length; index += 1) {
    const touch = touches.item(index);

    if (touch?.identifier === identifier) {
      return touch;
    }
  }

  return null;
}

function recordVelocitySample(
  candidate: GestureCandidate,
  x: number,
  y: number,
  time: number,
) {
  const slot = candidate.sampleCursor;
  candidate.sampleTimes[slot] = time;
  candidate.sampleXs[slot] = x;
  candidate.sampleYs[slot] = y;
  candidate.sampleCursor = (slot + 1) % VELOCITY_SAMPLE_COUNT;
  candidate.sampleCount = Math.min(
    candidate.sampleCount + 1,
    VELOCITY_SAMPLE_COUNT,
  );
}

function getVelocity(candidate: GestureCandidate) {
  if (candidate.sampleCount < 2) {
    return { x: 0, y: 0 };
  }

  const newestSlot =
    (candidate.sampleCursor - 1 + VELOCITY_SAMPLE_COUNT) % VELOCITY_SAMPLE_COUNT;
  const oldestSlot =
    (candidate.sampleCursor - candidate.sampleCount + VELOCITY_SAMPLE_COUNT) %
    VELOCITY_SAMPLE_COUNT;
  const elapsed =
    candidate.sampleTimes[newestSlot]! - candidate.sampleTimes[oldestSlot]!;

  if (elapsed <= 0) {
    return { x: 0, y: 0 };
  }

  const scale = 1_000 / elapsed;
  let x =
    (candidate.sampleXs[newestSlot]! - candidate.sampleXs[oldestSlot]!) * scale;
  let y =
    (candidate.sampleYs[newestSlot]! - candidate.sampleYs[oldestSlot]!) * scale;
  const speed = Math.hypot(x, y);

  if (speed > MAX_RELEASE_SPEED_CSS_PX_PER_SECOND) {
    const cap = MAX_RELEASE_SPEED_CSS_PX_PER_SECOND / speed;
    x *= cap;
    y *= cap;
  }

  return { x, y };
}

function dispatchSignal(
  candidate: GestureCandidate,
  action: PhysicalInteractionSignal["action"],
  reason?: PhysicalCancelReason,
) {
  const now = window.performance.now();
  const elapsedMs = Math.max(0, now - candidate.startTime);
  const charge = candidate.active
    ? Math.min(Math.max(0, now - candidate.activatedAt) / MAX_CHARGE_MS, 1)
    : 0;
  const dragDistanceCssPx = getDistance(candidate);
  const velocity = getVelocity(candidate);
  const speed = Math.hypot(velocity.x, velocity.y);
  const strength =
    action === "impulse"
      ? QUICK_TAP_STRENGTH
      : getPhysicalReleaseStrength(charge, dragDistanceCssPx, speed);
  const baseSignal = {
    action,
    pointerId: candidate.pointerId,
    pointerType: candidate.pointerType,
    sequenceId: candidate.sequenceId,
    surface: candidate.section,
    target: candidate.target,
    sample: {
      origin: { x: candidate.originX, y: candidate.originY },
      position: { x: candidate.currentX, y: candidate.currentY },
      velocityCssPxPerSecond: velocity,
      elapsedMs,
      charge,
      dragDistanceCssPx,
      strength,
    },
  };
  const signal =
    action === "cancel"
      ? ({ ...baseSignal, action, reason: reason ?? "lifecycle" } as const)
      : baseSignal;

  candidate.surface.dispatchEvent(
    new CustomEvent<PhysicalInteractionSignal>(PHYSICAL_INTERACTION_EVENT, {
      bubbles: true,
      detail: signal as PhysicalInteractionSignal,
    }),
  );
}

export function usePhysicalGesture({
  enabled,
  rootRef,
}: UsePhysicalGestureOptions) {
  const sequenceRef = useRef(0);

  useEffect(() => {
    const root = rootRef.current;

    if (!enabled || !root) {
      return;
    }

    let candidate: GestureCandidate | null = null;
    let suppressedPointerDownId = -1;
    let suppressTouchStart = false;

    const clearCandidate = () => {
      const current = candidate;

      if (!current) {
        return null;
      }

      candidate = null;
      window.clearTimeout(current.timer);

      if (current.moveFrame) {
        window.cancelAnimationFrame(current.moveFrame);
      }

      if (
        current.input === "pointer" &&
        current.captured &&
        current.surface.hasPointerCapture(current.pointerId)
      ) {
        current.surface.releasePointerCapture(current.pointerId);
      }

      return current;
    };

    const cancelCandidate = (reason: PhysicalCancelReason) => {
      const current = clearCandidate();

      if (current) {
        dispatchSignal(current, "cancel", reason);
      }
    };

    const activateCandidate = () => {
      const current = candidate;

      if (!current || current.active) {
        return;
      }

      current.active = true;
      current.activatedAt = window.performance.now();

      if (current.input === "pointer") {
        try {
          current.surface.setPointerCapture(current.pointerId);
          current.captured = true;
        } catch {
          cancelCandidate("capture-failed");
          return;
        }
      }

      dispatchSignal(current, "charge");
    };

    const beginCandidate = (
      surface: HTMLElement,
      section: RuntimeSectionId,
      target: string,
      pointerId: number,
      pointerType: PhysicalPointerType,
      x: number,
      y: number,
      input: GestureCandidate["input"],
    ) => {
      const startTime = window.performance.now();
      const nextCandidate: GestureCandidate = {
        active: false,
        captured: false,
        input,
        moved: false,
        pointerId,
        pointerType,
        sequenceId: sequenceRef.current + 1,
        surface,
        section,
        target,
        originX: x,
        originY: y,
        currentX: x,
        currentY: y,
        startTime,
        activatedAt: 0,
        timer: 0,
        moveFrame: 0,
        sampleCursor: 0,
        sampleCount: 0,
        sampleTimes: new Float64Array(VELOCITY_SAMPLE_COUNT),
        sampleXs: new Float32Array(VELOCITY_SAMPLE_COUNT),
        sampleYs: new Float32Array(VELOCITY_SAMPLE_COUNT),
      };

      sequenceRef.current = nextCandidate.sequenceId;
      recordVelocitySample(nextCandidate, x, y, startTime);
      nextCandidate.timer = window.setTimeout(
        activateCandidate,
        getThreshold(pointerType),
      );
      candidate = nextCandidate;
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (event.pointerId === suppressedPointerDownId) {
        suppressedPointerDownId = -1;
        return;
      }

      if (
        candidate ||
        !event.isPrimary ||
        event.button !== 0 ||
        event.pointerType === "touch" ||
        !isSupportedPointerType(event.pointerType) ||
        hasRangeSelection()
      ) {
        return;
      }

      const surface = findSafeSurface(root, event.target);
      const section = surface?.dataset.physicsSurface;
      const target = surface?.dataset.physicsTarget?.trim();

      if (!surface || !isRuntimeSectionId(section) || !target) {
        return;
      }

      beginCandidate(
        surface,
        section,
        target,
        event.pointerId,
        event.pointerType,
        event.clientX,
        event.clientY,
        "pointer",
      );
    };

    const handleWindowPointerDown = (event: PointerEvent) => {
      if (event.pointerType === "touch") {
        return;
      }

      if (candidate && event.pointerId !== candidate.pointerId) {
        const blockedPointerId = event.pointerId;

        suppressedPointerDownId = blockedPointerId;
        window.queueMicrotask(() => {
          if (suppressedPointerDownId === blockedPointerId) {
            suppressedPointerDownId = -1;
          }
        });
        cancelCandidate("multi-pointer");
      }
    };

    const commitGrab = () => {
      const current = candidate;

      if (!current) {
        return;
      }

      current.moveFrame = 0;

      if (current.active) {
        dispatchSignal(current, "grab");
      }
    };

    const handlePointerMove = (event: PointerEvent) => {
      const current = candidate;

      if (
        !current ||
        current.input !== "pointer" ||
        event.pointerId !== current.pointerId
      ) {
        return;
      }

      current.currentX = event.clientX;
      current.currentY = event.clientY;
      recordVelocitySample(
        current,
        event.clientX,
        event.clientY,
        window.performance.now(),
      );

      const distance = getDistance(current);
      current.moved = current.moved || distance > 0;

      if (!current.active) {
        if (distance > getMovementTolerance(current.pointerType)) {
          cancelCandidate("movement");
        }

        return;
      }

      event.preventDefault();

      if (distance <= getMovementTolerance(current.pointerType)) {
        return;
      }

      if (!current.moveFrame) {
        current.moveFrame = window.requestAnimationFrame(commitGrab);
      }
    };

    const handlePointerUp = (event: PointerEvent) => {
      const current = candidate;

      if (
        !current ||
        current.input !== "pointer" ||
        event.pointerId !== current.pointerId
      ) {
        return;
      }

      current.currentX = event.clientX;
      current.currentY = event.clientY;
      recordVelocitySample(
        current,
        event.clientX,
        event.clientY,
        window.performance.now(),
      );

      if (
        !current.active &&
        getDistance(current) > getMovementTolerance(current.pointerType)
      ) {
        cancelCandidate("movement");
        return;
      }

      const completed = clearCandidate();

      if (!completed) {
        return;
      }

      dispatchSignal(completed, completed.active ? "release" : "impulse");
    };

    const handlePointerCancel = (event: PointerEvent) => {
      if (
        candidate?.input === "pointer" &&
        candidate.pointerId === event.pointerId
      ) {
        cancelCandidate("pointercancel");
      }
    };

    const handleLostPointerCapture = (event: PointerEvent) => {
      if (
        candidate?.input === "pointer" &&
        candidate.pointerId === event.pointerId
      ) {
        cancelCandidate("lost-capture");
      }
    };

    const handleTouchStart = (event: TouchEvent) => {
      if (suppressTouchStart) {
        suppressTouchStart = false;
        return;
      }

      if (candidate || event.touches.length !== 1 || hasRangeSelection()) {
        return;
      }

      const touch = event.changedTouches.item(0) ?? event.touches.item(0);
      const surface = findSafeSurface(root, event.target);
      const section = surface?.dataset.physicsSurface;
      const target = surface?.dataset.physicsTarget?.trim();

      if (!touch || !surface || !isRuntimeSectionId(section) || !target) {
        return;
      }

      beginCandidate(
        surface,
        section,
        target,
        touch.identifier,
        "touch",
        touch.clientX,
        touch.clientY,
        "touch",
      );
    };

    const handleWindowTouchStart = (event: TouchEvent) => {
      if (!candidate) {
        return;
      }

      suppressTouchStart = true;
      window.queueMicrotask(() => {
        suppressTouchStart = false;
      });
      cancelCandidate("multi-pointer");
    };

    const handleTouchMove = (event: TouchEvent) => {
      const current = candidate;

      if (!current || current.input !== "touch") {
        return;
      }

      const touch = findTouch(event.touches, current.pointerId);

      if (!touch) {
        return;
      }

      current.currentX = touch.clientX;
      current.currentY = touch.clientY;
      recordVelocitySample(
        current,
        touch.clientX,
        touch.clientY,
        window.performance.now(),
      );

      const distance = getDistance(current);
      current.moved = current.moved || distance > 0;

      if (!current.active) {
        if (distance > TOUCH_MOVEMENT_TOLERANCE_PX) {
          cancelCandidate("movement");
        }

        return;
      }

      if (event.cancelable) {
        event.preventDefault();
      }

      if (distance > TOUCH_MOVEMENT_TOLERANCE_PX && !current.moveFrame) {
        current.moveFrame = window.requestAnimationFrame(commitGrab);
      }
    };

    const handleTouchEnd = (event: TouchEvent) => {
      const current = candidate;

      if (!current || current.input !== "touch") {
        return;
      }

      const touch = findTouch(event.changedTouches, current.pointerId);

      if (!touch) {
        return;
      }

      current.currentX = touch.clientX;
      current.currentY = touch.clientY;
      recordVelocitySample(
        current,
        touch.clientX,
        touch.clientY,
        window.performance.now(),
      );

      if (
        !current.active &&
        getDistance(current) > TOUCH_MOVEMENT_TOLERANCE_PX
      ) {
        cancelCandidate("movement");
        return;
      }

      const completed = clearCandidate();

      if (completed) {
        dispatchSignal(completed, completed.active ? "release" : "impulse");
      }
    };

    const handleTouchCancel = () => {
      if (candidate?.input === "touch") {
        cancelCandidate("pointercancel");
      }
    };

    const handleContextMenu = (event: MouseEvent) => {
      if (
        candidate?.active &&
        event.target instanceof Node &&
        candidate.surface.contains(event.target)
      ) {
        event.preventDefault();
      }
    };

    const handleCancelRequest = (event: Event) => {
      if (
        candidate &&
        event.target instanceof Node &&
        candidate.surface.contains(event.target)
      ) {
        cancelCandidate("lifecycle");
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        cancelCandidate("hidden");
      }
    };

    const handleBlur = () => {
      cancelCandidate("blur");
    };

    root.addEventListener("pointerdown", handlePointerDown);
    root.addEventListener("touchstart", handleTouchStart, { passive: true });
    root.addEventListener("lostpointercapture", handleLostPointerCapture);
    root.addEventListener("contextmenu", handleContextMenu);
    root.addEventListener(PHYSICAL_CANCEL_REQUEST_EVENT, handleCancelRequest);
    window.addEventListener("pointerdown", handleWindowPointerDown, true);
    window.addEventListener("pointermove", handlePointerMove, { passive: false });
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerCancel);
    window.addEventListener("touchstart", handleWindowTouchStart, {
      capture: true,
      passive: true,
    });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });
    window.addEventListener("touchcancel", handleTouchCancel, { passive: true });
    window.addEventListener("blur", handleBlur);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelCandidate("lifecycle");
      root.removeEventListener("pointerdown", handlePointerDown);
      root.removeEventListener("touchstart", handleTouchStart);
      root.removeEventListener("lostpointercapture", handleLostPointerCapture);
      root.removeEventListener("contextmenu", handleContextMenu);
      root.removeEventListener(PHYSICAL_CANCEL_REQUEST_EVENT, handleCancelRequest);
      window.removeEventListener("pointerdown", handleWindowPointerDown, true);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerCancel);
      window.removeEventListener("touchstart", handleWindowTouchStart, true);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("touchcancel", handleTouchCancel);
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [enabled, rootRef]);
}
