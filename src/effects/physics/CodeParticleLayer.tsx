"use client";

import { type ReactNode, type RefObject, useEffect, useRef } from "react";

import {
  CHARGE_TOKEN_INTERVAL_MS,
  COARSE_PARTICLE_CAPACITY,
  DESKTOP_PARTICLE_CAPACITY,
  MAX_CHARGED_TOKENS,
  PARTICLE_LIFETIME_MS,
} from "@/effects/physics/physicsConstants";
import {
  isPhysicalInteractionSignal,
  PHYSICAL_INTERACTION_EVENT,
  type PhysicalInteractionSignal,
} from "@/effects/physics/physicalInteractionContract";
import type { PhysicsVocabulary } from "@/effects/physics/physicsVocabulary";

import "./codeParticleLayer.css";

type ParticleState = 0 | 1 | 2;

type ParticleRecord = {
  state: ParticleState;
  token: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  velocityX: number;
  velocityY: number;
  angle: number;
  angularVelocity: number;
  bornAt: number;
  releasedAt: number;
  energy: number;
  sequenceId: number;
};

type CodeParticleLayerProps = Readonly<{
  enabled: boolean;
  rootRef: RefObject<HTMLElement | null>;
  vocabulary: PhysicsVocabulary;
}>;

const PARTICLE_MARGIN_PX = 180;
const GOLDEN_ANGLE = 2.399963229728653;
const FALLBACK_POOL = ["class"] as const;

function createParticles() {
  return Array.from({ length: DESKTOP_PARTICLE_CAPACITY }, () => ({
    state: 0 as ParticleState,
    token: "",
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
    velocityX: 0,
    velocityY: 0,
    angle: 0,
    angularVelocity: 0,
    bornAt: 0,
    releasedAt: 0,
    energy: 0,
    sequenceId: 0,
  }));
}

function resetParticle(particle: ParticleRecord) {
  particle.state = 0;
  particle.token = "";
  particle.velocityX = 0;
  particle.velocityY = 0;
  particle.energy = 0;
  particle.sequenceId = 0;
}

function cssToken(style: CSSStyleDeclaration, name: string, fallback: string) {
  return style.getPropertyValue(name).trim() || fallback;
}

