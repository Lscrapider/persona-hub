"use client";

import { usePathname } from "next/navigation";

import { getArchiveSections } from "@/content/archive";
import { getLocaleArchiveHref } from "@/core/locale";
import { CopyReveal } from "@/effects/primitives/CopyReveal";
import { useActiveArchiveSection } from "@/features/archive/useActiveArchiveSection";
import { useLocaleContent } from "@/i18n/LocaleProvider";

type SiteHeaderProps = Readonly<{
  revealEnabled: boolean;
}>;

export function SiteHeader({ revealEnabled }: SiteHeaderProps) {
  const { content } = useLocaleContent();
  const pathname = usePathname();
  const isHome = pathname === "/";
  const activeSectionId = useActiveArchiveSection(isHome);
  const activeSection = activeSectionId
    ? content.site.sections[activeSectionId]
    : null;
  const navigation = getArchiveSections(content.site);

  return (
    <header
      className="site-header"
      data-surface={activeSection?.surface ?? "bone"}
    >
      <nav aria-label={content.site.ui.navigation.primaryLabel}>
        <ul className="site-header__navigation">
          {navigation.map((item) => {
            const isActive = item.id === activeSectionId;

            return (
              <li key={item.id}>
                <a
                  aria-current={isActive ? "location" : undefined}
                  className="site-header__link"
                  data-active={isActive || undefined}
                  href={getLocaleArchiveHref(content.site.locale, item.href)}
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
