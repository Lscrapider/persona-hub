"use client";

import { type PointerEvent, useEffect, useRef, useState } from "react";

import { type EffectMode } from "@/core/effect-mode";
import {
  isPhysicalInteractionSignal,
  PHYSICAL_CANCEL_REQUEST_EVENT,
  PHYSICAL_INTERACTION_EVENT,
} from "@/effects/physics/physicalInteractionContract";
import { useEffectMode } from "@/effects/runtime/EffectMode";
import {
  createHeroPhysicsAdapter,
  type HeroPhysicsAdapter,
} from "@/features/home/heroPhysicsAdapter";
import {
  getKineticPointerRadius,
  INITIAL_SCENE_BOUNDS,
  invalidateKineticTypeFieldTextLayout,
  type KineticPalette,
  type KineticPointer,
  type SceneBounds,
} from "@/features/home/kineticTypeFieldScene";
import { createKineticWebglRenderer } from "@/features/home/kineticTypeFieldWebglRenderer";

const MAX_WEBGL_PIXEL_RATIO = 1.25;
const STATIC_FRAME_ELAPSED = 96_000;

type KineticTypeFieldProps = Readonly<{
  active: boolean;
}>;

type OrbitFieldProps = Readonly<{
  active: boolean;
  mode: EffectMode;
}>;

type MutablePointer = {
  active: boolean;
  radius: number;
  x: number;
  y: number;
};

type PendingPointer = {
  active: boolean;
  clientX: number;
  clientY: number;
};

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

function readPalette(element: HTMLElement): KineticPalette {
  const style = window.getComputedStyle(element);

  return {
    bone: style.getPropertyValue("--color-bone").trim() || "#F7F1E9",
    void: style.getPropertyValue("--color-void").trim() || "#030202",
  };
}

function getWebglPixelRatio() {
  return Math.min(
    Math.max(window.devicePixelRatio || 1, 1),
    MAX_WEBGL_PIXEL_RATIO,
  );
}

