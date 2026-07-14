"use client";

import { type RefObject, useRef } from "react";

import { CopyReveal } from "@/effects/primitives/CopyReveal";
import { TypewriterText } from "@/effects/primitives/TypewriterText";
import { EffectBoundary } from "@/effects/runtime/EffectBoundary";
import { useSceneActivity } from "@/effects/runtime/useSceneActivity";
import {
  KineticTypeField,
  KineticTypeFieldFallback,
} from "@/features/home/KineticTypeField";
import { CurrentIndex } from "@/features/home/CurrentIndex";
import { useLocaleContent } from "@/i18n/LocaleProvider";
import { getLocaleArchiveHref } from "@/core/locale";

type HomeHeroProps = Readonly<{
  archiveActionRef: RefObject<HTMLAnchorElement | null>;
  onSelectProject: (projectId: string) => void;
  revealEnabled: boolean;
}>;

export function HomeHero({
  archiveActionRef,
  onSelectProject,
  revealEnabled,
}: HomeHeroProps) {
  const { content } = useLocaleContent();
  const { archive, site } = content;
  const heroRef = useRef<HTMLElement>(null);
  const sceneActive = useSceneActivity(heroRef);
  const shouldAnimateScene = revealEnabled && sceneActive;
  const currentIndex = archive.projects.map((project) => ({
    id: project.id,
    title: project.title,
    meta: project.summary,
    href: getLocaleArchiveHref(site.locale, "/#projects"),
  }));

  return (
    <section
      aria-labelledby="home-hero-title"
      className="home-hero"
      data-runtime-section="index"
      id="index"
      ref={heroRef}
    >
      <div className="home-hero__stage">
        <div className="home-hero__content">
          <h1 className="home-hero__title" id="home-hero-title">
            <CopyReveal
              className="home-hero__title-lockup"
              enabled={revealEnabled}
              text={site.name}
            />
          </h1>

          <p className="home-hero__signature">
            <TypewriterText
              active={shouldAnimateScene}
              text={site.signature}
            />
          </p>
          <p
            className="home-hero__description"
            lang={site.description.lang}
          >
            <CopyReveal
              enabled={revealEnabled}
              lang={site.description.lang}
              text={site.description.text}
            />
          </p>
        </div>

        <dl className="home-hero__status">
          <div>
            <dt>
              <CopyReveal enabled={revealEnabled} text={site.ui.hero.statusLabel} />
            </dt>
            <dd>
              <CopyReveal enabled={revealEnabled} text={site.status.status} />
            </dd>
          </div>
          <div>
            <dt>
              <CopyReveal enabled={revealEnabled} text={site.ui.hero.focusLabel} />
            </dt>
            <dd>
              <CopyReveal enabled={revealEnabled} text={site.status.focus} />
            </dd>
          </div>
          <div>
            <dt>
              <CopyReveal enabled={revealEnabled} text={site.ui.hero.updatedLabel} />
            </dt>
            <dd>
              <CopyReveal enabled={revealEnabled} text={site.status.updated} />
            </dd>
          </div>
        </dl>

        <a
          className="home-hero__action"
          data-runtime-activate-action="open"
          data-runtime-hover-action="inspect"
          data-runtime-target="timeline"
          href={getLocaleArchiveHref(site.locale, site.archiveAction.href)}
          ref={archiveActionRef}
        >
          <span aria-hidden="true" className="home-hero__action-arrow">
            →
          </span>
          <CopyReveal
            enabled={revealEnabled}
            text={site.archiveAction.label}
          />
        </a>
      </div>

      <div aria-hidden="true" className="home-hero__scene">
        <EffectBoundary fallback={<KineticTypeFieldFallback />}>
          <KineticTypeField active={shouldAnimateScene} />
        </EffectBoundary>
      </div>

      <CurrentIndex
        heading={site.ui.currentIndex.heading}
        items={currentIndex}
        onSelectProject={onSelectProject}
        revealEnabled={revealEnabled}
      />
    </section>
  );
}
