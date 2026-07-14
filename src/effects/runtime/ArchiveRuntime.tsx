"use client";

import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { CodeParticleLayer } from "@/effects/physics/CodeParticleLayer";
import {
  isPhysicalInteractionSignal,
  PHYSICAL_INTERACTION_EVENT,
  toPhysicalRuntimeSignal,
} from "@/effects/physics/physicalInteractionContract";
import { createPhysicsVocabulary } from "@/effects/physics/physicsVocabulary";
import { usePhysicalGesture } from "@/effects/physics/usePhysicalGesture";
import {
  formatRuntimeTrace,
  isRuntimeAction,
  isRuntimeSignal,
  RUNTIME_SIGNAL_EVENT,
  TRACE_DEDUPE_MS,
  TRACE_VISIBLE_MS,
  type RuntimeSignal,
} from "@/effects/runtime/archiveRuntimeContract";
import { useEffectMode } from "@/effects/runtime/EffectMode";
import { useArchiveCompiler } from "@/effects/runtime/useArchiveCompiler";
import type { LocalizedArchiveContent } from "@/lib/content/types";

import "./archiveRuntime.css";

type ArchiveRuntimeProps = Readonly<{
  children: ReactNode;
  content: LocalizedArchiveContent;
  enabled: boolean;
  locked: boolean;
}>;

type LastTrace = Readonly<{
  message: string;
  time: number;
}>;

type LastPhysicalStage = Readonly<{
  action: string;
  sequenceId: number;
}>;

function closestRuntimeTarget(value: EventTarget | null) {
  return value instanceof Element
    ? value.closest<HTMLElement>("[data-runtime-target]")
    : null;
}

