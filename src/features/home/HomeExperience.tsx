"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { LocaleProvider, useLocaleContent } from "@/i18n/LocaleProvider";
import type { LocalizedArchiveContent } from "@/lib/content/types";
import { EffectModeControl } from "@/ui/EffectModeControl";
import { LocaleControl } from "@/ui/LocaleControl";
import { EntryGate } from "@/features/entry/EntryGate";
import { HomeHero } from "@/features/home/HomeHero";
import { LogsSection } from "@/features/logs/LogsSection";
import { ProjectsSection } from "@/features/projects/ProjectsSection";
import { TimelineSection } from "@/features/timeline/TimelineSection";

import "@/features/archive/archive.css";
import "./home.css";

type HomeExperienceProps = Readonly<{
  content: LocalizedArchiveContent;
}>;

export function HomeExperience({ content }: HomeExperienceProps) {
  return (
    <LocaleProvider content={content}>
      <LocalizedHomeExperience />
    </LocaleProvider>
  );
}

function LocalizedHomeExperience() {
  const { locale } = useLocaleContent();
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
        <main className="home-experience" key={locale}>
          <HomeHero
            archiveActionRef={archiveActionRef}
            revealEnabled={revealEnabled}
          />
          <TimelineSection revealEnabled={revealEnabled} />
          <ProjectsSection revealEnabled={revealEnabled} />
          <LogsSection revealEnabled={revealEnabled} />
        </main>
        <div className="archive-controls">
          <LocaleControl />
          <EffectModeControl />
        </div>
      </div>
      <EntryGate focusTargetRef={archiveActionRef} onEnter={handleEnter} />
    </>
  );
}
