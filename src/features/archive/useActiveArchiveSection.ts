"use client";

import { useEffect, useState } from "react";

import {
  archiveSectionIds,
  isActiveArchiveSectionId,
  type ActiveArchiveSectionId,
} from "@/content/archive";

export function useActiveArchiveSection(enabled: boolean) {
  const [activeSectionId, setActiveSectionId] =
    useState<ActiveArchiveSectionId | null>(null);

  useEffect(() => {
    if (!enabled || typeof IntersectionObserver === "undefined") {
      return;
    }

    const ratios = new Map<ActiveArchiveSectionId, number>();
    const resolveActiveSection = () => {
      let next: ActiveArchiveSectionId | null = null;
      let highestRatio = 0;

      for (const id of archiveSectionIds) {
        const ratio = ratios.get(id) ?? 0;

        if (ratio > highestRatio) {
          highestRatio = ratio;
          next = id;
        }
      }

      setActiveSectionId((current) => (current === next ? current : next));
    };
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.id;

          if (!isActiveArchiveSectionId(id)) {
            continue;
          }

          ratios.set(id, entry.isIntersecting ? entry.intersectionRatio : 0);
        }

        resolveActiveSection();
      },
      {
        rootMargin: "-45% 0px -45% 0px",
        threshold: [0, 0.05, 0.2, 0.5, 0.8],
      },
    );

    for (const id of archiveSectionIds) {
      const section = document.getElementById(id);

      if (section) {
        observer.observe(section);
      }
    }

    return () => {
      observer.disconnect();
    };
  }, [enabled]);

  return activeSectionId;
}
