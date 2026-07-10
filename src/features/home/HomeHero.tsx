"use client";

import { type RefObject, useRef } from "react";

import { currentIndex, siteContent, siteStatus } from "@/content/site";
import { CopyReveal } from "@/effects/primitives/CopyReveal";
import { TypewriterText } from "@/effects/primitives/TypewriterText";
import { EffectBoundary } from "@/effects/runtime/EffectBoundary";
import { useSceneActivity } from "@/effects/runtime/useSceneActivity";
import {
  KineticTypeField,
  KineticTypeFieldFallback,
} from "@/features/home/KineticTypeField";
import { CurrentIndex } from "@/features/home/CurrentIndex";

type HomeHeroProps = Readonly<{
  archiveActionRef: RefObject<HTMLAnchorElement | null>;
  revealEnabled: boolean;
}>;

export function HomeHero({
  archiveActionRef,
  revealEnabled,
}: HomeHeroProps) {
  const heroRef = useRef<HTMLElement>(null);
  const sceneActive = useSceneActivity(heroRef);
  const shouldAnimateScene = revealEnabled && sceneActive;

  return (
    <section
      aria-labelledby="home-hero-title"
      className="home-hero"
      id="index"
      ref={heroRef}
    >
      <div className="home-hero__stage">
        <div className="home-hero__content">
          <h1 className="home-hero__title" id="home-hero-title">
            <CopyReveal
              className="home-hero__title-lockup"
              enabled={revealEnabled}
              text={siteContent.name}
            />
          </h1>

          <p className="home-hero__signature">
            <TypewriterText
              active={shouldAnimateScene}
              text={siteContent.signature}
            />
          </p>
          <p
            className="home-hero__description"
            lang={siteContent.description.lang}
          >
            <CopyReveal
              enabled={revealEnabled}
              lang={siteContent.description.lang}
              text={siteContent.description.text}
            />
          </p>
        </div>

        <dl className="home-hero__status">
          <div>
            <dt>
              <CopyReveal enabled={revealEnabled} text="STATUS" />
            </dt>
            <dd>
              <CopyReveal enabled={revealEnabled} text={siteStatus.status} />
            </dd>
          </div>
          <div>
            <dt>
              <CopyReveal enabled={revealEnabled} text="FOCUS" />
            </dt>
            <dd>
              <CopyReveal enabled={revealEnabled} text={siteStatus.focus} />
            </dd>
          </div>
          <div>
            <dt>
              <CopyReveal enabled={revealEnabled} text="UPDATED" />
            </dt>
            <dd>
              <CopyReveal enabled={revealEnabled} text={siteStatus.updated} />
            </dd>
          </div>
        </dl>

        <a
          className="home-hero__action"
          href={siteContent.archiveAction.href}
          ref={archiveActionRef}
        >
          <span aria-hidden="true" className="home-hero__action-arrow">
            →
          </span>
          <CopyReveal
            enabled={revealEnabled}
            text={siteContent.archiveAction.label}
          />
        </a>
      </div>

      <div aria-hidden="true" className="home-hero__scene">
        <EffectBoundary fallback={<KineticTypeFieldFallback />}>
          <KineticTypeField active={shouldAnimateScene} />
        </EffectBoundary>
      </div>

      <CurrentIndex items={currentIndex} revealEnabled={revealEnabled} />
    </section>
  );
}
