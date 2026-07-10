"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { EffectModeControl } from "@/ui/EffectModeControl";
import { EntryGate } from "@/features/entry/EntryGate";
import { HomeHero } from "@/features/home/HomeHero";
import { LabSection } from "@/features/lab/LabSection";
import { LogsSection } from "@/features/logs/LogsSection";
import { ProjectsSection } from "@/features/projects/ProjectsSection";
import { TimelineSection } from "@/features/timeline/TimelineSection";

import "@/features/archive/archive.css";
import "./home.css";

export function HomeExperience() {
  const [hasHydrated, setHasHydrated] = useState(false);
  const [entryComplete, setEntryComplete] = useState(false);
  const archiveActionRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      const isGateVisible =
        document.documentElement.dataset.entryRitual === "show";

      setEntryComplete(!isGateVisible);
      setHasHydrated(true);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, []);

  const handleEnter = useCallback(() => {
    setEntryComplete(true);
    setHasHydrated(true);
  }, []);

  const isArchiveLocked = hasHydrated && !entryComplete;
  const revealEnabled = hasHydrated && entryComplete;

  return (
    <>
      <div
        aria-hidden={isArchiveLocked || undefined}
        className="archive-experience"
        inert={isArchiveLocked || undefined}
      >
        <main className="home-experience">
          <HomeHero
            archiveActionRef={archiveActionRef}
            revealEnabled={revealEnabled}
          />
          <ProjectsSection revealEnabled={revealEnabled} />
          <LogsSection revealEnabled={revealEnabled} />
          <TimelineSection revealEnabled={revealEnabled} />
          <LabSection revealEnabled={revealEnabled} />
        </main>
        <EffectModeControl />
      </div>
      <EntryGate focusTargetRef={archiveActionRef} onEnter={handleEnter} />
    </>
  );
}
