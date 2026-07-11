"use client";

import { ARCHIVE_LOCALES, getLocalePath } from "@/core/locale";
import { useLocaleContent } from "@/i18n/LocaleProvider";

export function LocaleControl() {
  const { content, locale } = useLocaleContent();
  const copy = content.site.ui.locale;

  return (
    <div aria-label={copy.groupLabel} className="locale-control" role="group">
      <span className="locale-control__label">{copy.label}</span>
      {ARCHIVE_LOCALES.map((candidate) => {
        const isActive = locale === candidate;

        return (
          <a
            aria-current={isActive ? "page" : undefined}
            className="locale-control__option"
            data-active={isActive || undefined}
            href={getLocalePath(candidate)}
            key={candidate}
          >
            {copy[candidate]}
          </a>
        );
      })}
    </div>
  );
}
