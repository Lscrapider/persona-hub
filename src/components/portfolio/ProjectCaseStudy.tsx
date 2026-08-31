import {
  ArrowLeftIcon,
  ArrowUpRightIcon,
} from "@phosphor-icons/react/ssr";
import Image from "next/image";
import Link from "next/link";

import type { FeaturedProject } from "@/content/projects";

type ProjectCaseStudyProps = {
  project: FeaturedProject;
};

export function ProjectCaseStudy({ project }: ProjectCaseStudyProps) {
  return (
    <main className="project-page">
      <header className="project-header">
        <Link className="project-back" href="/">
          <ArrowLeftIcon aria-hidden="true" size={17} weight="bold" />
          <span>SCRA / INDEX</span>
        </Link>
        <p>CASE {project.sequence}</p>
        <a href={project.url} rel="noreferrer" target="_blank">
          SOURCE
        </a>
      </header>

      <section className="project-hero">
        <div className="project-hero-media">
          <Image
            alt=""
            fill
            priority
            sizes="(max-width: 760px) 100vw, 68vw"
            src={project.cardImage}
          />
          <span aria-hidden="true" className="project-hero-signal" />
        </div>

        <div className="project-hero-copy">
          <p className="project-eyebrow">
            PROJECT {project.sequence} · {project.year}
          </p>
          <h1>{project.englishTitle}</h1>
          <p className="project-title-cn">{project.title}</p>
          <p className="project-summary">{project.summary}</p>
          <dl className="project-meta">
            <div>
              <dt>STATUS</dt>
              <dd>{project.status}</dd>
            </div>
            <div>
              <dt>FOCUS</dt>
              <dd>AI PRODUCT SYSTEM</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="project-statement">
        <p>THE QUESTION</p>
        <h2>
          如何把模糊的“出去逛逛”，转化为一条真实、个性化并且可以立刻执行的路线？
        </h2>
      </section>

      <section className="project-system">
        <div className="project-system-intro">
          <p className="project-section-index">01 / SYSTEM</p>
          <h2>FROM INTENT TO ROUTE.</h2>
          <p>{project.description}</p>
        </div>

        <ol className="project-capabilities">
          {project.capabilities.map((capability, index) => (
            <li key={capability}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <p>{capability}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="project-stack">
        <p className="project-section-index">02 / BUILD</p>
        <div>
          {project.stack.map((item) => (
            <p key={item}>{item}</p>
          ))}
        </div>
      </section>

      <footer className="project-footer">
        <p>ONE PROJECT. FULL IMPACT.</p>
        <a href={project.url} rel="noreferrer" target="_blank">
          <span>VIEW SOURCE</span>
          <ArrowUpRightIcon aria-hidden="true" size={19} weight="bold" />
        </a>
      </footer>
    </main>
  );
}
