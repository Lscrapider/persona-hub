import type { ReactNode } from "react";

import { CopyReveal } from "@/effects/primitives/CopyReveal";
import type { ArchiveSectionDefinition } from "@/lib/content/types";

type ArchiveSectionProps = Readonly<{
  definition: ArchiveSectionDefinition;
  revealEnabled: boolean;
  children?: ReactNode;
  className?: string;
  status?: string;
}>;

export function ArchiveSection({
  definition,
  revealEnabled,
  children,
  className,
  status,
}: ArchiveSectionProps) {
  const headingId = definition.id + "-title";
  const rootClassName = ["archive-section", className].filter(Boolean).join(" ");
  const sectionStatus = status ?? definition.status;

  return (
    <section
      aria-labelledby={headingId}
      className={rootClassName}
      data-runtime-section={definition.id}
      data-surface={definition.surface}
      id={definition.id}
    >
      <div className="archive-section__inner">
        <header
          className="archive-section__header"
          data-physics-surface={definition.id}
          data-physics-target={definition.id}
        >
          <p className="archive-section__eyebrow">
            <CopyReveal enabled={revealEnabled} text={definition.eyebrow} />
          </p>
          <h2 id={headingId}>
            <CopyReveal enabled={revealEnabled} text={definition.title} />
          </h2>
          <p className="archive-section__summary">
            <CopyReveal enabled={revealEnabled} text={definition.summary} />
          </p>
          <p className="archive-section__status">
            <CopyReveal enabled={revealEnabled} text={sectionStatus} />
          </p>
        </header>
        {children}
      </div>
    </section>
  );
}
