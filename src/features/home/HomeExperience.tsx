"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import { LocaleProvider, useLocaleContent } from "@/i18n/LocaleProvider";
import type { LocalizedArchiveContent } from "@/lib/content/types";
import { ArchiveRuntime } from "@/effects/runtime/ArchiveRuntime";
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
  const { content, locale } = useLocaleContent();
  const [hasHydrated, setHasHydrated] = useState(false);
  const [entryComplete, setEntryComplete] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    content.archive.projects[0]?.id ?? null,
  );
  const archiveActionRef = useRef<HTMLAnchorElement>(null);

  useLayoutEffect(() => {
    const navigation = performance.getEntriesByType("navigation")[0];

    if (
      window.location.hash ||
      !(navigation instanceof PerformanceNavigationTiming) ||
      navigation.type !== "reload"
    ) {
      return;
    }

    window.scrollTo(0, 0);
  }, []);

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

  const selectProject = useCallback((projectId: string) => {
    setSelectedProjectId(projectId);
  }, []);

  const handleCurrentIndexProjectSelect = useCallback(
    (projectId: string) => {
      selectProject(projectId);

      if (window.location.hash) {
        window.history.replaceState(
          null,
          "",
          window.location.pathname + window.location.search,
        );
      }

      document.getElementById("projects")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    },
    [selectProject],
  );

  const isArchiveLocked = hasHydrated && !entryComplete;
  const revealEnabled = hasHydrated && entryComplete;

  return (
    <>
      <ArchiveRuntime
        content={content}
        enabled={revealEnabled}
        key={locale}
        locked={isArchiveLocked}
      >
        <main className="home-experience">
          <HomeHero
            archiveActionRef={archiveActionRef}
            onSelectProject={handleCurrentIndexProjectSelect}
            revealEnabled={revealEnabled}
          />
          <TimelineSection revealEnabled={revealEnabled} />
          <ProjectsSection
            onSelectProject={selectProject}
            revealEnabled={revealEnabled}
            selectedProjectId={selectedProjectId}
          />
          <LogsSection revealEnabled={revealEnabled} />
        </main>
        <div className="archive-controls">
          <LocaleControl />
          <EffectModeControl />
        </div>
      </ArchiveRuntime>
      <EntryGate focusTargetRef={archiveActionRef} onEnter={handleEnter} />
    </>
  );
}
