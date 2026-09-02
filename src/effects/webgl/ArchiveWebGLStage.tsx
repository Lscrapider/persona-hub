"use client";

import { type RefObject, useEffect, useRef } from "react";

import type { EffectMode } from "@/core/effect-mode";
import type { ArchiveMotionSnapshotRef } from "@/effects/webgl/archiveStageContract";

import {
  createArchiveWebglRenderer,
  type ArchiveWebglRenderer,
} from "./archiveWebglRenderer";

import "./archiveWebglStage.css";

type ArchiveWebGLStageProps = Readonly<{
  enabled: boolean;
  mode: EffectMode;
  rootRef: RefObject<HTMLElement | null>;
  snapshotRef: ArchiveMotionSnapshotRef;
}>;

const STATIC_ELAPSED_MS = 96_000;

function cssToken(style: CSSStyleDeclaration, name: string, fallback: string) {
  return style.getPropertyValue(name).trim() || fallback;
}

export function ArchiveWebGLStage({
  enabled,
  mode,
  rootRef,
  snapshotRef,
}: ArchiveWebGLStageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const root = rootRef.current;

    if (!canvas || !root) {
      return;
    }

    let renderer: ArchiveWebglRenderer | null = null;
    let animationFrame = 0;
    let resizeFrame = 0;
    let singleFrame = 0;
    let destroyed = false;
    let elapsedOffset = snapshotRef.current.elapsedMs;
    let startedAt = window.performance.now();
    let previousFrameAt = startedAt;

    const setRendererState = (
      state: "initializing" | "ready" | "fallback" | "lost",
    ) => {
      root.dataset.webglStage = state;
    };
    const stopAnimation = () => {
      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame);
        animationFrame = 0;
      }
    };
    const destroyRenderer = () => {
      renderer?.destroy();
      renderer = null;
    };
    const renderAt = (now: number) => {
      if (!renderer || destroyed || document.hidden) {
        return;
      }

      const snapshot = snapshotRef.current;
      const deltaMs = Math.min(50, Math.max(1, now - previousFrameAt));

      previousFrameAt = now;
      snapshot.elapsedMs =
        mode === "full" ? elapsedOffset + now - startedAt : STATIC_ELAPSED_MS;
      snapshot.interactionEnergy *= Math.pow(0.88, deltaMs / 16.667);
      snapshot.entryEnergy *= Math.pow(0.94, deltaMs / 16.667);
      snapshot.pointer.velocityX *= Math.pow(0.78, deltaMs / 16.667);
      snapshot.pointer.velocityY *= Math.pow(0.78, deltaMs / 16.667);
      snapshot.scrollVelocity *= Math.pow(0.84, deltaMs / 16.667);
      renderer.render(snapshot);
    };
    const animate = (now: number) => {
      animationFrame = 0;
      renderAt(now);

      if (!destroyed && enabled && mode === "full" && !document.hidden) {
        animationFrame = window.requestAnimationFrame(animate);
      }
    };
    const scheduleStaticFrame = () => {
      if (mode !== "static" || singleFrame || destroyed) {
        return;
      }

      singleFrame = window.requestAnimationFrame((now) => {
        singleFrame = 0;
        renderAt(now);
      });
    };
    const createRenderer = () => {
      destroyRenderer();
      stopAnimation();

      if (!enabled) {
        setRendererState("initializing");
        return;
      }

      setRendererState("initializing");
      const canvasBounds = canvas.getBoundingClientRect();
      const width = Math.max(1, canvasBounds.width);
      const height = Math.max(1, canvasBounds.height);
      const pixelRatio = Math.min(
        Math.max(window.devicePixelRatio || 1, 1),
        width <= 768 ? 1 : 1.25,
      );
      const style = window.getComputedStyle(canvas);
      const heroSceneRect = root
        .querySelector<HTMLElement>(".home-hero__scene")
        ?.getBoundingClientRect();

      renderer = createArchiveWebglRenderer(canvas, {
        bounds: { height, width },
        fontFamily: style.fontFamily || "ui-monospace, monospace",
        heroBounds: {
          height: Math.max(1, heroSceneRect?.height ?? height),
          width: Math.max(1, heroSceneRect?.width ?? width),
        },
        onContextLost: () => {
          stopAnimation();
          setRendererState("lost");
        },
        palette: {
          bone: cssToken(style, "--color-bone", "#f7f1e9"),
          signal: cssToken(style, "--color-signal", "#e6653c"),
          silver: cssToken(style, "--color-silver", "#9a948f"),
          void: cssToken(style, "--color-void", "#030202"),
        },
        pixelRatio,
      });

      if (!renderer) {
        setRendererState("fallback");
        return;
      }

      startedAt = window.performance.now();
      previousFrameAt = startedAt;
      setRendererState("ready");
      renderAt(startedAt);

      if (mode === "full" && !document.hidden) {
        animationFrame = window.requestAnimationFrame(animate);
      }
    };
    const scheduleResize = () => {
      if (resizeFrame || destroyed) {
        return;
      }

      resizeFrame = window.requestAnimationFrame(() => {
        resizeFrame = 0;
        elapsedOffset = snapshotRef.current.elapsedMs;
        createRenderer();
      });
    };
    const handleVisibilityChange = () => {
      if (document.hidden) {
        elapsedOffset = snapshotRef.current.elapsedMs;
        stopAnimation();
        return;
      }

      startedAt = window.performance.now();
      previousFrameAt = startedAt;

      if (mode === "full" && renderer && !animationFrame) {
        animationFrame = window.requestAnimationFrame(animate);
      } else {
        scheduleStaticFrame();
      }
    };
    const handleContextRestored = () => {
      scheduleResize();
    };

    window.addEventListener("resize", scheduleResize, { passive: true });
    window.addEventListener("scroll", scheduleStaticFrame, { passive: true });
    document.addEventListener("visibilitychange", handleVisibilityChange);
    canvas.addEventListener("webglcontextrestored", handleContextRestored);
    createRenderer();

    if ("fonts" in document) {
      void document.fonts.ready.then(() => {
        if (!destroyed) {
          scheduleResize();
        }
      });
    }

    return () => {
      destroyed = true;
      stopAnimation();

      if (resizeFrame) {
        window.cancelAnimationFrame(resizeFrame);
      }
      if (singleFrame) {
        window.cancelAnimationFrame(singleFrame);
      }

      window.removeEventListener("resize", scheduleResize);
      window.removeEventListener("scroll", scheduleStaticFrame);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      canvas.removeEventListener("webglcontextrestored", handleContextRestored);
      destroyRenderer();
      delete root.dataset.webglStage;
    };
  }, [enabled, mode, rootRef, snapshotRef]);

  return (
    <div aria-hidden="true" className="archive-webgl-stage">
      <canvas
        aria-hidden="true"
        className="archive-webgl-stage__canvas"
        ref={canvasRef}
      />
    </div>
  );
}
