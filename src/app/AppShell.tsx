import { useEffect, useRef } from 'react';
import type { CSSProperties, PointerEvent } from 'react';
import type { AtlasConfig } from '../config/atlas.schema';
import { SignalAtlasExperience } from '../features/signal/SignalAtlasExperience';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useScrollRig } from '../hooks/useScrollRig';
import { useAtlasStore } from '../store/atlasStore';

type AppShellProps = {
  config: AtlasConfig;
  warning?: string;
};

export function AppShell({ config, warning }: AppShellProps) {
  const pointer = useAtlasStore((state) => state.pointer);
  const scrollProgress = useAtlasStore((state) => state.scrollProgress);
  const reducedMotion = useAtlasStore((state) => state.reducedMotion);
  const setPointer = useAtlasStore((state) => state.setPointer);
  const pointerFrameRef = useRef(0);
  const nextPointerRef = useRef({ x: 0, y: 0 });

  useEffect(
    () => () => {
      window.cancelAnimationFrame(pointerFrameRef.current);
    },
    []
  );

  useReducedMotion();
  useScrollRig();

  const shellStyle = {
    '--scroll': scrollProgress,
    '--pointer-x': reducedMotion ? 0 : pointer.x,
    '--pointer-y': reducedMotion ? 0 : pointer.y
  } as CSSProperties;

  const handlePointerMove = (event: PointerEvent<HTMLElement>) => {
    if (reducedMotion) return;

    nextPointerRef.current = {
      x: (event.clientX / window.innerWidth) * 2 - 1,
      y: -((event.clientY / window.innerHeight) * 2 - 1)
    };

    if (!pointerFrameRef.current) {
      pointerFrameRef.current = window.requestAnimationFrame(() => {
        pointerFrameRef.current = 0;
        setPointer(nextPointerRef.current);
      });
    }
  };

  const handlePointerLeave = () => {
    window.cancelAnimationFrame(pointerFrameRef.current);
    pointerFrameRef.current = 0;
    nextPointerRef.current = { x: 0, y: 0 };
    setPointer(nextPointerRef.current);
  };

  return (
    <main
      className="atlas-shell"
      style={shellStyle}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <SignalAtlasExperience config={config} warning={warning} />
    </main>
  );
}
