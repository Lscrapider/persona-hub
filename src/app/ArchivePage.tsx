import { EFFECT_MODE_STORAGE_KEY } from "@/core/effect-mode";
import {
  ENTRY_BOOTSTRAP_TIMEOUT_MS,
  ENTRY_HYDRATED_EVENT,
  ENTRY_WATCHDOG_TIMEOUT_MS,
} from "@/core/entry";
import { HomeExperience } from "@/features/home/HomeExperience";
import { loadLocalizedArchiveContent } from "@/lib/content/archive";
import type { ArchiveLocale } from "@/lib/content/types";

function createEntryBootstrapScript(locale: ArchiveLocale, htmlLang: string) {
  return [
    "(() => {",
    "  const root = document.documentElement;",
    `  root.lang = ${JSON.stringify(htmlLang)};`,
    `  root.dataset.locale = ${JSON.stringify(locale)};`,
    "  let storedMode = null;",
    "  let systemReduced = false;",
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
    "  const shouldShow = mode === 'full' && !systemReduced;",
    "  root.dataset.entryRitual = shouldShow ? 'show' : 'skip';",
    "",
    "  if (!shouldShow) return;",
    "",
    "  let fallbackTimer;",
    "  const unlockEntry = () => {",
    "    root.dataset.entryRitual = 'skip';",
    "    document.removeEventListener('click', handleEntryAction);",
    "    document.removeEventListener(" + JSON.stringify(ENTRY_HYDRATED_EVENT) + ", claimEntry);",
    "    window.clearTimeout(fallbackTimer);",
    "  };",
    "  const handleEntryAction = (event) => {",
    "    const target = event.target;",
    "",
    "    if (target && typeof target.closest === 'function' && target.closest('[data-entry-action]')) {",
    "      unlockEntry();",
    "    }",
    "  };",
    "  const claimEntry = () => {",
    "    window.clearTimeout(fallbackTimer);",
    "    fallbackTimer = window.setTimeout(unlockEntry, " + ENTRY_WATCHDOG_TIMEOUT_MS + ");",
    "  };",
    "",
    "  document.addEventListener('click', handleEntryAction);",
    "  document.addEventListener(" + JSON.stringify(ENTRY_HYDRATED_EVENT) + ", claimEntry, { once: true });",
    "  fallbackTimer = window.setTimeout(unlockEntry, " + ENTRY_BOOTSTRAP_TIMEOUT_MS + ");",
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
