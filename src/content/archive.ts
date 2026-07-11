import type {
  ArchiveSectionDefinition,
  ArchiveSectionId,
  SiteLocaleContent,
} from "@/lib/content/types";

export const archiveSectionIds = ["timeline", "projects", "logs"] as const satisfies readonly ArchiveSectionId[];

export type ActiveArchiveSectionId = ArchiveSectionId;

export const archiveSectionHrefs = {
  timeline: "/#timeline",
  projects: "/#projects",
  logs: "/#logs",
} as const satisfies Readonly<Record<ArchiveSectionId, ArchiveSectionDefinition["href"]>>;

export function getArchiveSections(site: SiteLocaleContent) {
  return archiveSectionIds.map((id) => site.sections[id]);
}

export function isActiveArchiveSectionId(id: string): id is ArchiveSectionId {
  return archiveSectionIds.some((candidate) => candidate === id);
}

export type {
  ArchiveSectionDefinition,
  ArchiveSectionId,
} from "@/lib/content/types";
