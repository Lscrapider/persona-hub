import type { ArchiveLocale } from "@/lib/content/types";

export const ARCHIVE_LOCALES = ["zh", "en"] as const satisfies readonly ArchiveLocale[];

export function getLocalePath(locale: ArchiveLocale) {
  return locale === "en" ? "/en" : "/";
}

export function getLocaleArchiveHref(locale: ArchiveLocale, href: string) {
  return locale === "en" ? `/en${href}` : href;
}
