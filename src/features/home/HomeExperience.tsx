"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useRef, useState } from "react";

import { currentIndex, siteContent, siteStatus } from "@/content/site";
import { ScrambleText } from "@/effects/primitives/ScrambleText";
import { useEffectMode } from "@/effects/runtime/EffectMode";
import { EffectBoundary } from "@/effects/runtime/EffectBoundary";
import { EntryGate } from "@/features/entry/EntryGate";
import { CurrentIndex } from "@/features/home/CurrentIndex";

import "./home.css";

const KineticTypeField = dynamic(
  () =>
    import("@/features/home/KineticTypeField").then(
      (module) => module.KineticTypeField,
    ),
  { loading: () => null, ssr: false },
);

export function HomeExperience() {
  const { mode } = useEffectMode();
  const [entryComplete, setEntryComplete] = useState(false);
  const archiveActionRef = useRef<HTMLAnchorElement>(null);
  const handleEnter = useCallback(() => setEntryComplete(true), []);

  return (
    <main
      className="home-experience"
      data-effect-mode={mode}
      data-entry-complete={entryComplete || undefined}
    >
      <div className="home-experience__information">
        <h1 className="home-experience__title">
          <ScrambleText durationMs={620} text={siteContent.name} />
        </h1>

        <p className="home-experience__signature">
          {siteContent.signature}
          <span aria-hidden="true" className="home-experience__cursor" />
        </p>
        <p
          className="home-experience__description"
          lang={siteContent.description.lang}
        >
          {siteContent.description.text}
        </p>

        <dl className="home-experience__status">
          <div>
            <dt>STATUS</dt>
            <dd>{siteStatus.status}</dd>
          </div>
          <div>
            <dt>FOCUS</dt>
            <dd>{siteStatus.focus}</dd>
          </div>
          <div>
            <dt>UPDATED</dt>
            <dd>{siteStatus.updated}</dd>
          </div>
        </dl>

        <Link
          className="home-experience__action"
          href={siteContent.archiveAction.href}
          ref={archiveActionRef}
        >
          <span aria-hidden="true" className="home-experience__action-arrow">
            →
          </span>
          <span>{siteContent.archiveAction.label}</span>
        </Link>
      </div>

      <CurrentIndex items={currentIndex} />
      <div aria-hidden="true" className="kinetic-field-slot">
        <EffectBoundary>
          <KineticTypeField mode={mode} />
        </EffectBoundary>
      </div>
      <EntryGate focusTargetRef={archiveActionRef} onEnter={handleEnter} />
    </main>
  );
}
