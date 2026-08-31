"use client";

import { Canvas } from "@react-three/fiber";
import {
  Suspense,
  useCallback,
  useEffect,
  useState,
} from "react";

import { ExperienceScene } from "@/components/experience/ExperienceScene";
import { useCardTransition } from "@/components/transition/TransitionProvider";

const MAX_RENDER_PIXELS = 5_000_000;

function getPerformanceDpr() {
  const pixelBudgetDpr = Math.sqrt(
    MAX_RENDER_PIXELS /
      Math.max(window.innerWidth * window.innerHeight, 1),
  );

  return Math.max(
    1,
    Math.min(window.devicePixelRatio, 1.5, pixelBudgetDpr),
  );
}

export function ExperienceCanvas() {
  const {
    motionValues,
    setSceneReady,
  } = useCardTransition();
  const [dpr, setDpr] = useState(getPerformanceDpr);
  const handleDispose = useCallback(
    () => setSceneReady(false),
    [setSceneReady],
  );
  const handleReady = useCallback(
    () => setSceneReady(true),
    [setSceneReady],
  );

  useEffect(() => {
    const updateDpr = () => setDpr(getPerformanceDpr());
    window.addEventListener("resize", updateDpr, {
      passive: true,
    });
    return () => window.removeEventListener("resize", updateDpr);
  }, []);

  return (
    <div aria-hidden="true" className="experience-canvas">
      <Canvas
        camera={{ fov: 35, position: [0, 0, 6] }}
        dpr={dpr}
        flat
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: "high-performance",
        }}
        onPointerMissed={() => undefined}
      >
        <Suspense fallback={null}>
          <ExperienceScene
            motionValues={motionValues}
            onDispose={handleDispose}
            onReady={handleReady}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
