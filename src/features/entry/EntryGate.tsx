"use client";

import {
  type RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { ENTRY_SESSION_KEY } from "@/core/entry";

const FULL_RITUAL_DURATION_MS = 1200;

type EntryGateProps = Readonly<{
  focusTargetRef: RefObject<HTMLAnchorElement | null>;
  onEnter: () => void;
}>;

type EntryState = "active" | "complete";

export function EntryGate({ focusTargetRef, onEnter }: EntryGateProps) {
  const [entryState, setEntryState] = useState<EntryState>("active");
  const completedRef = useRef(false);
  const completionTimerRef = useRef<number | null>(null);
  const focusFrameRef = useRef<number | null>(null);
  const gateRef = useRef<HTMLElement>(null);

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
      // Completion remains valid in memory when session storage is unavailable.
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

    completionTimerRef.current = window.setTimeout(
      completeEntry,
      FULL_RITUAL_DURATION_MS,
    );

    return clearCompletionTimer;
  }, [clearCompletionTimer, completeEntry]);

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
      aria-modal="true"
      className="entry-gate"
      ref={gateRef}
      role="dialog"
    >
      <div aria-hidden="true" className="entry-gate__trace" />
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
