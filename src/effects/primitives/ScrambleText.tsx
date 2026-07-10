"use client";

import { useEffect, useRef, useState } from "react";

import { useEffectMode } from "@/effects/runtime/EffectMode";

const RANDOM_GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const MIN_DURATION_MS = 300;
const MAX_DURATION_MS = 700;
const DEFAULT_DURATION_MS = 480;

type ScrambleTextProps = Readonly<{
  text: string;
  durationMs?: number;
  className?: string;
  play?: boolean;
}>;

type VisualText = {
  source: string;
  value: string;
};

function isResolvableCharacter(character: string) {
  return /[A-Za-z0-9]/.test(character);
}

function randomGlyph() {
  const index = Math.floor(Math.random() * RANDOM_GLYPHS.length);
  return RANDOM_GLYPHS[index] ?? "X";
}

function buildScrambleFrame(text: string, progress: number) {
  const characters = Array.from(text);
  const resolvableCount = characters.filter(isResolvableCharacter).length;
  const revealedCount = Math.floor(resolvableCount * progress);
  let resolvableIndex = 0;

  return characters
    .map((character) => {
      if (!isResolvableCharacter(character)) {
        return character;
      }

      const isRevealed = resolvableIndex < revealedCount;
      resolvableIndex += 1;
      return isRevealed ? character : randomGlyph();
    })
    .join("");
}

export function ScrambleText({
  text,
  durationMs = DEFAULT_DURATION_MS,
  className,
  play = true,
}: ScrambleTextProps) {
  const { mode } = useEffectMode();
  const [visualText, setVisualText] = useState<VisualText>({
    source: text,
    value: text,
  });
  const attemptedTexts = useRef(new Set<string>());

  useEffect(() => {
    const shouldAnimate = mode === "full" && play;

    if (!shouldAnimate || attemptedTexts.current.has(text)) {
      setVisualText((current) =>
        current.source === text && current.value === text
          ? current
          : { source: text, value: text },
      );
      return;
    }

    const requestedDuration = Number.isFinite(durationMs)
      ? durationMs
      : DEFAULT_DURATION_MS;
    const resolvedDuration = Math.min(
      MAX_DURATION_MS,
      Math.max(MIN_DURATION_MS, requestedDuration),
    );
    let animationFrame = 0;
    let startTime: number | null = null;

    const resolveFrame = (time: number) => {
      if (startTime === null) {
        startTime = time;
        attemptedTexts.current.add(text);
      }

      const progress = Math.min((time - startTime) / resolvedDuration, 1);

      if (progress === 1) {
        setVisualText({ source: text, value: text });
        return;
      }

      setVisualText({ source: text, value: buildScrambleFrame(text, progress) });
      animationFrame = window.requestAnimationFrame(resolveFrame);
    };

    animationFrame = window.requestAnimationFrame(resolveFrame);

    return () => {
      window.cancelAnimationFrame(animationFrame);
    };
  }, [durationMs, mode, play, text]);

  const currentVisualText =
    mode === "full" && visualText.source === text ? visualText.value : text;
  const rootClassName = ["scramble-text", className].filter(Boolean).join(" ");

  return (
    <span className={rootClassName}>
      <span aria-hidden="true" className="scramble-text__measurement">
        {text}
      </span>
      <span className="scramble-text__accessible">{text}</span>
      <span aria-hidden="true" className="scramble-text__visual">
        {currentVisualText}
      </span>
    </span>
  );
}
