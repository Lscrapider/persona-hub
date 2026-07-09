import { useEffect, useRef } from 'react';

type TransitStarfieldCanvasProps = {
  focusIndex: number;
  focusSide: number;
  tunnelIntensity: number;
  tunnelPhase: number;
  reducedMotion: boolean;
};

type TransitStar = {
  x: number;
  y: number;
  z: number;
  size: number;
  brightness: number;
  warmth: number;
};

type SceneState = TransitStarfieldCanvasProps;

function fract(value: number) {
  return value - Math.floor(value);
}

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function smoothstep(edge0: number, edge1: number, value: number) {
  const t = clamp((value - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

function seeded(seed: number) {
  return fract(Math.sin(seed * 12.9898) * 43758.5453);
}

function createTransitStars(count: number): TransitStar[] {
  return Array.from({ length: count }, (_, index) => {
    const angle = seeded(index + 1.7) * Math.PI * 2;
    const radius = Math.pow(seeded(index + 31.4), 0.62) * 1.22;
    const squeeze = 0.78 + seeded(index + 71.9) * 0.44;

    return {
      x: Math.cos(angle) * radius * squeeze,
      y: Math.sin(angle) * radius * (0.68 + seeded(index + 13.1) * 0.52),
      z: 0.08 + seeded(index + 91.2) * 0.92,
      size: 0.36 + seeded(index + 5.5) * 1.05,
      brightness: 0.32 + seeded(index + 47.2) * 0.68,
      warmth: seeded(index + 113.3)
    };
  });
}

function projectStar(
  star: TransitStar,
  z: number,
  centerX: number,
  centerY: number,
  spread: number,
  sideDrift: number
) {
  const perspective = spread / Math.max(z, 0.045);

  return {
    x: centerX + (star.x + sideDrift * (1 - z)) * perspective,
    y: centerY + star.y * perspective
  };
}

function drawTransitField(
  context: CanvasRenderingContext2D,
  stars: TransitStar[],
  scene: SceneState,
  width: number,
  height: number
) {
  context.clearRect(0, 0, width, height);

  if (scene.reducedMotion || scene.tunnelIntensity <= 0.01) return;

  const phase = clamp(scene.tunnelPhase);
  const intensity = clamp(scene.tunnelIntensity);
  const arrival = smoothstep(0.64, 1, phase);
  const centerX = width * (0.5 + scene.focusSide * 0.1 * arrival);
  const centerY = height * (0.5 - 0.025 * arrival);
  const spread = Math.min(width, height) * (0.092 + intensity * 0.036);
  const zAdvance = 3.35;
  const stepBack = 0.026 + intensity * 0.088;
  const sideDrift = scene.focusSide * arrival * 0.1;

  context.save();
  context.globalCompositeOperation = 'lighter';

  for (const star of stars) {
    let z = fract(star.z - phase * zAdvance - scene.focusIndex * 0.173);

    if (z < 0.035) z += 1;

    const previousZ = Math.min(1.08, z + stepBack * (0.7 + star.brightness * 0.85));
    const current = projectStar(star, z, centerX, centerY, spread, sideDrift);
    const previous = projectStar(star, previousZ, centerX, centerY, spread, sideDrift);
    const margin = 80;

    if (
      (current.x < -margin && previous.x < -margin) ||
      (current.x > width + margin && previous.x > width + margin) ||
      (current.y < -margin && previous.y < -margin) ||
      (current.y > height + margin && previous.y > height + margin)
    ) {
      continue;
    }

    const distanceFromCenter = Math.hypot(current.x - centerX, current.y - centerY);
    const edgeSpeed = clamp(distanceFromCenter / (Math.min(width, height) * 0.74));
    const depthFade = smoothstep(0.02, 0.2, z) * (1 - smoothstep(0.92, 1.06, z));
    const alpha = intensity * star.brightness * depthFade * (0.18 + edgeSpeed * 0.86);

    if (alpha < 0.008) continue;

    const red = Math.round(178 + star.warmth * 34);
    const green = Math.round(207 + star.warmth * 18);
    const blue = Math.round(220 + star.warmth * 8);
    const lineWidth = (0.42 + star.size * 0.5 + edgeSpeed * 0.58) * (0.78 + intensity * 0.58);

    context.strokeStyle = `rgba(${red}, ${green}, ${blue}, ${alpha.toFixed(4)})`;
    context.lineWidth = lineWidth;
    context.beginPath();
    context.moveTo(previous.x, previous.y);
    context.lineTo(current.x, current.y);
    context.stroke();

    if (z > 0.22 && edgeSpeed < 0.18) {
      context.fillStyle = `rgba(${red}, ${green}, ${blue}, ${(alpha * 0.42).toFixed(4)})`;
      context.beginPath();
      context.arc(current.x, current.y, Math.max(0.45, lineWidth * 0.5), 0, Math.PI * 2);
      context.fill();
    }
  }

  context.restore();
}

export function TransitStarfieldCanvas({
  focusIndex,
  focusSide,
  tunnelIntensity,
  tunnelPhase,
  reducedMotion
}: TransitStarfieldCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sceneRef = useRef<SceneState>({ focusIndex, focusSide, tunnelIntensity, tunnelPhase, reducedMotion });
  const starsRef = useRef<TransitStar[]>(createTransitStars(720));

  useEffect(() => {
    sceneRef.current = { focusIndex, focusSide, tunnelIntensity, tunnelPhase, reducedMotion };
  }, [focusIndex, focusSide, tunnelIntensity, tunnelPhase, reducedMotion]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d', { alpha: true });

    if (!canvas || !context) return;

    let frame = 0;
    let disposed = false;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const ratioCap = rect.width < 760 ? 0.82 : 1.05;
      const ratio = Math.min(window.devicePixelRatio || 1, ratioCap);
      const width = Math.max(1, Math.floor(rect.width * ratio));
      const height = Math.max(1, Math.floor(rect.height * ratio));

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
    };

    const scheduleRender = () => {
      if (frame || disposed || document.hidden) return;

      frame = window.requestAnimationFrame(render);
    };

    const render = () => {
      if (disposed) return;

      frame = 0;
      drawTransitField(context, starsRef.current, sceneRef.current, canvas.width, canvas.height);

      if (!document.hidden && !sceneRef.current.reducedMotion) {
        scheduleRender();
      }
    };

    const handleVisibilityChange = () => {
      window.cancelAnimationFrame(frame);
      frame = 0;

      if (!document.hidden && !disposed) {
        scheduleRender();
      }
    };

    const handleResize = () => {
      resize();
      scheduleRender();
    };

    resize();
    scheduleRender();
    const resizeObserver = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(handleResize) : null;
    resizeObserver?.observe(canvas);
    window.addEventListener('resize', handleResize);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      disposed = true;
      window.cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return <canvas ref={canvasRef} className="field-transit-stars" aria-hidden="true" />;
}
