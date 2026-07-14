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
import { createKineticWebglRenderer } from "@/features/home/kineticTypeFieldWebglRenderer";

const MAX_ANIMATED_PIXEL_RATIO = 1.25;
const MAX_STATIC_PIXEL_RATIO = 2;
const FULL_FRAME_INTERVAL_MS = 1000 / 30;
const FULL_FRAME_INTERVAL_MARGIN_MS = 1;
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

type PendingPointer = Readonly<{
  clientX: number;
  clientY: number;
}>;

type RendererKind = "canvas" | "webgl";

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

function getCanvasPixelRatio(pixelRatioCap: number) {
  return Math.min(
    Math.max(window.devicePixelRatio || 1, 1),
    pixelRatioCap,
  );
}

function configureCanvas(
  canvas: HTMLCanvasElement,
  bounds: SceneBounds,
  pixelRatioCap: number,
) {
  const pixelRatio = getCanvasPixelRatio(pixelRatioCap);
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
  const webglCanvasRef = useRef<HTMLCanvasElement>(null);
  const canvasFallbackRef = useRef<HTMLCanvasElement>(null);
  const elapsedRef = useRef(0);
  const pointerRef = useRef<KineticPointer>(EMPTY_POINTER);
  const pendingPointerRef = useRef<PendingPointer | null>(null);
  const pointerFrameRef = useRef(0);
  const forceCanvasFallbackRef = useRef(false);
  const [fontEpoch, setFontEpoch] = useState(0);
  const [rendererEpoch, setRendererEpoch] = useState(0);
  const [rendererKind, setRendererKind] = useState<RendererKind>("canvas");
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
    return () => {
      if (pointerFrameRef.current) {
        window.cancelAnimationFrame(pointerFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isInteractive) {
      pendingPointerRef.current = null;
      pointerRef.current = EMPTY_POINTER;
    }
  }, [isInteractive]);

  useEffect(() => {
    const fallbackCanvas = canvasFallbackRef.current;

    if (!fallbackCanvas) {
      return;
    }

    const drawCanvasScene = () => {
      const configuredCanvas = configureCanvas(
        fallbackCanvas,
        bounds,
        isInteractive ? MAX_ANIMATED_PIXEL_RATIO : MAX_STATIC_PIXEL_RATIO,
      );

      if (!configuredCanvas) {
        setIsUnavailable(true);
        return null;
      }

      const { context, pixelRatio } = configuredCanvas;
      const palette = readPalette(fallbackCanvas);
      const fontFamily = window.getComputedStyle(fallbackCanvas).fontFamily;
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

      return drawFrame;
    };

    if (!isInteractive) {
      const drawFrame = drawCanvasScene();

      if (!drawFrame) {
        return;
      }

      setIsUnavailable(false);
      setRendererKind("canvas");
      drawFrame(STATIC_FRAME_ELAPSED);
      return;
    }

    const webglCanvas = webglCanvasRef.current;

    if (!forceCanvasFallbackRef.current && webglCanvas) {
      const pixelRatio = getCanvasPixelRatio(MAX_ANIMATED_PIXEL_RATIO);
      const palette = readPalette(webglCanvas);
      const fontFamily = window.getComputedStyle(webglCanvas).fontFamily;
      const renderer = createKineticWebglRenderer(webglCanvas, {
        bounds,
        fontFamily: fontFamily || "ui-monospace, monospace",
        onContextLost: () => {
          forceCanvasFallbackRef.current = true;
          setRendererKind("canvas");
          setRendererEpoch((currentEpoch) => currentEpoch + 1);
        },
        pixelRatio,
      });

      if (renderer) {
        setIsUnavailable(false);
        setRendererKind("webgl");

        const startedAt = window.performance.now();
        let animationFrame = 0;
        const render = (now: number) => {
          renderer.render({
            elapsed: elapsedRef.current + now - startedAt,
            palette,
            pointer: pointerRef.current,
          });
          animationFrame = window.requestAnimationFrame(render);
        };

        renderer.render({
          elapsed: elapsedRef.current,
          palette,
          pointer: pointerRef.current,
        });
        animationFrame = window.requestAnimationFrame(render);

        return () => {
          elapsedRef.current += Math.max(
            0,
            window.performance.now() - startedAt,
          );
          window.cancelAnimationFrame(animationFrame);
          renderer.destroy();
        };
      }

      forceCanvasFallbackRef.current = true;
    }

    const drawFrame = drawCanvasScene();

    if (!drawFrame) {
      return;
    }

    setIsUnavailable(false);
    setRendererKind("canvas");

    const startedAt = window.performance.now();
    let animationFrame = 0;
    let lastDrawAt = startedAt;
    const render = (now: number) => {
      if (
        now - lastDrawAt >=
        FULL_FRAME_INTERVAL_MS - FULL_FRAME_INTERVAL_MARGIN_MS
      ) {
        drawFrame(elapsedRef.current + now - startedAt);
        lastDrawAt = now;
      }

      animationFrame = window.requestAnimationFrame(render);
    };

    drawFrame(elapsedRef.current);
    animationFrame = window.requestAnimationFrame(render);

    return () => {
      elapsedRef.current += Math.max(0, window.performance.now() - startedAt);
      window.cancelAnimationFrame(animationFrame);
    };
  }, [bounds, fontEpoch, isInteractive, mode, rendererEpoch]);

  const commitPointerPosition = () => {
    pointerFrameRef.current = 0;

    const pendingPointer = pendingPointerRef.current;
    const scene = sceneRef.current;

    if (!isInteractive || !pendingPointer || !scene) {
      pointerRef.current = EMPTY_POINTER;
      return;
    }

    const rect = scene.getBoundingClientRect();

    if (!rect.width || !rect.height) {
      pointerRef.current = EMPTY_POINTER;
      return;
    }

    pointerRef.current = {
      active: true,
      radius: getKineticPointerRadius(bounds),
      x: ((pendingPointer.clientX - rect.left) / rect.width) * bounds.width,
      y: ((pendingPointer.clientY - rect.top) / rect.height) * bounds.height,
    };
  };

  const clearPointer = () => {
    pendingPointerRef.current = null;
    pointerRef.current = EMPTY_POINTER;
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!isInteractive || event.pointerType !== "mouse") {
      return;
    }

    pendingPointerRef.current = {
      clientX: event.clientX,
      clientY: event.clientY,
    };

    if (!pointerFrameRef.current) {
      pointerFrameRef.current = window.requestAnimationFrame(
        commitPointerPosition,
      );
    }
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
      data-renderer={rendererKind}
      onPointerLeave={clearPointer}
      onPointerMove={handlePointerMove}
      ref={sceneRef}
    >
      <canvas
        aria-hidden="true"
        className="kinetic-field__canvas kinetic-field__canvas--fallback"
        ref={canvasFallbackRef}
      />
      <canvas
        aria-hidden="true"
        className="kinetic-field__canvas kinetic-field__canvas--webgl"
        ref={webglCanvasRef}
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
