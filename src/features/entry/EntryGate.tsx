"use client";

import {
  type RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { ENTRY_SESSION_KEY } from "@/core/entry";
import { useEffectMode } from "@/effects/runtime/EffectMode";

const FULL_RITUAL_DURATION_MS = 1200;
const REDUCED_RITUAL_DURATION_MS = 280;

type EntryGateProps = Readonly<{
  focusTargetRef: RefObject<HTMLElement | null>;
  onEnter: () => void;
}>;

type EntryState = "active" | "complete";

export function EntryGate({ focusTargetRef, onEnter }: EntryGateProps) {
  const { mode } = useEffectMode();
  const [entryState, setEntryState] = useState<EntryState>("active");
  const completedRef = useRef(false);
  const completionTimerRef = useRef<number | null>(null);
  const focusFrameRef = useRef<number | null>(null);
  const gateRef = useRef<HTMLElement>(null);
  const ritualStartedAtRef = useRef<number | null>(null);

  const clearCompletionTimer = useCallback(() => {
    if (completionTimerRef.current === null) {
      return;
    }

    window.clearTimeout(completionTimerRef.current);
    completionTimerRef.current = null;
  }, []);

  const completeEntry = useCallback(() => {
    const shouldTransferFocus = gateRef.current?.contains(
      document.activeElement,
    );

    if (completedRef.current) {
      return;
    }

    completedRef.current = true;
    document.documentElement.dataset.entryRitual = "skip";
    clearCompletionTimer();

    try {
      window.sessionStorage.setItem(ENTRY_SESSION_KEY, "true");
    } catch {
      // The ritual may still complete when session storage is unavailable.
    }

    setEntryState("complete");
    onEnter();

    if (shouldTransferFocus) {
      focusFrameRef.current = window.requestAnimationFrame(() => {
        focusTargetRef.current?.focus();
        focusFrameRef.current = null;
      });
    }
  }, [clearCompletionTimer, focusTargetRef, onEnter]);

  useEffect(() => {
    if (completedRef.current) {
      return;
    }

    if (document.documentElement.dataset.entryRitual !== "show") {
      completionTimerRef.current = window.setTimeout(completeEntry, 0);

      return clearCompletionTimer;
    }

    const now = Date.now();
    ritualStartedAtRef.current ??= now;
    const targetDuration =
      mode === "full"
        ? FULL_RITUAL_DURATION_MS
        : REDUCED_RITUAL_DURATION_MS;
    const elapsed = now - ritualStartedAtRef.current;
    const remainingDuration = Math.max(0, targetDuration - elapsed);
    clearCompletionTimer();
    completionTimerRef.current = window.setTimeout(
      completeEntry,
      remainingDuration,
    );

    return clearCompletionTimer;
  }, [clearCompletionTimer, completeEntry, mode]);

  useEffect(
    () => () => {
      clearCompletionTimer();

      if (focusFrameRef.current !== null) {
        window.cancelAnimationFrame(focusFrameRef.current);
      }
    },
    [clearCompletionTimer],
  );

  if (entryState !== "active") {
    return null;
  }

  return (
    <section
      aria-label="Archive entry"
      className="entry-gate"
      data-mode={mode}
      ref={gateRef}
    >
      <div className="entry-gate__trace" aria-hidden="true" />
      <div className="entry-gate__content">
        <p className="entry-gate__status">ARCHIVE READY</p>
        <p className="entry-gate__title">SCRA ATLAS</p>
        <button
          className="entry-gate__enter"
          data-entry-action
          onClick={completeEntry}
          type="button"
        >
          <span aria-hidden="true">→</span>
          ENTER ARCHIVE
        </button>
      </div>
      <button
        className="entry-gate__skip"
        data-entry-action
        onClick={completeEntry}
        type="button"
      >
        SKIP INTRO
      </button>
    </section>
  );
}
