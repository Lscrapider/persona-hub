import {
  archiveSections,
  projectRecords,
  type ArchiveSectionDefinition,
  type ProjectRecord,
} from "@/content/archive";

export type NavigationItem = Pick<
  ArchiveSectionDefinition,
  "id" | "label" | "href" | "surface"
>;

export type IndexItem = ProjectRecord;

export const siteContent = {
  name: "Scra Atlas",
  signature: "A map of systems I have built.",
  description: {
    text: "一个持续更新的个人技术档案。",
    lang: "zh-Hans",
  },
  archiveAction: {
    label: "Enter archive",
    href: "/#projects",
  },
} as const;

export const siteNavigation = archiveSections.map(({ href, id, label, surface }) => ({
  id,
  label,
  href,
  surface,
})) satisfies readonly NavigationItem[];

export const siteStatus = {
  status: "Active",
  focus: "AI / Systems",
  updated: "2026",
} as const;

export const currentIndex = projectRecords satisfies readonly IndexItem[];
