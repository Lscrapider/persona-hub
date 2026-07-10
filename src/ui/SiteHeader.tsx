"use client";

import { usePathname } from "next/navigation";

import { getArchiveSection } from "@/content/archive";
import { siteNavigation } from "@/content/site";
import { CopyReveal } from "@/effects/primitives/CopyReveal";
import { useActiveArchiveSection } from "@/features/archive/useActiveArchiveSection";

type SiteHeaderProps = Readonly<{
  revealEnabled: boolean;
}>;

export function SiteHeader({ revealEnabled }: SiteHeaderProps) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const activeSectionId = useActiveArchiveSection(isHome);
  const activeSection = activeSectionId
    ? getArchiveSection(activeSectionId)
    : null;

  return (
    <header
      className="site-header"
      data-surface={activeSection?.surface ?? "bone"}
    >
      <nav aria-label="Primary navigation">
        <ul className="site-header__navigation">
          {siteNavigation.map((item) => {
            const isActive = item.id === activeSectionId;

            return (
              <li key={item.id}>
                <a
                  aria-current={isActive ? "location" : undefined}
                  className="site-header__link"
                  data-active={isActive || undefined}
                  href={item.href}
                >
                  <CopyReveal enabled={revealEnabled} text={item.label} />
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
