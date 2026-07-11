"use client";

import { type RefObject, useCallback, useEffect, useRef } from "react";

import { useEffectMode } from "@/effects/runtime/EffectMode";
import { useSceneActivity } from "@/effects/runtime/useSceneActivity";

import {
  drawLogWordFieldFrame,
  type LogWordFieldBounds,
  type LogWordFieldPointer,
} from "./logWordFieldRenderer";

const FULL_PIXEL_RATIO_CAP = 1.5;
const STATIC_PIXEL_RATIO_CAP = 2;
const ENTRANCE_DURATION_MS = 520;

type LogWordFieldProps = Readonly<{
  tokens: readonly string[];
  targetRef: RefObject<HTMLElement | null>;
}>;

function getBounds(element: HTMLElement): LogWordFieldBounds {
  const rect = element.getBoundingClientRect();

  return {
    width: Math.max(1, Math.round(rect.width)),
    height: Math.max(1, Math.round(rect.height)),
  };
}

function configureCanvas(
  canvas: HTMLCanvasElement,
  bounds: LogWordFieldBounds,
  pixelRatioCap: number,
) {
  const pixelRatio = Math.min(
    Math.max(window.devicePixelRatio || 1, 1),
    pixelRatioCap,
  );
  const width = Math.round(bounds.width * pixelRatio);
  const height = Math.round(bounds.height * pixelRatio);

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  const context = canvas.getContext("2d");

  if (!context) {
    return null;
  }

  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

  return context;
}

export function LogWordField({ tokens, targetRef }: LogWordFieldProps) {
  const { mode } = useEffectMode();
  const fieldRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerRef = useRef<LogWordFieldPointer | null>(null);
  const frameRef = useRef<number | null>(null);
  const active = useSceneActivity(fieldRef);

  const draw = useCallback(
    (progress: number) => {
      const field = fieldRef.current;
      const canvas = canvasRef.current;

      if (!field || !canvas) {
        return;
      }

      const bounds = getBounds(field);
      const context = configureCanvas(
        canvas,
        bounds,
        mode === "full" && active
          ? FULL_PIXEL_RATIO_CAP
          : STATIC_PIXEL_RATIO_CAP,
      );

      if (!context) {
        return;
      }

      const style = window.getComputedStyle(field);
      const fontFamily = style.getPropertyValue("--font-mono").trim() || "monospace";

      drawLogWordFieldFrame(
        context,
        bounds,
        tokens,
        {
          field: style.getPropertyValue("--color-bone").trim() || "#F7F1E9",
          signal: style.getPropertyValue("--color-signal").trim() || "#E6653C",
        },
        mode === "full" && active ? pointerRef.current : null,
        progress,
        fontFamily,
      );
    },
    [active, mode, tokens],
  );

  const scheduleDraw = useCallback(
    (progress = 1) => {
      if (!active) {
        return;
      }

      if (frameRef.current !== null) {
        return;
      }

      frameRef.current = window.requestAnimationFrame(() => {
        frameRef.current = null;
        draw(progress);
      });
    },
    [active, draw],
  );

  useEffect(() => {
    const field = fieldRef.current;

    if (!field) {
      return;
    }

    let resizeFrame: number | null = window.requestAnimationFrame(() => {
      resizeFrame = null;
      scheduleDraw();
    });

    if (typeof ResizeObserver === "undefined") {
      return () => {
        if (resizeFrame !== null) {
          window.cancelAnimationFrame(resizeFrame);
        }
      };
    }

    const observer = new ResizeObserver(() => {
      scheduleDraw();
    });

    observer.observe(field);

    return () => {
      observer.disconnect();

      if (resizeFrame !== null) {
        window.cancelAnimationFrame(resizeFrame);
      }
    };
  }, [scheduleDraw]);

  useEffect(() => {
    if (!active) {
      return;
    }

    if (mode === "static") {
      scheduleDraw();

      return () => {
        if (frameRef.current !== null) {
          window.cancelAnimationFrame(frameRef.current);
          frameRef.current = null;
        }
      };
    }

    let startTime: number | null = null;

    const animateEntrance = (time: number) => {
      if (startTime === null) {
        startTime = time;
      }

      const progress = Math.min((time - startTime) / ENTRANCE_DURATION_MS, 1);
      draw(progress);

      if (progress < 1) {
        frameRef.current = window.requestAnimationFrame(animateEntrance);
        return;
      }

      frameRef.current = null;
    };

    if (frameRef.current === null) {
      frameRef.current = window.requestAnimationFrame(animateEntrance);
    }

    return () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [active, draw, mode, scheduleDraw]);

  useEffect(() => {
    if (!active || mode !== "full") {
      return;
    }

    const target = targetRef.current;

    if (!target) {
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      const rect = target.getBoundingClientRect();
      pointerRef.current = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };
      scheduleDraw();
    };
    const handlePointerLeave = () => {
      pointerRef.current = null;
      scheduleDraw();
    };

    target.addEventListener("pointermove", handlePointerMove, { passive: true });
    target.addEventListener("pointerleave", handlePointerLeave, { passive: true });

    return () => {
      target.removeEventListener("pointermove", handlePointerMove);
      target.removeEventListener("pointerleave", handlePointerLeave);
    };
  }, [active, mode, scheduleDraw, targetRef]);

  useEffect(
    () => () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
    },
    [],
  );

  return (
    <div aria-hidden="true" className="log-word-field" ref={fieldRef}>
      <canvas className="log-word-field__canvas" ref={canvasRef} />
    </div>
  );
}
