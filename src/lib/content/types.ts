export type ArchiveLocale = "zh" | "en";

export type ArchiveSectionId = "timeline" | "projects" | "logs";

export type ArchiveSurface = "bone" | "void";

export type ArchiveSectionDefinition = Readonly<{
  id: ArchiveSectionId;
  label: string;
  href: "/#projects" | "/#logs" | "/#timeline";
  surface: ArchiveSurface;
  eyebrow: string;
  title: string;
  summary: string;
  status: string;
}>;

export type LocaleUiCopy = Readonly<{
  hero: Readonly<{
    statusLabel: string;
    focusLabel: string;
    updatedLabel: string;
  }>;
  currentIndex: Readonly<{ heading: string }>;
  navigation: Readonly<{ primaryLabel: string }>;
  locale: Readonly<{
    groupLabel: string;
    label: string;
    zh: string;
    en: string;
  }>;
  entry: Readonly<{
    dialogLabel: string;
    status: string;
    title: string;
    enter: string;
    skip: string;
  }>;
  timeline: Readonly<{
    recordsLabel: string;
    focusLabel: string;
    markerLabel: string;
    verifiedMilestones: string;
  }>;
  projects: Readonly<{
    empty: string;
    indexLabel: string;
    indexHeading: string;
    activeProject: string;
    openPublicProject: string;
    technicalStack: string;
    capabilities: string;
    systemMap: string;
    indexed: string;
  }>;
  logs: Readonly<{
    empty: string;
    indexLabel: string;
    indexHeading: string;
    logPrefix: string;
    authoredRecords: string;
  }>;
  effects: Readonly<{
    groupLabel: string;
    label: string;
    full: string;
    static: string;
  }>;
}>;

export type SiteLocaleContent = Readonly<{
  locale: ArchiveLocale;
  htmlLang: string;
  name: string;
  signature: string;
  description: Readonly<{
    text: string;
    lang: string;
  }>;
  archiveAction: Readonly<{
    label: string;
    href: "/#timeline";
  }>;
  status: Readonly<{
    status: string;
    focus: string;
    updated: string;
  }>;
  sections: Readonly<Record<ArchiveSectionId, ArchiveSectionDefinition>>;
  ui: LocaleUiCopy;
}>;

export type ArchiveTreeNode = Readonly<{
  name: string;
  detail?: string;
  children?: readonly ArchiveTreeNode[];
}>;

export type TimelineRecord = Readonly<{
  id: string;
  period: string;
  sortDate: string;
  kind: string;
  title: string;
  organisation?: string;
  location?: string;
  description: string;
  highlights?: readonly string[];
}>;

export type ProjectRecord = Readonly<{
  id: string;
  slug: string;
  title: string;
  status: string;
  year: string;
  summary: string;
  content: string;
  url?: string;
  stack: readonly string[];
  capabilities: readonly string[];
  tree: readonly ArchiveTreeNode[];
}>;

export type MarkdownBlock =
  | Readonly<{ type: "heading"; level: 2 | 3 | 4; text: string }>
  | Readonly<{ type: "paragraph"; text: string }>
  | Readonly<{ type: "list"; ordered: boolean; items: readonly string[] }>
  | Readonly<{ type: "quote"; text: string }>
  | Readonly<{ type: "code"; language: string; code: string }>
  | Readonly<{ type: "rule" }>;

export type LogRecord = Readonly<{
  id: string;
  slug: string;
  title: string;
  date: string;
  summary: string;
  tags: readonly string[];
  status: string;
  blocks: readonly MarkdownBlock[];
}>;

export type ArchiveContent = Readonly<{
  timeline: readonly TimelineRecord[];
  projects: readonly ProjectRecord[];
  logs: readonly LogRecord[];
}>;

export type LocalizedArchiveContent = Readonly<{
  site: SiteLocaleContent;
  archive: ArchiveContent;
}>;

export type ArchiveContentBundle = Readonly<
  Record<ArchiveLocale, LocalizedArchiveContent>
>;
