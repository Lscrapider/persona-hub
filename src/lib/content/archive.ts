import { readFile } from "node:fs/promises";
import path from "node:path";

import { archiveSectionHrefs } from "@/content/archive";
import enLogsManifest from "@/content/en/logs.json";
import enProjectsManifest from "@/content/en/projects.json";
import enSiteManifest from "@/content/en/site.json";
import enTimelineManifest from "@/content/en/timeline.json";
import zhLogsManifest from "@/content/zh/logs.json";
import zhProjectsManifest from "@/content/zh/projects.json";
import zhSiteManifest from "@/content/zh/site.json";
import zhTimelineManifest from "@/content/zh/timeline.json";
import { parseMarkdownDocument } from "@/lib/content/markdown";
import type {
  ArchiveContent,
  ArchiveLocale,
  ArchiveSectionDefinition,
  ArchiveSectionId,
  ArchiveSurface,
  ArchiveTreeNode,
  LocaleUiCopy,
  LogRecord,
  LocalizedArchiveContent,
  ProjectRecord,
  SiteLocaleContent,
  TimelineRecord,
} from "@/lib/content/types";

type JsonObject = Record<string, unknown>;

type LogManifestRecord = Readonly<{
  id: string;
  slug: string;
  title: string;
  date: string;
  summary: string;
  tags: readonly string[];
  status: string;
  filename: string;
}>;

type LocaleManifest = Readonly<{
  site: unknown;
  timeline: unknown;
  projects: unknown;
  logs: unknown;
}>;

type ValidatedLocaleManifest = Readonly<{
  site: SiteLocaleContent;
  timeline: readonly TimelineRecord[];
  projects: readonly ProjectRecord[];
  logs: readonly LogManifestRecord[];
}>;

const localeManifests: Readonly<Record<ArchiveLocale, LocaleManifest>> = {
  zh: {
    site: zhSiteManifest,
    timeline: zhTimelineManifest,
    projects: zhProjectsManifest,
    logs: zhLogsManifest,
  },
  en: {
    site: enSiteManifest,
    timeline: enTimelineManifest,
    projects: enProjectsManifest,
    logs: enLogsManifest,
  },
};

const logDirectories: Readonly<Record<ArchiveLocale, string>> = {
  zh: path.join(process.cwd(), "src", "content", "zh", "logs"),
  en: path.join(process.cwd(), "src", "content", "en", "logs"),
};

const CJK_CHARACTER = /[\u3400-\u9fff]/u;

function assertObject(value: unknown, field: string): JsonObject {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`${field} must be an object`);
  }

  return value as JsonObject;
}

