import type { ReactNode } from "react";

import type { ArchiveSectionDefinition } from "@/content/archive";
import { CopyReveal } from "@/effects/primitives/CopyReveal";

type ArchiveSectionProps = Readonly<{
  definition: ArchiveSectionDefinition;
  revealEnabled: boolean;
  children?: ReactNode;
  className?: string;
}>;

export function ArchiveSection({
  definition,
  revealEnabled,
  children,
  className,
}: ArchiveSectionProps) {
  const headingId = definition.id + "-title";
  const rootClassName = ["archive-section", className].filter(Boolean).join(" ");

  return (
    <section
      aria-labelledby={headingId}
      className={rootClassName}
      data-surface={definition.surface}
      id={definition.id}
    >
      <div className="archive-section__inner">
        <header className="archive-section__header">
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
            <CopyReveal enabled={revealEnabled} text={definition.status} />
          </p>
        </header>
        {children}
      </div>
    </section>
  );
}
