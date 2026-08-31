"use client";

import Image from "next/image";
import type { RefObject } from "react";

import { featuredProject } from "@/content/projects";

type TransitionOverlayProps = {
  cardRef: RefObject<HTMLDivElement | null>;
  overlayRef: RefObject<HTMLDivElement | null>;
  scanRef: RefObject<HTMLDivElement | null>;
};

export function TransitionOverlay({
  cardRef,
  overlayRef,
  scanRef,
}: TransitionOverlayProps) {
  return (
    <div
      aria-hidden="true"
      className="transition-overlay"
      ref={overlayRef}
    >
      <div className="transition-preview-card" ref={cardRef}>
        <div className="transition-preview-index">
          <span>CASE FILE</span>
          <strong>{featuredProject.sequence}</strong>
          <span>SCRA ARCHIVE</span>
        </div>

        <div className="transition-preview-media">
          <Image
            alt=""
            fill
            priority
            sizes="(max-width: 760px) 100vw, 52vw"
            src={featuredProject.cardImage}
          />
        </div>

        <div className="transition-preview-copy">
          <p>SELECTED WORK</p>
          <h2>PROJECT {featuredProject.sequence}</h2>
          <dl>
            <div>
              <dt>TYPE</dt>
              <dd>AI / PRODUCT / SYSTEM</dd>
            </div>
            <div>
              <dt>YEAR</dt>
              <dd>{featuredProject.year}</dd>
            </div>
            <div>
              <dt>STATUS</dt>
              <dd>{featuredProject.status}</dd>
            </div>
          </dl>
          <span className="transition-preview-action">VIEW CASE</span>
        </div>

        <div className="transition-scan" ref={scanRef} />
      </div>
    </div>
  );
}