function assertString(value: unknown, field: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${field} must be a non-empty string`);
  }

  return value;
}

function assertOptionalString(value: unknown, field: string): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  return assertString(value, field);
}

function assertArray(value: unknown, field: string): readonly unknown[] {
  if (!Array.isArray(value)) {
    throw new Error(`${field} must be an array`);
  }

  return value;
}

function assertStringArray(value: unknown, field: string): readonly string[] {
  return assertArray(value, field).map((item, index) =>
    assertString(item, `${field}[${index}]`),
  );
}

function assertStringFields<const T extends readonly string[]>(
  value: unknown,
  field: string,
  keys: T,
): Record<T[number], string> {
  const record = assertObject(value, field);

  const copy = {} as Record<T[number], string>;

  keys.forEach((key) => {
    const outputKey = key as T[number];
    copy[outputKey] = assertString(record[key], `${field}.${key}`);
  });

  return copy;
}

function assertNoCjk(value: string, field: string) {
  if (CJK_CHARACTER.test(value)) {
    throw new Error(`${field} must not contain Chinese characters`);
  }
}

function assertEnglishContent(value: unknown, field: string) {
  if (typeof value === "string") {
    assertNoCjk(value, field);
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => assertEnglishContent(item, `${field}[${index}]`));
    return;
  }

  if (typeof value === "object" && value !== null) {
    Object.entries(value).forEach(([key, item]) => {
      assertEnglishContent(item, `${field}.${key}`);
    });
  }
}

function assertLogFilename(value: unknown, field: string): string {
  const filename = assertString(value, field);

  if (!/^[A-Za-z0-9][A-Za-z0-9-]*\.md$/.test(filename)) {
    throw new Error(`${field} must be a simple .md basename`);
  }

  return filename;
}

function assertTimelineSortDate(value: unknown, field: string): string {
  const sortDate = assertString(value, field);

  if (!/^\d{4}(?:\.\d{2}(?:\.\d{2})?)?$/.test(sortDate)) {
    throw new Error(`${field} must use YYYY, YYYY.MM, or YYYY.MM.DD format`);
  }

  const dateParts = sortDate.split(".");

  if (dateParts.length === 1) {
    return sortDate;
  }

  const [yearText = "", monthText = "", dayText] = dateParts;
  const year = Number(yearText);
  const month = Number(monthText);

  if (month < 1 || month > 12) {
    throw new Error(`${field} must use a valid calendar month`);
  }

  if (dayText === undefined) {
    return sortDate;
  }

  const day = Number(dayText);
  const calendarDate = new Date(Date.UTC(year, month - 1, day));

  if (
    calendarDate.getUTCFullYear() !== year ||
    calendarDate.getUTCMonth() !== month - 1 ||
    calendarDate.getUTCDate() !== day
  ) {
    throw new Error(`${field} must be a valid calendar date`);
  }

  return sortDate;
}

function assertUnique(
  records: readonly { id: string; slug?: string }[],
  collection: string,
  field: "id" | "slug",
) {
  const seen = new Set<string>();

  records.forEach((record, index) => {
    const value = field === "id" ? record.id : record.slug;

    if (!value) {
      throw new Error(`${collection}[${index}].${field} is required`);
    }

    if (seen.has(value)) {
      throw new Error(`${collection}[${index}].${field} duplicates ${value}`);
    }

    seen.add(value);
  });
}

function validateTreeNode(value: unknown, field: string): ArchiveTreeNode {
  const record = assertObject(value, field);
  const detail = assertOptionalString(record.detail, `${field}.detail`);
  const children =
    record.children === undefined
      ? undefined
      : assertArray(record.children, `${field}.children`).map((child, index) =>
          validateTreeNode(child, `${field}.children[${index}]`),
        );

  return {
    name: assertString(record.name, `${field}.name`),
    ...(detail === undefined ? {} : { detail }),
    ...(children === undefined ? {} : { children }),
  };
}

function validateTimelineRecord(
  value: unknown,
  index: number,
  collection: string,
): TimelineRecord {
  const field = `${collection}[${index}]`;
  const record = assertObject(value, field);
  const organisation = assertOptionalString(record.organisation, `${field}.organisation`);
  const location = assertOptionalString(record.location, `${field}.location`);
  const highlights =
    record.highlights === undefined
      ? undefined
      : assertStringArray(record.highlights, `${field}.highlights`);

  return {
    id: assertString(record.id, `${field}.id`),
    period: assertString(record.period, `${field}.period`),
    sortDate: assertTimelineSortDate(record.sortDate, `${field}.sortDate`),
    kind: assertString(record.kind, `${field}.kind`),
    title: assertString(record.title, `${field}.title`),
    ...(organisation === undefined ? {} : { organisation }),
    ...(location === undefined ? {} : { location }),
    description: assertString(record.description, `${field}.description`),
    ...(highlights === undefined ? {} : { highlights }),
  };
}

function validateProjectRecord(
  value: unknown,
  index: number,
  collection: string,
): ProjectRecord {
  const field = `${collection}[${index}]`;
  const record = assertObject(value, field);
  const url = assertOptionalString(record.url, `${field}.url`);

  return {
    id: assertString(record.id, `${field}.id`),
    slug: assertString(record.slug, `${field}.slug`),
    title: assertString(record.title, `${field}.title`),
    status: assertString(record.status, `${field}.status`),
    year: assertString(record.year, `${field}.year`),
    summary: assertString(record.summary, `${field}.summary`),
    content: assertString(record.content, `${field}.content`),
    ...(url === undefined ? {} : { url }),
    stack: assertStringArray(record.stack, `${field}.stack`),
    capabilities: assertStringArray(record.capabilities, `${field}.capabilities`),
    tree: assertArray(record.tree, `${field}.tree`).map((node, treeIndex) =>
      validateTreeNode(node, `${field}.tree[${treeIndex}]`),
    ),
  };
}

function validateLogManifestRecord(
  value: unknown,
  index: number,
  collection: string,
): LogManifestRecord {
  const field = `${collection}[${index}]`;
  const record = assertObject(value, field);

  return {
    id: assertString(record.id, `${field}.id`),
    slug: assertString(record.slug, `${field}.slug`),
    title: assertString(record.title, `${field}.title`),
    date: assertString(record.date, `${field}.date`),
    summary: assertString(record.summary, `${field}.summary`),
    tags: assertStringArray(record.tags, `${field}.tags`),
    status: assertString(record.status, `${field}.status`),
    filename: assertLogFilename(record.filename, `${field}.filename`),
  };
}

function validateManifest<T>(
  value: unknown,
  collection: string,
  validateRecord: (record: unknown, index: number, collection: string) => T,
): readonly T[] {
  return assertArray(value, collection).map((record, index) =>
    validateRecord(record, index, collection),
  );
}

function validateArchiveSection(
  value: unknown,
  id: ArchiveSectionId,
  field: string,
): ArchiveSectionDefinition {
  const record = assertObject(value, field);
  const sectionId = assertString(record.id, `${field}.id`);
  const href = assertString(record.href, `${field}.href`);
  const surface = assertString(record.surface, `${field}.surface`);

  if (sectionId !== id) {
    throw new Error(`${field}.id must be ${id}`);
  }

  if (href !== archiveSectionHrefs[id]) {
    throw new Error(`${field}.href must be ${archiveSectionHrefs[id]}`);
  }

  if (surface !== "bone" && surface !== "void") {
    throw new Error(`${field}.surface must be bone or void`);
  }

  return {
    id,
    label: assertString(record.label, `${field}.label`),
    href: href as ArchiveSectionDefinition["href"],
    surface: surface as ArchiveSurface,
    eyebrow: assertString(record.eyebrow, `${field}.eyebrow`),
    title: assertString(record.title, `${field}.title`),
    summary: assertString(record.summary, `${field}.summary`),
    status: assertString(record.status, `${field}.status`),
  };
}

function validateUiCopy(value: unknown, field: string): LocaleUiCopy {
  const record = assertObject(value, field);

  return {
    hero: assertStringFields(record.hero, `${field}.hero`, [
      "statusLabel",
      "focusLabel",
      "updatedLabel",
    ]) as LocaleUiCopy["hero"],
    currentIndex: assertStringFields(record.currentIndex, `${field}.currentIndex`, [
      "heading",
    ]) as LocaleUiCopy["currentIndex"],
    navigation: assertStringFields(record.navigation, `${field}.navigation`, [
      "primaryLabel",
    ]) as LocaleUiCopy["navigation"],
    locale: assertStringFields(record.locale, `${field}.locale`, [
      "groupLabel",
      "label",
      "zh",
      "en",
    ]) as LocaleUiCopy["locale"],
    entry: assertStringFields(record.entry, `${field}.entry`, [
      "dialogLabel",
      "status",
      "title",
      "enter",
      "skip",
    ]) as LocaleUiCopy["entry"],
    timeline: assertStringFields(record.timeline, `${field}.timeline`, [
      "recordsLabel",
      "focusLabel",
      "markerLabel",
      "verifiedMilestones",
    ]) as LocaleUiCopy["timeline"],
    projects: assertStringFields(record.projects, `${field}.projects`, [
      "empty",
      "indexLabel",
      "indexHeading",
      "activeProject",
      "openPublicProject",
      "technicalStack",
      "capabilities",
      "systemMap",
      "indexed",
    ]) as LocaleUiCopy["projects"],
    logs: assertStringFields(record.logs, `${field}.logs`, [
      "empty",
      "indexLabel",
      "indexHeading",
      "logPrefix",
      "authoredRecords",
    ]) as LocaleUiCopy["logs"],
    effects: assertStringFields(record.effects, `${field}.effects`, [
      "groupLabel",
      "label",
      "full",
      "static",
    ]) as LocaleUiCopy["effects"],
  };
}

function validateSiteContent(value: unknown, locale: ArchiveLocale): SiteLocaleContent {
  const field = `${locale}.site`;
  const record = assertObject(value, field);
  const declaredLocale = assertString(record.locale, `${field}.locale`);
  const description = assertObject(record.description, `${field}.description`);
  const archiveAction = assertObject(record.archiveAction, `${field}.archiveAction`);
  const status = assertStringFields(record.status, `${field}.status`, [
    "status",
    "focus",
    "updated",
  ] as const);
  const sectionRecord = assertObject(record.sections, `${field}.sections`);

  if (declaredLocale !== locale) {
    throw new Error(`${field}.locale must be ${locale}`);
  }

  const archiveActionHref = assertString(archiveAction.href, `${field}.archiveAction.href`);

  if (archiveActionHref !== "/#timeline") {
    throw new Error(`${field}.archiveAction.href must be /#timeline`);
  }

  return {
    locale,
    htmlLang: assertString(record.htmlLang, `${field}.htmlLang`),
    name: assertString(record.name, `${field}.name`),
    signature: assertString(record.signature, `${field}.signature`),
    description: {
      text: assertString(description.text, `${field}.description.text`),
      lang: assertString(description.lang, `${field}.description.lang`),
    },
    archiveAction: {
      label: assertString(archiveAction.label, `${field}.archiveAction.label`),
      href: "/#timeline",
    },
    status,
    sections: {
      timeline: validateArchiveSection(
        sectionRecord.timeline,
        "timeline",
        `${field}.sections.timeline`,
      ),
      projects: validateArchiveSection(
        sectionRecord.projects,
        "projects",
        `${field}.sections.projects`,
      ),
      logs: validateArchiveSection(sectionRecord.logs, "logs", `${field}.sections.logs`),
    },
    ui: validateUiCopy(record.ui, `${field}.ui`),
  };
}

