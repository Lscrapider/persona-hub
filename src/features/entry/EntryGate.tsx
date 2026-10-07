"use client";

import {
  type CSSProperties,
  type KeyboardEvent,
  type RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { ENTRY_HYDRATED_EVENT } from "@/core/entry";
import { useLocaleContent } from "@/i18n/LocaleProvider";

import "./entry.css";

type EntryGateProps = Readonly<{
  focusTargetRef: RefObject<HTMLAnchorElement | null>;
  onEnter: () => void;
}>;

type BootPhase = "connect" | "index" | "prepare" | "ready" | "handoff";
type ResourceState = "pending" | "ready" | "fallback";

const PHASE_HEADLINES: Record<BootPhase, readonly [string, string]> = {
  connect: ["SYSTEM", "CHECK"],
  index: ["READING", "ARCHIVE"],
  prepare: ["LOADING", "RESOURCES"],
  ready: ["SYSTEM", "ONLINE"],
  handoff: ["ENTER", "ARCHIVE"],
};

const MIN_BOOT_MS = 2400;
const RESOURCE_DEADLINE_MS = 4300;
const READY_HOLD_MS = 650;
const HANDOFF_MS = 650;

export function EntryGate({ focusTargetRef, onEnter }: EntryGateProps) {
  const { content, locale } = useLocaleContent();
  const copy = content.site.ui.entry;
  const [complete, setComplete] = useState(false);
  const [phase, setPhase] = useState<BootPhase>("connect");
  const [indexed, setIndexed] = useState(0);
  const [fonts, setFonts] = useState<ResourceState>("pending");
  const [scene, setScene] = useState<ResourceState>("pending");
  const completedRef = useRef(false);
  const timersRef = useRef<number[]>([]);
  const focusFrameRef = useRef<number | null>(null);
  const gateRef = useRef<HTMLElement>(null);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(window.clearTimeout);
    timersRef.current = [];
  }, []);

  const completeEntry = useCallback(() => {
    if (completedRef.current) return;

    const shouldTransferFocus = gateRef.current?.contains(document.activeElement);
    completedRef.current = true;
    clearTimers();
    document.documentElement.dataset.entryRitual = "skip";

    setComplete(true);
    onEnter();

    if (shouldTransferFocus) {
      focusFrameRef.current = window.requestAnimationFrame(() => {
        focusTargetRef.current?.focus({ preventScroll: true });
        focusFrameRef.current = null;
      });
    }
  }, [clearTimers, focusTargetRef, onEnter]);

  useEffect(() => {
    if (completedRef.current) return;
    const root = document.documentElement;
    let disposed = false;
    let minimumReached = false;
    let finishing = false;
    let fontsSettled = false;
    let sceneSettled = false;
    let motionQuery: MediaQueryList | null = null;

    const later = (delay: number, action: () => void) => {
      timersRef.current.push(window.setTimeout(() => {
        if (!disposed && !completedRef.current) action();
      }, delay));
    };

    const beginHandoff = () => {
      if (!minimumReached || !fontsSettled || !sceneSettled || finishing) return;
      finishing = true;
      setPhase("ready");
      later(READY_HOLD_MS, () => setPhase("handoff"));
      later(READY_HOLD_MS + HANDOFF_MS, completeEntry);
    };

    try {
      motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    } catch {
      // The bootstrap's readable fallback remains authoritative.
    }

    if (root.dataset.entryRitual !== "show" || motionQuery?.matches) {
      later(0, completeEntry);
      return clearTimers;
    }

    // Claim the short pre-hydration fallback; its bounded watchdog stays alive.
    const entryObserver = new MutationObserver(() => {
      if (root.dataset.entryRitual !== "show") completeEntry();
    });
    entryObserver.observe(root, {
      attributes: true,
      attributeFilter: ["data-entry-ritual"],
    });
    document.dispatchEvent(new Event(ENTRY_HYDRATED_EVENT));
    gateRef.current?.focus({ preventScroll: true });

    const handleReducedMotion = (event: MediaQueryListEvent) => {
      if (event.matches) completeEntry();
    };
    if (typeof motionQuery?.addEventListener === "function") {
      motionQuery.addEventListener("change", handleReducedMotion);
    }

    // These rows register the already validated, server-provided archive index.
    later(220, () => setPhase("index"));
    later(600, () => setIndexed(1));
    later(950, () => setIndexed(2));
    later(1300, () => setIndexed(3));
    later(1600, () => setPhase("prepare"));
    later(MIN_BOOT_MS, () => {
      minimumReached = true;
      beginHandoff();
    });

    if ("fonts" in document) {
      const style = window.getComputedStyle(root);
      const families = ["--font-league-gothic", "--font-manrope"].map((token) =>
        style.getPropertyValue(token).split(",")[0]?.trim() ?? "",
      );
      void Promise.all(families.map((family) =>
        family ? document.fonts.load("16px " + family) : Promise.resolve([]),
      )).then(() => document.fonts.ready).then(() => {
        if (disposed || completedRef.current || fontsSettled) return;
        const available = families.every((family) =>
          family && document.fonts.check("16px " + family),
        );
        fontsSettled = true;
        setFonts(available ? "ready" : "fallback");
        beginHandoff();
      }).catch(() => {
        if (disposed || completedRef.current || fontsSettled) return;
        fontsSettled = true;
        setFonts("fallback");
        beginHandoff();
      });
    } else {
      fontsSettled = true;
      later(0, () => setFonts("fallback"));
    }

    const archiveRoot = document.querySelector<HTMLElement>(".archive-experience");
    const readScene = () => {
      if (disposed || completedRef.current || sceneSettled) return;
      const state = archiveRoot?.dataset.webglStage;
      if (state === "ready" || state === "fallback" || state === "lost") {
        sceneSettled = true;
        setScene(state === "ready" ? "ready" : "fallback");
        beginHandoff();
      }
    };
    const sceneObserver = new MutationObserver(readScene);
    if (archiveRoot) {
      sceneObserver.observe(archiveRoot, {
        attributes: true,
        attributeFilter: ["data-webgl-stage"],
      });
    }
    later(0, readScene);

    later(RESOURCE_DEADLINE_MS, () => {
      if (!fontsSettled) {
        fontsSettled = true;
        setFonts("fallback");
      }
      if (!sceneSettled) {
        sceneSettled = true;
        setScene("fallback");
      }
      beginHandoff();
    });

    return () => {
      disposed = true;
      clearTimers();
      entryObserver.disconnect();
      sceneObserver.disconnect();
      if (typeof motionQuery?.removeEventListener === "function") {
        motionQuery.removeEventListener("change", handleReducedMotion);
      }
    };
  }, [clearTimers, completeEntry, complete]);

  useEffect(() => () => {
    clearTimers();
    if (focusFrameRef.current !== null) {
      window.cancelAnimationFrame(focusFrameRef.current);
    }
  }, [clearTimers]);

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      completeEntry();
    } else if (event.key === "Tab") {
      const buttons = gateRef.current?.querySelectorAll<HTMLButtonElement>("button");
      if (!buttons?.length) return;
      const first = buttons[0];
      const last = buttons[buttons.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && (document.activeElement === first || document.activeElement === gateRef.current)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === gateRef.current)) {
        event.preventDefault();
        first.focus();
      }
    }
  };

  if (complete) return null;

  const modules = [
    { id: "timeline", records: content.archive.timeline, label: content.site.sections.timeline.label },
    { id: "projects", records: content.archive.projects, label: content.site.sections.projects.label },
    { id: "logs", records: content.archive.logs, label: content.site.sections.logs.label },
  ];
  const total = modules.reduce((sum, module) => sum + module.records.length, 0);
  const checks = [phase !== "connect", indexed === modules.length, fonts !== "pending", scene !== "pending"];
  const checked = checks.filter(Boolean).length;
  const phaseCopy = {
    connect: copy.initializing,
    index: copy.indexing,
    prepare: copy.preparing,
    ready: copy.ready,
    handoff: copy.handoff,
  }[phase];
  const resources = [
    { label: copy.interfaceLabel, state: phase === "connect" ? "pending" : "ready", detail: "INTERFACE / NAVIGATION" },
    { label: copy.fontLabel, state: fonts, detail: "TYPE / DISPLAY" },
    { label: copy.sceneLabel, state: scene, detail: "ARCHIVE / SCENE" },
  ];
  const activity = [copy.clientReady, copy.indexReady, copy.fontsReady, copy.sceneReady];

  return (
    <section
      aria-labelledby="entry-system-title"
      aria-modal="true"
      className="entry-gate"
      data-phase={phase}
      onKeyDown={handleKeyDown}
      ref={gateRef}
      role="dialog"
      style={{ "--entry-handoff": HANDOFF_MS + "ms" } as CSSProperties}
      tabIndex={-1}
    >
      <div aria-hidden="true" className="entry-gate__cover entry-gate__cover--top" />
      <div aria-hidden="true" className="entry-gate__cover entry-gate__cover--bottom" />
      <header className="entry-gate__header">
        <p id="entry-system-title"><span className="entry-gate__mark" aria-hidden="true" />{copy.title}<span className="entry-gate__system-label">{copy.bootLabel}</span></p>
        <span className="entry-gate__session">{copy.sessionLabel}</span>
      </header>

      <div className="entry-gate__workspace">
        <aside aria-hidden="true" className="entry-gate__index">
          <p className="entry-gate__eyebrow">{copy.archiveLabel}<span>{String(total).padStart(2, "0")} {copy.recordsLabel}</span></p>
          <ol className="entry-gate__modules">
            {modules.map((module, index) => (
              <li
                className="entry-gate__module"
                data-state={index < indexed ? "ready" : index === indexed ? "reading" : "pending"}
                key={module.id}
                style={{ "--entry-row": index } as CSSProperties}
              >
                <div className="entry-gate__module-heading">
                  <span className="entry-gate__module-name">{module.label}</span>
                  <span className="entry-gate__count">{String(module.records.length).padStart(2, "0")}</span>
                </div>
                <div className="entry-gate__module-meta"><span>{locale + "/" + module.id + ".json"}</span><span>{index < indexed ? copy.loaded : index === indexed ? copy.reading : copy.pending}</span></div>
                <ul className="entry-gate__records">
                  {module.records.slice(0, 2).map((record, row) => (
                    <li key={record.id} style={{ "--entry-record": row } as CSSProperties}>
                      <span>{record.title}</span><span aria-hidden="true">↗</span>
                    </li>
                  ))}
                  {module.records.length === 0 ? <li>{copy.empty}</li> : null}
                </ul>
              </li>
            ))}
          </ol>
        </aside>

        <div className="entry-gate__core">
          <p className="entry-gate__eyebrow entry-gate__core-label">{copy.bootLabel}<span>BOOT</span></p>
          <div className="entry-gate__headline" aria-hidden="true" key={phase}>
            <span>{PHASE_HEADLINES[phase][0]}</span>
            <span>{PHASE_HEADLINES[phase][1]}</span>
          </div>
          <p className="entry-gate__phase" role="status" aria-live="polite" aria-atomic="true"><span aria-hidden="true" />{phaseCopy}</p>
          <div aria-label={copy.progressLabel} aria-valuemax={4} aria-valuemin={0} aria-valuenow={checked} className="entry-gate__progress" role="progressbar">
            <span className="entry-gate__progress-count" aria-hidden="true">{String(checked).padStart(2, "0")}<small>/ 04</small></span>
            <div className="entry-gate__checkpoints" aria-hidden="true">
              {checks.map((done, index) => <span data-done={done || undefined} key={index} />)}
            </div>
          </div>
        </div>

        <aside aria-hidden="true" className="entry-gate__resources">
          <p className="entry-gate__eyebrow">{copy.resourceLabel}<span>LOCAL</span></p>
          <ul className="entry-gate__resource-list">
            {resources.map((resource, index) => (
              <li data-state={resource.state} key={resource.detail} style={{ "--entry-row": index } as CSSProperties}>
                <div><span className="entry-gate__resource-symbol">{resource.state === "ready" ? "✓" : resource.state === "fallback" ? "↳" : "·"}</span><span>{resource.label}</span><strong>{resource.state === "ready" ? copy.loaded : resource.state === "fallback" ? copy.fallback : copy.pending}</strong></div>
                <p>{resource.detail}</p>
              </li>
            ))}
          </ul>
          <div className="entry-gate__activity">
            <p className="entry-gate__eyebrow">{copy.activityLabel}</p>
            <ol>
              {activity.map((message, index) => (
                <li data-done={checks[index] || undefined} key={message}><span>{checks[index] ? "↳" : "·"}</span>{message}<span>{checks[index] ? "OK" : "—"}</span></li>
              ))}
            </ol>
          </div>
        </aside>
      </div>

      <footer className="entry-gate__footer">
        <div className="entry-gate__footer-status"><span aria-hidden="true" />{phase === "ready" || phase === "handoff" ? copy.status : phaseCopy}<span className="entry-gate__footer-source">TIMELINE / PROJECTS / LOGS</span></div>
        <div className="entry-gate__actions">
          <button className="entry-gate__skip" data-entry-action onClick={completeEntry} type="button">{copy.skip}<kbd>ESC</kbd></button>
          <button className="entry-gate__enter" data-entry-action onClick={completeEntry} type="button">{copy.enter}<span aria-hidden="true">↗</span></button>
        </div>
      </footer>
    </section>
  );
}
