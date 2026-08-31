export const featuredProject = {
  slug: "urban-sidequest",
  sequence: "01",
  title: "城市副本",
  englishTitle: "Urban Sidequest",
  status: "IN PROGRESS",
  year: "2026",
  summary: "AI 驱动的城市探索路线决策系统。",
  description:
    "以真实城市地图与 POI 数据为基础，结合候选召回、偏好建模和路线排序，为用户生成可执行、可解释、可调整的城市探索路线。",
  url: "https://github.com/Lscrapider/urban-sidequest",
  cardImage: "/assets/projects/featured-project-card.png",
  stack: [
    "Kotlin · Jetpack Compose",
    "Java · Spring Boot",
    "Python · ML Pipeline",
    "POI Retrieval & Ranking",
  ],
  capabilities: [
    "多源 POI 语义召回与质量筛选",
    "路线偏好学习与多目标排序",
    "可解释路线生成与动态备选方案",
    "路线执行反馈驱动的闭环优化",
  ],
} as const;

export type FeaturedProject = typeof featuredProject;