export function CodeParticleLayer({
  enabled,
  rootRef,
  vocabulary,
}: CodeParticleLayerProps): ReactNode {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<ParticleRecord[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const root = rootRef.current;
    const particles = particlesRef.current.length
      ? particlesRef.current
      : createParticles();

    particlesRef.current = particles;

    if (!enabled || !canvas || !root) {
      return;
    }

    const context = canvas.getContext("2d", { alpha: true });

    if (!context) {
      return;
    }

    const rootStyle = window.getComputedStyle(document.documentElement);
    const colorSignal = cssToken(rootStyle, "--color-signal", "#ec5b45");
    const colorVoid = cssToken(rootStyle, "--color-void", "#111111");
    const colorBone = cssToken(rootStyle, "--color-bone", "#f3efe6");
    const fontMono = cssToken(rootStyle, "--font-mono", "monospace");
    const coarsePointer = window.matchMedia("(pointer: coarse)");
    let viewportWidth = 0;
    let viewportHeight = 0;
    let frameId = 0;
    let lastFrameTime = 0;
    let activeSequenceId = -1;
    let activePointerX = 0;
    let activePointerY = 0;
    let chargeStartedAt = 0;
    let chargedTokenCount = 0;
    let activeLimit = DESKTOP_PARTICLE_CAPACITY;
    let activePool: readonly string[] = [];

    const configureContext = () => {
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.globalAlpha = 1;
      context.fillStyle = colorSignal;
      context.strokeStyle = colorVoid;
      context.shadowColor = colorBone;
      context.shadowBlur = 0;
      context.font = `600 12px ${fontMono}`;
      context.textAlign = "center";
      context.textBaseline = "middle";
    };

    const resize = () => {
      viewportWidth = window.innerWidth;
      viewportHeight = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.25);

      canvas.width = Math.max(1, Math.round(viewportWidth * dpr));
      canvas.height = Math.max(1, Math.round(viewportHeight * dpr));
      canvas.style.width = `${viewportWidth.toString()}px`;
      canvas.style.height = `${viewportHeight.toString()}px`;
      configureContext();
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const stopFrame = () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
        frameId = 0;
      }

      lastFrameTime = 0;
    };

    const clearAll = () => {
      activeSequenceId = -1;
      activePool = [];
      chargedTokenCount = 0;

      for (let index = 0; index < particles.length; index += 1) {
        resetParticle(particles[index]!);
      }

      stopFrame();
      context.clearRect(0, 0, viewportWidth, viewportHeight);
    };

    const claimParticle = (limit: number) => {
      let fallbackIndex = -1;
      let fallbackEnergy = Number.POSITIVE_INFINITY;
      let fallbackReleasedAt = Number.POSITIVE_INFINITY;

      for (let index = 0; index < limit; index += 1) {
        const particle = particles[index]!;

        if (particle.state === 0) {
          return particle;
        }

        if (
          particle.state === 2 &&
          (particle.energy < fallbackEnergy ||
            (particle.energy === fallbackEnergy &&
              particle.releasedAt < fallbackReleasedAt))
        ) {
          fallbackIndex = index;
          fallbackEnergy = particle.energy;
          fallbackReleasedAt = particle.releasedAt;
        }
      }

      return fallbackIndex >= 0 ? particles[fallbackIndex]! : null;
    };

    const enforceVisibleLimit = (limit: number) => {
      for (let index = limit; index < particles.length; index += 1) {
        resetParticle(particles[index]!);
      }
    };

    const setToken = (
      particle: ParticleRecord,
      pool: readonly string[],
      sequenceId: number,
      particleIndex: number,
    ) => {
      const safePool = pool.length ? pool : FALLBACK_POOL;
      particle.token =
        safePool[(sequenceId + particleIndex) % safePool.length] ?? "class";
      particle.sequenceId = sequenceId;
    };

    const releaseParticle = (
      particle: ParticleRecord,
      now: number,
      centerX: number,
      centerY: number,
      velocityX: number,
      velocityY: number,
      strength: number,
      ordinal: number,
    ) => {
      let radialX = particle.x - centerX;
      let radialY = particle.y - centerY;
      let radialLength = Math.hypot(radialX, radialY);

      if (radialLength < 0.001) {
        const fallbackAngle = particle.sequenceId * 0.71 + ordinal * GOLDEN_ANGLE;
        radialX = Math.cos(fallbackAngle);
        radialY = Math.sin(fallbackAngle);
        radialLength = 1;
      }

      radialX /= radialLength;
      radialY /= radialLength;

      const inputSpeed = Math.hypot(velocityX, velocityY);
      const directionalBias = inputSpeed > 24 ? 0.55 : 0;
      const inputDirectionX = inputSpeed > 0 ? velocityX / inputSpeed : 0;
      const inputDirectionY = inputSpeed > 0 ? velocityY / inputSpeed : 0;
      let directionX =
        radialX * (1 - directionalBias) + inputDirectionX * directionalBias;
      let directionY =
        radialY * (1 - directionalBias) + inputDirectionY * directionalBias;
      const directionLength = Math.hypot(directionX, directionY) || 1;
      const releaseSpeed = 105 + strength * 365 + (ordinal % 4) * 17;

      directionX /= directionLength;
      directionY /= directionLength;
      particle.state = 2;
      particle.releasedAt = now;
      particle.velocityX = directionX * releaseSpeed;
      particle.velocityY = directionY * releaseSpeed - 24;
      particle.angularVelocity = ((ordinal % 2 ? 1 : -1) * (0.7 + strength * 1.8));
      particle.energy = Math.max(0.12, strength);
    };

    const spawnHeldParticle = (now: number) => {
      const particle = claimParticle(activeLimit);

      if (!particle || activeSequenceId < 0) {
        return false;
      }

      const ordinal = chargedTokenCount;
      const angle = activeSequenceId * 0.47 + ordinal * GOLDEN_ANGLE;
      const radius = 16 + Math.sqrt(ordinal + 1) * 11;

      setToken(particle, activePool, activeSequenceId, ordinal);
      particle.state = 1;
      particle.x = activePointerX;
      particle.y = activePointerY;
      particle.targetX = activePointerX + Math.cos(angle) * radius;
      particle.targetY = activePointerY + Math.sin(angle) * radius;
      particle.velocityX = 0;
      particle.velocityY = 0;
      particle.angle = angle * 0.08;
      particle.angularVelocity = 0;
      particle.bornAt = now;
      particle.releasedAt = 0;
      particle.energy = 1;
      return true;
    };

    const spawnImpulse = (signal: PhysicalInteractionSignal, now: number) => {
      if (signal.action !== "impulse") {
        return;
      }

      const pool = vocabulary.resolve({
        surface: signal.surface,
        target: signal.target,
      });
      const limit =
        signal.pointerType === "touch" || coarsePointer.matches
          ? COARSE_PARTICLE_CAPACITY
          : DESKTOP_PARTICLE_CAPACITY;
      const count = 4 + ((signal.sequenceId * 3) % 4);

      enforceVisibleLimit(limit);

      for (let ordinal = 0; ordinal < count; ordinal += 1) {
        const particle = claimParticle(limit);

        if (!particle) {
          break;
        }

        const angle = signal.sequenceId * 0.61 + ordinal * GOLDEN_ANGLE;
        const radius = 4 + (ordinal % 3) * 3;

        setToken(particle, pool, signal.sequenceId, ordinal);
        particle.state = 2;
        particle.x = signal.sample.position.x + Math.cos(angle) * radius;
        particle.y = signal.sample.position.y + Math.sin(angle) * radius;
        particle.targetX = particle.x;
        particle.targetY = particle.y;
        particle.velocityX = 0;
        particle.velocityY = 0;
        particle.angle = angle * 0.11;
        particle.angularVelocity = 0;
        particle.bornAt = now;
        particle.releasedAt = now;
        particle.energy = signal.sample.strength;
        releaseParticle(
          particle,
          now,
          signal.sample.position.x,
          signal.sample.position.y,
          0,
          0,
          signal.sample.strength,
          ordinal,
        );
      }
    };

    const hasLiveParticle = () => {
      for (let index = 0; index < particles.length; index += 1) {
        if (particles[index]!.state !== 0) {
          return true;
        }
      }

      return false;
    };

    const drawFrame = (now: number) => {
      frameId = 0;
      const elapsedMs = lastFrameTime
        ? Math.min(34, Math.max(1, now - lastFrameTime))
        : 16.667;
      const elapsedSeconds = elapsedMs / 1_000;
      const damping = Math.pow(0.984, elapsedMs / 16.667);

      lastFrameTime = now;
      context.clearRect(0, 0, viewportWidth, viewportHeight);

      if (activeSequenceId >= 0) {
        const desiredCount = Math.min(
          MAX_CHARGED_TOKENS,
          activeLimit,
          Math.floor((now - chargeStartedAt) / CHARGE_TOKEN_INTERVAL_MS) + 1,
        );

        while (chargedTokenCount < desiredCount) {
          if (!spawnHeldParticle(now)) {
            break;
          }

          chargedTokenCount += 1;
        }
      }

      for (let index = 0; index < particles.length; index += 1) {
        const particle = particles[index]!;

        if (particle.state === 0) {
          continue;
        }

        let alpha = 1;

        if (particle.state === 1) {
          particle.velocityX =
            (particle.velocityX + (particle.targetX - particle.x) * 0.16) * 0.72;
          particle.velocityY =
            (particle.velocityY + (particle.targetY - particle.y) * 0.16) * 0.72;
          particle.x += particle.velocityX;
          particle.y += particle.velocityY;
          alpha = Math.min(1, (now - particle.bornAt) / 160);
        } else {
          const releaseAge = now - particle.releasedAt;

          if (
            releaseAge >= PARTICLE_LIFETIME_MS ||
            particle.x < -PARTICLE_MARGIN_PX ||
            particle.x > viewportWidth + PARTICLE_MARGIN_PX ||
            particle.y < -PARTICLE_MARGIN_PX ||
            particle.y > viewportHeight + PARTICLE_MARGIN_PX
          ) {
            resetParticle(particle);
            continue;
          }

          particle.velocityX *= damping;
          particle.velocityY = particle.velocityY * damping + 82 * elapsedSeconds;
          particle.x += particle.velocityX * elapsedSeconds;
          particle.y += particle.velocityY * elapsedSeconds;
          particle.angle += particle.angularVelocity * elapsedSeconds;
          particle.energy *= damping;
          alpha = Math.pow(1 - releaseAge / PARTICLE_LIFETIME_MS, 1.45);
        }

        context.save();
        context.globalAlpha = Math.max(0, Math.min(1, alpha)) * 0.9;
        context.translate(particle.x, particle.y);
        context.rotate(particle.angle);
        context.fillText(particle.token, 0, 0);
        context.restore();
      }

      context.globalAlpha = 1;

      if (activeSequenceId >= 0 || hasLiveParticle()) {
        frameId = window.requestAnimationFrame(drawFrame);
      } else {
        lastFrameTime = 0;
        context.clearRect(0, 0, viewportWidth, viewportHeight);
      }
    };

    const ensureFrame = () => {
      if (!frameId) {
        frameId = window.requestAnimationFrame(drawFrame);
      }
    };

    const handlePhysicalSignal = (event: Event) => {
      const signal = (event as CustomEvent<unknown>).detail;

      if (!isPhysicalInteractionSignal(signal)) {
        return;
      }

      const now = window.performance.now();

      if (signal.action === "impulse") {
        spawnImpulse(signal, now);
        ensureFrame();
        return;
      }

      if (signal.action === "charge") {
        activeSequenceId = signal.sequenceId;
        activePointerX = signal.sample.position.x;
        activePointerY = signal.sample.position.y;
        chargeStartedAt = now;
        chargedTokenCount = 0;
        activeLimit =
          signal.pointerType === "touch" || coarsePointer.matches
            ? COARSE_PARTICLE_CAPACITY
            : DESKTOP_PARTICLE_CAPACITY;
        enforceVisibleLimit(activeLimit);
        activePool = vocabulary.resolve({
          surface: signal.surface,
          target: signal.target,
        });
        ensureFrame();
        return;
      }

      if (signal.action === "grab" && signal.sequenceId === activeSequenceId) {
        const deltaX = signal.sample.position.x - activePointerX;
        const deltaY = signal.sample.position.y - activePointerY;

        activePointerX = signal.sample.position.x;
        activePointerY = signal.sample.position.y;

        for (let index = 0; index < particles.length; index += 1) {
          const particle = particles[index]!;

          if (particle.state === 1 && particle.sequenceId === activeSequenceId) {
            particle.targetX += deltaX;
            particle.targetY += deltaY;
          }
        }

        ensureFrame();
        return;
      }

      if (signal.action === "release" && signal.sequenceId === activeSequenceId) {
        activePointerX = signal.sample.position.x;
        activePointerY = signal.sample.position.y;

        for (let index = 0; index < particles.length; index += 1) {
          const particle = particles[index]!;

          if (particle.state === 1 && particle.sequenceId === activeSequenceId) {
            releaseParticle(
              particle,
              now,
              activePointerX,
              activePointerY,
              signal.sample.velocityCssPxPerSecond.x,
              signal.sample.velocityCssPxPerSecond.y,
              signal.sample.strength,
              index,
            );
          }
        }

        activeSequenceId = -1;
        activePool = [];
        ensureFrame();
        return;
      }

      if (signal.action === "cancel" && signal.sequenceId === activeSequenceId) {
        for (let index = 0; index < particles.length; index += 1) {
          const particle = particles[index]!;

          if (particle.state === 1 && particle.sequenceId === activeSequenceId) {
            resetParticle(particle);
          }
        }

        activeSequenceId = -1;
        activePool = [];
        chargedTokenCount = 0;
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        clearAll();
      }
    };

    resize();
    root.addEventListener(PHYSICAL_INTERACTION_EVENT, handlePhysicalSignal);
    window.addEventListener("resize", resize, { passive: true });
    window.visualViewport?.addEventListener("resize", resize, { passive: true });
    window.addEventListener("blur", clearAll);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearAll();
      root.removeEventListener(PHYSICAL_INTERACTION_EVENT, handlePhysicalSignal);
      window.removeEventListener("resize", resize);
      window.visualViewport?.removeEventListener("resize", resize);
      window.removeEventListener("blur", clearAll);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [enabled, rootRef, vocabulary]);

  return <canvas aria-hidden="true" className="code-particle-layer" ref={canvasRef} />;
}
