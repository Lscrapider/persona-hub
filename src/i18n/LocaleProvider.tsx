"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
} from "react";

import {
  type ArchiveLocale,
  type LocalizedArchiveContent,
} from "@/lib/content/types";

type LocaleContextValue = Readonly<{
  locale: ArchiveLocale;
  content: LocalizedArchiveContent;
}>;

type LocaleProviderProps = Readonly<{
  content: LocalizedArchiveContent;
  children: ReactNode;
}>;

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ content, children }: LocaleProviderProps) {
  const locale = content.site.locale;

  useEffect(() => {
    const root = document.documentElement;

    root.lang = content.site.htmlLang;
    root.dataset.locale = locale;
  }, [content.site.htmlLang, locale]);

  const value = useMemo(
    () => ({ content, locale }),
    [content, locale],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocaleContent() {
  const context = useContext(LocaleContext);

  if (!context) {
    throw new Error("useLocaleContent must be used within a LocaleProvider.");
  }

  return context;
}
