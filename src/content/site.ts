export type NavigationItem = {
  label: string;
  href: `/${string}` | "/";
};

export type IndexItem = {
  id: string;
  title: string;
  meta: string;
  href: string;
};

export const siteContent = {
  name: "Scra Atlas",
  signature: "A map of systems I have built.",
  description: {
    text: "一个持续更新的个人技术档案。",
    lang: "zh-Hans",
  },
  archiveAction: {
    label: "Enter archive",
    href: "/projects",
  },
} as const;

export const siteNavigation = [
  { label: "Projects", href: "/projects" },
  { label: "Logs", href: "/blog" },
  { label: "Timeline", href: "/timeline" },
  { label: "Lab", href: "/lab" },
] as const satisfies readonly NavigationItem[];

export const siteStatus = {
  status: "Active",
  focus: "AI / Systems",
  updated: "2026",
} as const;

export const currentIndex = [
  {
    id: "01",
    title: "Financial Intelligence",
    meta: "Models, data, signals",
    href: "/projects",
  },
  {
    id: "02",
    title: "Urban Sidequest",
    meta: "Experiments, products, places",
    href: "/projects",
  },
  {
    id: "03",
    title: "Infrastructure Lab",
    meta: "Systems, platforms, tooling",
    href: "/lab",
  },
] as const satisfies readonly IndexItem[];
