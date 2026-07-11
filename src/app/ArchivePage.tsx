import { EFFECT_MODE_STORAGE_KEY } from "@/core/effect-mode";
import { ENTRY_SESSION_KEY } from "@/core/entry";
import { HomeExperience } from "@/features/home/HomeExperience";
import { loadLocalizedArchiveContent } from "@/lib/content/archive";
import type { ArchiveLocale } from "@/lib/content/types";

function createEntryBootstrapScript(locale: ArchiveLocale, htmlLang: string) {
  return [
    "(() => {",
    "  const root = document.documentElement;",
    `  root.lang = ${JSON.stringify(htmlLang)};`,
    `  root.dataset.locale = ${JSON.stringify(locale)};`,
    "  let entryComplete = false;",
    "  let storedMode = null;",
    "  let systemReduced = false;",
    "",
    "  try {",
    "    entryComplete = window.sessionStorage.getItem(" +
      JSON.stringify(ENTRY_SESSION_KEY) +
      ") === 'true';",
    "  } catch {",
    "    // Storage failure falls back to the readable first-visit ritual.",
    "  }",
    "",
    "  try {",
    "    storedMode = window.localStorage.getItem(" +
      JSON.stringify(EFFECT_MODE_STORAGE_KEY) +
      ");",
    "  } catch {",
    "    // The runtime will keep an in-memory preference after hydration.",
    "  }",
    "",
    "  try {",
    "    systemReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;",
    "  } catch {",
    "    // A failed query keeps the normal FULL default.",
    "  }",
    "",
    "  const mode = storedMode === 'full' || storedMode === 'static'",
    "    ? storedMode",
    "    : systemReduced ? 'static' : 'full';",
    "  root.dataset.effectMode = mode;",
    "",
    "  const shouldShow = !entryComplete && mode === 'full';",
    "  root.dataset.entryRitual = shouldShow ? 'show' : 'skip';",
    "",
    "  if (!shouldShow) {",
    "    try {",
    "      window.sessionStorage.setItem(" + JSON.stringify(ENTRY_SESSION_KEY) + ", 'true');",
    "    } catch {",
    "      // A skipped gate must never become a permanent blocker.",
    "    }",
    "    return;",
    "  }",
    "",
    "  let fallbackTimer;",
    "  const unlockEntry = () => {",
    "    root.dataset.entryRitual = 'skip';",
    "    document.removeEventListener('click', handleEntryAction);",
    "    window.clearTimeout(fallbackTimer);",
    "",
    "    try {",
    "      window.sessionStorage.setItem(" + JSON.stringify(ENTRY_SESSION_KEY) + ", 'true');",
    "    } catch {",
    "      // The archive remains readable when session storage is unavailable.",
    "    }",
    "  };",
    "  const handleEntryAction = (event) => {",
    "    const target = event.target;",
    "",
    "    if (target && typeof target.closest === 'function' && target.closest('[data-entry-action]')) {",
    "      unlockEntry();",
    "    }",
    "  };",
    "",
    "  document.addEventListener('click', handleEntryAction);",
    "  fallbackTimer = window.setTimeout(unlockEntry, 1800);",
    "})();",
  ].join("\n");
}

type ArchivePageProps = Readonly<{
  locale: ArchiveLocale;
}>;

export async function ArchivePage({ locale }: ArchivePageProps) {
  const content = await loadLocalizedArchiveContent(locale);
  const entryBootstrapScript = createEntryBootstrapScript(locale, content.site.htmlLang);

  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: entryBootstrapScript }} />
      <HomeExperience content={content} />
    </>
  );
}
