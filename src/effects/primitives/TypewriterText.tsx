"use client";

import { useEffect, useRef, useState } from "react";

import { useEffectMode } from "@/effects/runtime/EffectMode";

const TYPE_DELAY_MS = 44;
const HOLD_DELAY_MS = 2600;
const DELETE_DELAY_MS = 30;
const PAUSE_DELAY_MS = 760;
const CYCLE_START_DELAY_MS = 260;

type TypewriterPhase = "idle" | "typing" | "holding" | "deleting" | "pausing";

type TypewriterState = {
  phase: TypewriterPhase;
  index: number;
};

type TypewriterTextProps = Readonly<{
  text: string;
  active: boolean;
}>;

export function TypewriterText({ text, active }: TypewriterTextProps) {
  const { mode } = useEffectMode();
  const [visibleText, setVisibleText] = useState(text);
  const stateRef = useRef<TypewriterState>({
    phase: "idle",
    index: 0,
  });

  useEffect(() => {
    if (mode !== "full") {
      stateRef.current = { phase: "idle", index: 0 };
      return;
    }

    if (!active) {
      return;
    }

    let timerId: number | null = null;
    let cancelled = false;
    const characters = Array.from(text);

    const schedule = (callback: () => void, delay: number) => {
      timerId = window.setTimeout(callback, delay);
    };

    const tick = () => {
      if (cancelled) {
        return;
      }

      const state = stateRef.current;

      if (state.phase === "idle") {
        state.phase = "typing";
        state.index = 0;
        setVisibleText("");
        schedule(tick, CYCLE_START_DELAY_MS);
        return;
      }

      if (state.phase === "typing") {
        state.index += 1;
        setVisibleText(characters.slice(0, state.index).join(""));

        if (state.index < characters.length) {
          schedule(tick, TYPE_DELAY_MS);
          return;
        }

        state.phase = "holding";
        schedule(tick, HOLD_DELAY_MS);
        return;
      }

      if (state.phase === "holding") {
        state.phase = "deleting";
        schedule(tick, DELETE_DELAY_MS);
        return;
      }

      if (state.phase === "deleting") {
        state.index -= 1;
        setVisibleText(characters.slice(0, Math.max(0, state.index)).join(""));

        if (state.index > 0) {
          schedule(tick, DELETE_DELAY_MS);
          return;
        }

        state.phase = "pausing";
        schedule(tick, PAUSE_DELAY_MS);
        return;
      }

      state.phase = "idle";
      schedule(tick, 0);
    };

    tick();

    return () => {
      cancelled = true;

      if (timerId !== null) {
        window.clearTimeout(timerId);
      }
    };
  }, [active, mode, text]);

  const visualText = mode === "full" ? visibleText : text;

  return (
    <span className="typewriter-text">
      <span aria-hidden="true" className="typewriter-text__measurement">
        {text}
      </span>
      <span className="typewriter-text__accessible">{text}</span>
      <span aria-hidden="true" className="typewriter-text__visual">
        {visualText}
      </span>
      {mode === "full" ? (
        <span aria-hidden="true" className="typewriter-text__cursor" />
      ) : null}
    </span>
  );
}