export function ArchiveRuntime({
  children,
  content,
  enabled,
  locked,
}: ArchiveRuntimeProps) {
  const { mode, systemReduced } = useEffectMode();
  const runtimeActive = enabled && !locked;
  const physicsActive = runtimeActive && mode === "full" && !systemReduced;
  const rootRef = useRef<HTMLDivElement>(null);
  const traceTimerRef = useRef<number | null>(null);
  const lastTraceRef = useRef<LastTrace | null>(null);
  const lastPhysicalStageRef = useRef<LastPhysicalStage | null>(null);
  const [trace, setTrace] = useState<string | null>(null);
  const vocabulary = useMemo(() => createPhysicsVocabulary(content), [content]);

  const emitSignal = useCallback((signal: RuntimeSignal) => {
    const message = formatRuntimeTrace(signal);
    const now = window.performance.now();
    const previous = lastTraceRef.current;

    if (
      previous?.message === message &&
      now - previous.time < TRACE_DEDUPE_MS
    ) {
      return;
    }

    lastTraceRef.current = { message, time: now };
    setTrace(message);

    if (traceTimerRef.current !== null) {
      window.clearTimeout(traceTimerRef.current);
    }

    traceTimerRef.current = window.setTimeout(() => {
      traceTimerRef.current = null;
      setTrace(null);
    }, TRACE_VISIBLE_MS);
  }, []);

  useArchiveCompiler({ enabled: runtimeActive, onSignal: emitSignal, rootRef });
  usePhysicalGesture({ enabled: physicsActive, rootRef });

  useEffect(() => {
    if (traceTimerRef.current !== null) {
      window.clearTimeout(traceTimerRef.current);
      traceTimerRef.current = null;
    }

    lastTraceRef.current = null;
    lastPhysicalStageRef.current = null;
    const resetFrame = window.requestAnimationFrame(() => {
      setTrace(null);
    });

    return () => {
      window.cancelAnimationFrame(resetFrame);
    };
  }, [mode, runtimeActive]);

  useEffect(() => {
    const root = rootRef.current;

    if (!runtimeActive || !root) {
      return;
    }

    const handlePhysicalSignal = (event: Event) => {
      const signal = (event as CustomEvent<unknown>).detail;

      if (!isPhysicalInteractionSignal(signal)) {
        return;
      }

      if (signal.action === "cancel") {
        if (lastPhysicalStageRef.current?.sequenceId === signal.sequenceId) {
          lastPhysicalStageRef.current = null;
        }

        return;
      }

      const previous = lastPhysicalStageRef.current;

      if (
        previous?.sequenceId === signal.sequenceId &&
        previous.action === signal.action
      ) {
        return;
      }

      lastPhysicalStageRef.current = {
        action: signal.action,
        sequenceId: signal.sequenceId,
      };

      const runtimeSignal = toPhysicalRuntimeSignal(signal);

      if (runtimeSignal) {
        emitSignal(runtimeSignal);
      }
    };

    root.addEventListener(PHYSICAL_INTERACTION_EVENT, handlePhysicalSignal);

    return () => {
      root.removeEventListener(PHYSICAL_INTERACTION_EVENT, handlePhysicalSignal);
    };
  }, [emitSignal, runtimeActive]);

  useEffect(() => {
    const root = rootRef.current;

    if (!runtimeActive || !root) {
      return;
    }

    let pointerFrame = 0;
    let pointerX = 0;
    let pointerY = 0;

    const clearProbe = () => {
      delete root.dataset.probeActive;
    };
    const commitPointer = () => {
      pointerFrame = 0;
      root.style.setProperty("--probe-x", `${pointerX.toString()}px`);
      root.style.setProperty("--probe-y", `${pointerY.toString()}px`);
    };
    const schedulePointer = (event: PointerEvent) => {
      pointerX = event.clientX;
      pointerY = event.clientY;

      if (!pointerFrame) {
        pointerFrame = window.requestAnimationFrame(commitPointer);
      }
    };
    const handlePointerMove = (event: PointerEvent) => {
      if (mode !== "full" || event.pointerType !== "mouse") {
        return;
      }

      schedulePointer(event);
    };
    const handlePointerOver = (event: PointerEvent) => {
      const target = closestRuntimeTarget(event.target);
      const previous = closestRuntimeTarget(event.relatedTarget);

      if (
        !target ||
        target.dataset.runtimeTarget === previous?.dataset.runtimeTarget
      ) {
        return;
      }

      const action = target.dataset.runtimeHoverAction;
      const runtimeTarget = target.dataset.runtimeTarget;

      if (mode === "full" && event.pointerType === "mouse") {
        schedulePointer(event);
        root.dataset.probeActive = "true";
      }

      if (isRuntimeAction(action) && runtimeTarget) {
        emitSignal({ action, source: "pointer", target: runtimeTarget });
      }
    };
    const handlePointerOut = (event: PointerEvent) => {
      if (!closestRuntimeTarget(event.relatedTarget)) {
        clearProbe();
      }
    };
    const handleFocusIn = (event: FocusEvent) => {
      const target = closestRuntimeTarget(event.target);
      const action = target?.dataset.runtimeHoverAction;
      const runtimeTarget = target?.dataset.runtimeTarget;

      if (isRuntimeAction(action) && runtimeTarget) {
        emitSignal({ action, source: "focus", target: runtimeTarget });
      }
    };
    const handleClick = (event: MouseEvent) => {
      const target = closestRuntimeTarget(event.target);
      const action = target?.dataset.runtimeActivateAction;
      const runtimeTarget = target?.dataset.runtimeTarget;

      if (isRuntimeAction(action) && runtimeTarget) {
        emitSignal({ action, source: "activate", target: runtimeTarget });
      }
    };
    const handleCustomSignal = (event: Event) => {
      const signal = (event as CustomEvent<unknown>).detail;

      if (isRuntimeSignal(signal)) {
        emitSignal(signal);
      }
    };

    root.addEventListener("pointermove", handlePointerMove, { passive: true });
    root.addEventListener("pointerover", handlePointerOver, { passive: true });
    root.addEventListener("pointerout", handlePointerOut, { passive: true });
    root.addEventListener("focusin", handleFocusIn);
    root.addEventListener("click", handleClick);
    root.addEventListener(RUNTIME_SIGNAL_EVENT, handleCustomSignal);
    window.addEventListener("blur", clearProbe);

    return () => {
      if (pointerFrame) {
        window.cancelAnimationFrame(pointerFrame);
      }

      clearProbe();
      root.style.removeProperty("--probe-x");
      root.style.removeProperty("--probe-y");
      root.removeEventListener("pointermove", handlePointerMove);
      root.removeEventListener("pointerover", handlePointerOver);
      root.removeEventListener("pointerout", handlePointerOut);
      root.removeEventListener("focusin", handleFocusIn);
      root.removeEventListener("click", handleClick);
      root.removeEventListener(RUNTIME_SIGNAL_EVENT, handleCustomSignal);
      window.removeEventListener("blur", clearProbe);
    };
  }, [emitSignal, mode, runtimeActive]);

  useEffect(
    () => () => {
      if (traceTimerRef.current !== null) {
        window.clearTimeout(traceTimerRef.current);
      }
    },
    [],
  );

  return (
    <div
      aria-hidden={locked || undefined}
      className="archive-experience"
      data-runtime-enabled={enabled ? "true" : undefined}
      inert={locked || undefined}
      ref={rootRef}
    >
      {children}
      <CodeParticleLayer
        enabled={physicsActive}
        rootRef={rootRef}
        vocabulary={vocabulary}
      />
      <div aria-hidden="true" className="archive-runtime__probe" />
      <p
        aria-hidden="true"
        className="archive-runtime__trace"
        data-visible={Boolean(trace) || undefined}
      >
        <span>BUILD</span>
        <output>{trace ?? ""}</output>
      </p>
    </div>
  );
}
