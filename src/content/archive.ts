export const archiveSectionIds = ["projects", "logs", "timeline", "lab"] as const;

export type ArchiveSectionId = (typeof archiveSectionIds)[number];
export type ArchiveSurface = "bone" | "void";

export type ArchiveSectionDefinition = Readonly<{
  id: ArchiveSectionId;
  label: string;
  href: "/#projects" | "/#logs" | "/#timeline" | "/#lab";
  surface: ArchiveSurface;
  eyebrow: string;
  title: string;
  summary: string;
  status: string;
}>;

export type ProjectRecord = Readonly<{
  id: string;
  title: string;
  meta: string;
  href: ArchiveSectionDefinition["href"];
}>;

export const archiveSections = [
  {
    id: "projects",
    label: "Projects",
    href: "/#projects",
    surface: "bone",
    eyebrow: "PROJECT DATABASE",
    title: "Projects",
    summary:
      "Projects organize real systems as an explorable archive tree, with each branch tied to evidence and implementation context.",
    status: "03 records indexed",
  },
  {
    id: "logs",
    label: "Logs",
    href: "/#logs",
    surface: "void",
    eyebrow: "ENGINEERING NOTES",
    title: "Logs",
    summary:
      "Logs collect long-form engineering notes about systems, experiments, and the decisions behind them.",
    status: "AUTHORED RECORDS IN PREPARATION",
  },
  {
    id: "timeline",
    label: "Timeline",
    href: "/#timeline",
    surface: "bone",
    eyebrow: "DEVELOPMENT PATH",
    title: "Timeline",
    summary:
      "Timeline maps verified stages of work and learning into a chronological path.",
    status: "SOURCE MILESTONES IN PREPARATION",
  },
  {
    id: "lab",
    label: "Lab",
    href: "/#lab",
    surface: "void",
    eyebrow: "EXPERIMENT FIELD",
    title: "Lab",
    summary:
      "Lab isolates visual experiments, interaction prototypes, and small engineering tools from the core archive.",
    status: "BOUNDED EXPERIMENTS IN PREPARATION",
  },
] as const satisfies readonly ArchiveSectionDefinition[];

export function getArchiveSection(id: ArchiveSectionId) {
  const section = archiveSections.find((candidate) => candidate.id === id);

  if (!section) {
    throw new Error("Missing archive section: " + id);
  }

  return section;
}

export const projectRecords = [
  {
    id: "01",
    title: "Financial Intelligence",
    meta: "Models, data, signals",
    href: "/#projects",
  },
  {
    id: "02",
    title: "Urban Sidequest",
    meta: "Experiments, products, places",
    href: "/#projects",
  },
  {
    id: "03",
    title: "Infrastructure Lab",
    meta: "Systems, platforms, tooling",
    href: "/#lab",
  },
] as const satisfies readonly ProjectRecord[];
