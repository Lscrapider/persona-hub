import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProjectCaseStudy } from "@/components/portfolio/ProjectCaseStudy";
import { featuredProject } from "@/content/projects";

type WorkPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export const metadata: Metadata = {
  title: featuredProject.title,
  description: featuredProject.description,
};

export default async function WorkPage({ params }: WorkPageProps) {
  const { slug } = await params;

  if (slug !== featuredProject.slug) {
    notFound();
  }

  return <ProjectCaseStudy project={featuredProject} />;
}
