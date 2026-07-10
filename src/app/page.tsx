import { EFFECT_MODE_STORAGE_KEY } from "@/core/effect-mode";
import { ENTRY_SESSION_KEY } from "@/core/entry";
import { HomeExperience } from "@/features/home/HomeExperience";

const entryBootstrapScript = `(() => {
  const root = document.documentElement;
  let entryComplete = false;
  let effectMode = null;

  try {
    entryComplete = window.sessionStorage.getItem(${JSON.stringify(ENTRY_SESSION_KEY)}) === "true";
  } catch {
    // Treat an unreadable session as a first visit, then rely on the fallback.
  }

  try {
    effectMode = window.localStorage.getItem(${JSON.stringify(EFFECT_MODE_STORAGE_KEY)});
  } catch {
    // The runtime will resolve a safe in-memory effect mode after hydration.
  }

  const shouldShow = !entryComplete && effectMode !== "static";
  root.dataset.entryRitual = shouldShow ? "show" : "skip";

  if (!shouldShow) {
    try {
      window.sessionStorage.setItem(${JSON.stringify(ENTRY_SESSION_KEY)}, "true");
    } catch {
      // A failed persistence write must never turn the skipped gate back on.
    }

    return;
  }

  let fallbackTimer;
  const unlockEntry = () => {
    root.dataset.entryRitual = "skip";
    document.removeEventListener("click", handleEntryAction);
    window.clearTimeout(fallbackTimer);

    try {
      window.sessionStorage.setItem(${JSON.stringify(ENTRY_SESSION_KEY)}, "true");
    } catch {
      // The readable Home remains available when storage is unavailable.
    }
  };
  const handleEntryAction = (event) => {
    const target = event.target;

    if (target && typeof target.closest === "function" && target.closest("[data-entry-action]")) {
      unlockEntry();
    }
  };

  document.addEventListener("click", handleEntryAction);
  fallbackTimer = window.setTimeout(unlockEntry, 1800);
})();`;

export default function HomePage() {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: entryBootstrapScript }} />
      <HomeExperience />
    </>
  );
}