function validateLocaleManifest(locale: ArchiveLocale): ValidatedLocaleManifest {
  const manifest = localeManifests[locale];

  if (locale === "en") {
    assertEnglishContent(manifest.site, "en.site");
    assertEnglishContent(manifest.timeline, "en.timeline");
    assertEnglishContent(manifest.projects, "en.projects");
    assertEnglishContent(manifest.logs, "en.logs");
  }

  const timeline = validateManifest(manifest.timeline, `${locale}.timeline`, validateTimelineRecord);
  const projects = validateManifest(manifest.projects, `${locale}.projects`, validateProjectRecord);
  const logs = validateManifest(manifest.logs, `${locale}.logs`, validateLogManifestRecord);

  assertUnique(timeline, `${locale}.timeline`, "id");
  assertUnique(projects, `${locale}.projects`, "id");
  assertUnique(projects, `${locale}.projects`, "slug");
  assertUnique(logs, `${locale}.logs`, "id");
  assertUnique(logs, `${locale}.logs`, "slug");

  timeline.forEach((record, index) => {
    const previous = timeline[index - 1];

    if (previous && previous.sortDate >= record.sortDate) {
      throw new Error(
        `${locale}.timeline[${index}].sortDate must be strictly after ${locale}.timeline[${index - 1}].sortDate`,
      );
    }
  });

  const filenames = new Set<string>();
  logs.forEach((record, index) => {
    if (filenames.has(record.filename)) {
      throw new Error(`${locale}.logs[${index}].filename duplicates ${record.filename}`);
    }

    filenames.add(record.filename);
  });

  return {
    site: validateSiteContent(manifest.site, locale),
    timeline,
    projects,
    logs,
  };
}

