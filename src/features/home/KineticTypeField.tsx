"use client";

import { type PointerEvent, useEffect, useRef, useState } from "react";

import { type EffectMode } from "@/core/effect-mode";
import { useEffectMode } from "@/effects/runtime/EffectMode";
import {
  drawKineticTypeFieldFrame,
  getKineticPointerRadius,
  INITIAL_SCENE_BOUNDS,
  invalidateKineticTypeFieldTextLayout,
  type KineticPalette,
  type KineticPointer,
  type SceneBounds,
} from "@/features/home/kineticTypeFieldRenderer";

const MAX_ANIMATED_PIXEL_RATIO = 1.5;
const MAX_STATIC_PIXEL_RATIO = 2;
const STATIC_FRAME_ELAPSED = 96_000;
const EMPTY_POINTER: KineticPointer = {
  active: false,
  radius: 0,
  x: 0,
  y: 0,
};

type KineticTypeFieldProps = Readonly<{
  active: boolean;
}>;

type OrbitFieldProps = Readonly<{
  active: boolean;
  fallback?: boolean;
  mode: EffectMode;
}>;

function toSceneBounds(width: number, height: number): SceneBounds {
  return {
    height: Math.max(1, Math.round(height)),
    width: Math.max(1, Math.round(width)),
  };
}

function haveSameBounds(current: SceneBounds, next: SceneBounds) {
  return current.width === next.width && current.height === next.height;
}

function useResponsiveSceneBounds() {
  const sceneRef = useRef<HTMLDivElement>(null);
  const [bounds, setBounds] = useState<SceneBounds>(INITIAL_SCENE_BOUNDS);

  useEffect(() => {
    const scene = sceneRef.current;

    if (!scene || typeof ResizeObserver === "undefined") {
      return;
    }

    const updateBounds = (width: number, height: number) => {
      const nextBounds = toSceneBounds(width, height);

      setBounds((currentBounds) =>
        haveSameBounds(currentBounds, nextBounds) ? currentBounds : nextBounds,
      );
    };
    const observer = new ResizeObserver(([entry]) => {
      if (entry) {
        updateBounds(entry.contentRect.width, entry.contentRect.height);
      }
    });
    const rect = scene.getBoundingClientRect();

    updateBounds(rect.width, rect.height);
    observer.observe(scene);

    return () => {
      observer.disconnect();
    };
  }, []);

  return { bounds, sceneRef };
}

function readPalette(canvas: HTMLCanvasElement): KineticPalette {
  const style = window.getComputedStyle(canvas);

  return {
    bone: style.getPropertyValue("--color-bone").trim() || "#F7F1E9",
    void: style.getPropertyValue("--color-void").trim() || "#030202",
  };
}

function configureCanvas(
  canvas: HTMLCanvasElement,
  bounds: SceneBounds,
  pixelRatioCap: number,
) {
  const pixelRatio = Math.min(
    Math.max(window.devicePixelRatio || 1, 1),
    pixelRatioCap,
  );
  const width = Math.max(1, Math.round(bounds.width * pixelRatio));
  const height = Math.max(1, Math.round(bounds.height * pixelRatio));

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  const context = canvas.getContext("2d");

  if (!context) {
    return null;
  }

  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

  return { context, pixelRatio };
}

function OrbitField({ active, fallback = false, mode }: OrbitFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const elapsedRef = useRef(0);
  const pointerRef = useRef<KineticPointer>(EMPTY_POINTER);
  const [fontEpoch, setFontEpoch] = useState(0);
  const [isUnavailable, setIsUnavailable] = useState(false);
  const { bounds, sceneRef } = useResponsiveSceneBounds();
  const isInteractive = active && mode === "full" && !fallback;

  useEffect(() => {
    if (!("fonts" in document)) {
      return;
    }

    let cancelled = false;
    const fontSet = document.fonts;

    void fontSet.ready.then(() => {
      if (!cancelled) {
        invalidateKineticTypeFieldTextLayout();
        setFontEpoch((currentEpoch) => currentEpoch + 1);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const configuredCanvas = configureCanvas(
      canvas,
      bounds,
      isInteractive ? MAX_ANIMATED_PIXEL_RATIO : MAX_STATIC_PIXEL_RATIO,
    );

    if (!configuredCanvas) {
      setIsUnavailable(true);
      return;
    }

    setIsUnavailable(false);

    const { context, pixelRatio } = configuredCanvas;
    const palette = readPalette(canvas);
    const fontFamily = window.getComputedStyle(canvas).fontFamily;
    const drawFrame = (elapsed: number) => {
      drawKineticTypeFieldFrame(context, bounds, {
        elapsed,
        fontFamily: fontFamily || "ui-monospace, monospace",
        mode,
        palette,
        pixelRatio,
        pointer: isInteractive ? pointerRef.current : null,
      });
    };

    if (!isInteractive) {
      drawFrame(STATIC_FRAME_ELAPSED);
      return;
    }

    const startedAt = window.performance.now();
    let animationFrame = 0;
    const render = (now: number) => {
      drawFrame(elapsedRef.current + now - startedAt);
      animationFrame = window.requestAnimationFrame(render);
    };

    drawFrame(elapsedRef.current);
    animationFrame = window.requestAnimationFrame(render);

    return () => {
      elapsedRef.current += Math.max(0, window.performance.now() - startedAt);
      window.cancelAnimationFrame(animationFrame);
    };
  }, [active, bounds, fallback, fontEpoch, isInteractive, mode]);

  const clearPointer = () => {
    pointerRef.current = EMPTY_POINTER;
  };
  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!isInteractive || event.pointerType !== "mouse") {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();

    if (!rect.width || !rect.height) {
      return;
    }

    pointerRef.current = {
      active: true,
      radius: getKineticPointerRadius(bounds),
      x: ((event.clientX - rect.left) / rect.width) * bounds.width,
      y: ((event.clientY - rect.top) / rect.height) * bounds.height,
    };
  };

  if (isUnavailable) {
    return (
      <div
        aria-hidden="true"
        className="kinetic-field kinetic-field--unavailable"
        ref={sceneRef}
      />
    );
  }

  return (
    <div
      aria-hidden="true"
      className="kinetic-field"
      data-active={active || undefined}
      data-interactive={isInteractive || undefined}
      data-mode={mode}
      onPointerLeave={clearPointer}
      onPointerMove={handlePointerMove}
      ref={sceneRef}
    >
      <canvas
        aria-hidden="true"
        className="kinetic-field__canvas"
        ref={canvasRef}
      />
    </div>
  );
}

export function KineticTypeField({ active }: KineticTypeFieldProps) {
  const { mode } = useEffectMode();

  return <OrbitField active={active} mode={mode} />;
}

export function KineticTypeFieldFallback() {
  return <OrbitField active={false} fallback mode="static" />;
}