function OrbitField({ active, mode }: OrbitFieldProps) {
  const webglCanvasRef = useRef<HTMLCanvasElement>(null);
  const elapsedRef = useRef(0);
  const pointerRef = useRef<MutablePointer>({
    active: false,
    radius: 0,
    x: 0,
    y: 0,
  });
  const pendingPointerRef = useRef<PendingPointer>({
    active: false,
    clientX: 0,
    clientY: 0,
  });
  const pointerFrameRef = useRef(0);
  const adapterRef = useRef<HeroPhysicsAdapter | null>(null);
  const [fontEpoch, setFontEpoch] = useState(0);
  const [isRendererReady, setIsRendererReady] = useState(false);
  const [isUnavailable, setIsUnavailable] = useState(false);
  const { bounds, sceneRef } = useResponsiveSceneBounds();
  const shouldAnimate = active && mode === "full";
  const isInteractive = shouldAnimate && isRendererReady && !isUnavailable;

  useEffect(() => {
    const adapter = createHeroPhysicsAdapter(INITIAL_SCENE_BOUNDS);

    adapterRef.current = adapter;

    const resetScene = () => {
      const scene = sceneRef.current;

      scene?.dispatchEvent(
        new CustomEvent(PHYSICAL_CANCEL_REQUEST_EVENT, { bubbles: true }),
      );
      adapter.reset();
      pendingPointerRef.current.active = false;
      pointerRef.current.active = false;

      if (pointerFrameRef.current) {
        window.cancelAnimationFrame(pointerFrameRef.current);
        pointerFrameRef.current = 0;
      }
    };
    const handleVisibilityChange = () => {
      if (document.hidden) {
        resetScene();
      }
    };

    window.addEventListener("blur", resetScene);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      resetScene();
      window.removeEventListener("blur", resetScene);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      adapterRef.current = null;
    };
  }, [sceneRef]);

  useEffect(() => {
    adapterRef.current?.resize(bounds);
  }, [bounds]);

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
        pointerFrameRef.current = 0;
      }
    };
  }, []);

  useEffect(() => {
    if (!isInteractive) {
      const scene = sceneRef.current;

      scene?.dispatchEvent(
        new CustomEvent(PHYSICAL_CANCEL_REQUEST_EVENT, { bubbles: true }),
      );
      adapterRef.current?.reset();
      pendingPointerRef.current.active = false;
      pointerRef.current.active = false;

      if (pointerFrameRef.current) {
        window.cancelAnimationFrame(pointerFrameRef.current);
        pointerFrameRef.current = 0;
      }
    }
  }, [isInteractive, sceneRef]);

  useEffect(() => {
    const scene = sceneRef.current;
    const adapter = adapterRef.current;

    if (!scene || !adapter) {
      return;
    }

    const handlePhysicalSignal = (event: Event) => {
      const signal = (event as CustomEvent<unknown>).detail;

      if (
        !isInteractive ||
        !isPhysicalInteractionSignal(signal) ||
        signal.surface !== "index"
      ) {
        return;
      }

      adapter.applySignal(signal, scene.getBoundingClientRect(), bounds);
    };

    scene.addEventListener(PHYSICAL_INTERACTION_EVENT, handlePhysicalSignal);

    return () => {
      scene.removeEventListener(PHYSICAL_INTERACTION_EVENT, handlePhysicalSignal);
    };
  }, [bounds, isInteractive, sceneRef]);

  useEffect(() => {
    if (isUnavailable) {
      return;
    }

    const canvas = webglCanvasRef.current;

    if (!canvas) {
      return;
    }

    setIsRendererReady(false);

    const renderer = createKineticWebglRenderer(canvas, {
      bounds,
      fontFamily:
        window.getComputedStyle(canvas).fontFamily || "ui-monospace, monospace",
      onContextLost: () => {
        setIsRendererReady(false);
        setIsUnavailable(true);
      },
      pixelRatio: getWebglPixelRatio(),
    });

    if (!renderer) {
      setIsUnavailable(true);
      return;
    }

    const palette = readPalette(canvas);
    const adapter = adapterRef.current;

    setIsRendererReady(true);

    if (!shouldAnimate) {
      renderer.render({
        elapsed: STATIC_FRAME_ELAPSED,
        palette,
        physics: null,
        pointer: null,
      });

      return () => {
        renderer.destroy();
      };
    }

    const startedAt = window.performance.now();
    const webglFrame = {
      elapsed: elapsedRef.current,
      palette,
      physics: adapter?.frame ?? null,
      pointer: pointerRef.current as KineticPointer,
    };
    let animationFrame = 0;
    const render = (now: number) => {
      const currentAdapter = adapterRef.current;

      currentAdapter?.advance(now);
      webglFrame.elapsed = elapsedRef.current + now - startedAt;
      webglFrame.physics = currentAdapter?.frame ?? null;
      renderer.render(webglFrame);
      animationFrame = window.requestAnimationFrame(render);
    };

    adapter?.advance(startedAt);
    renderer.render(webglFrame);
    animationFrame = window.requestAnimationFrame(render);

    return () => {
      elapsedRef.current += Math.max(0, window.performance.now() - startedAt);
      window.cancelAnimationFrame(animationFrame);
      renderer.destroy();
    };
  }, [bounds, fontEpoch, isUnavailable, shouldAnimate]);

  const commitPointerPosition = () => {
    pointerFrameRef.current = 0;

    const pendingPointer = pendingPointerRef.current;
    const scene = sceneRef.current;

    if (!isInteractive || !pendingPointer.active || !scene) {
      pointerRef.current.active = false;
      return;
    }

    const rect = scene.getBoundingClientRect();

    if (!rect.width || !rect.height) {
      pointerRef.current.active = false;
      return;
    }

    pointerRef.current.active = true;
    pointerRef.current.radius = getKineticPointerRadius(bounds);
    pointerRef.current.x =
      ((pendingPointer.clientX - rect.left) / rect.width) * bounds.width;
    pointerRef.current.y =
      ((pendingPointer.clientY - rect.top) / rect.height) * bounds.height;
  };

  const clearPointer = () => {
    pendingPointerRef.current.active = false;
    pointerRef.current.active = false;
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!isInteractive || event.pointerType !== "mouse") {
      return;
    }

    pendingPointerRef.current.active = true;
    pendingPointerRef.current.clientX = event.clientX;
    pendingPointerRef.current.clientY = event.clientY;

    if (!pointerFrameRef.current) {
      pointerFrameRef.current = window.requestAnimationFrame(
        commitPointerPosition,
      );
    }
  };

  return (
    <div
      aria-hidden="true"
      className={
        isUnavailable
          ? "kinetic-field kinetic-field--unavailable"
          : "kinetic-field"
      }
      data-active={active || undefined}
      data-interactive={isInteractive || undefined}
      data-mode={mode}
      data-physics-surface={isInteractive ? "index" : undefined}
      data-physics-target={isInteractive ? "index" : undefined}
      onPointerLeave={isInteractive ? clearPointer : undefined}
      onPointerMove={isInteractive ? handlePointerMove : undefined}
      ref={sceneRef}
    >
      {!isUnavailable ? (
        <canvas
          aria-hidden="true"
          className="kinetic-field__canvas"
          ref={webglCanvasRef}
        />
      ) : null}
    </div>
  );
}

export function KineticTypeField({ active }: KineticTypeFieldProps) {
  const { mode, systemReduced } = useEffectMode();
  const effectiveMode = systemReduced ? "static" : mode;

  return <OrbitField active={active} mode={effectiveMode} />;
}

export function KineticTypeFieldFallback() {
  return <div aria-hidden="true" className="kinetic-field kinetic-field--unavailable" />;
}