const validatedLocales: Readonly<Record<ArchiveLocale, ValidatedLocaleManifest>> = {
  zh: validateLocaleManifest("zh"),
  en: validateLocaleManifest("en"),
};

function resolveLogFilename(locale: ArchiveLocale, filename: string) {
  if (!/^[A-Za-z0-9][A-Za-z0-9-]*\.md$/.test(filename)) {
    throw new Error("Invalid log filename: " + filename);
  }

  const directory = logDirectories[locale];
  const resolved = path.resolve(directory, filename);

  if (path.dirname(resolved) !== directory) {
    throw new Error("Log filename escapes content directory: " + filename);
  }

  return resolved;
}

async function loadLogBlocks(
  locale: ArchiveLocale,
  record: LogManifestRecord,
  index: number,
) {
  try {
    const source = await readFile(resolveLogFilename(locale, record.filename), "utf8");

    if (locale === "en") {
      assertNoCjk(source, `en.logs[${index}].filename`);
    }

    return parseMarkdownDocument(source);
  } catch (error) {
    const reason = error instanceof Error ? `: ${error.message}` : "";
    throw new Error(
      `${locale}.logs[${index}].filename could not be read: ${record.filename}${reason}`,
    );
  }
}

export async function loadArchiveContent(locale: ArchiveLocale): Promise<ArchiveContent> {
  const manifest = validatedLocales[locale];
  const logs: readonly LogRecord[] = await Promise.all(
    manifest.logs.map(async (record, index) => ({
      id: record.id,
      slug: record.slug,
      title: record.title,
      date: record.date,
      summary: record.summary,
      tags: record.tags,
      status: record.status,
      blocks: await loadLogBlocks(locale, record, index),
    })),
  );

  return {
    timeline: manifest.timeline,
    projects: manifest.projects,
    logs,
  };
}

export async function loadLocalizedArchiveContent(
  locale: ArchiveLocale,
): Promise<LocalizedArchiveContent> {
  return {
    site: validatedLocales[locale].site,
    archive: await loadArchiveContent(locale),
  };
}
