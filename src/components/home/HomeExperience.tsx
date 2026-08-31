"use client";

import { CaretDoubleRightIcon } from "@phosphor-icons/react/CaretDoubleRight";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { useCardTransition } from "@/components/transition/TransitionProvider";
import { featuredProject } from "@/content/projects";

const ExperienceCanvas = dynamic(
  () =>
    import("@/components/experience/ExperienceCanvas").then(
      (module) => module.ExperienceCanvas,
    ),
  {
    ssr: false,
  },
);

type OpenPanel = "about" | "contact" | null;

export function HomeExperience() {
  const [openPanel, setOpenPanel] = useState<OpenPanel>(null);
  const {
    beginProjectTransition,
    motionPreferenceResolved,
    phase,
    reducedMotion,
    sceneReady,
    setPointer,
  } = useCardTransition();
  const projectHref = `/work/${featuredProject.slug}`;
  const transitionActive = phase !== "idle";

  useEffect(() => {
    if (!openPanel) {
      return;
    }

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenPanel(null);
      }
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [openPanel]);

  return (
    <main
      className="home"
      data-scene-ready={sceneReady}
      onPointerLeave={() => setPointer(0, 0)}
      onPointerMove={(event) => {
        const x = (event.clientX / window.innerWidth) * 2 - 1;
        const y = (event.clientY / window.innerHeight) * 2 - 1;
        setPointer(x, y);
      }}
    >
      <div aria-hidden="true" className="home-stage-fallback">
        <Image
          alt=""
          fill
          priority
          sizes="100vw"
          src="/assets/hero/phantom-courier-stage.png"
        />
      </div>

      {motionPreferenceResolved && !reducedMotion ? (
        <ExperienceCanvas />
      ) : null}

      <header className="home-header">
        <Link aria-label="SCRA home" className="home-mark" href="/">
          SCRA
        </Link>

        <nav aria-label="Primary navigation" className="home-nav">
          <Link
            href={projectHref}
            onClick={(event) => beginProjectTransition(event, projectHref)}
          >
            WORK
          </Link>
          <button onClick={() => setOpenPanel("about")} type="button">
            ABOUT
          </button>
          <button onClick={() => setOpenPanel("contact")} type="button">
            CONTACT
          </button>
          <span aria-hidden="true" className="home-nav-rule" />
        </nav>
      </header>

      <section className="home-hero" aria-labelledby="home-title">
        <h1 id="home-title">
          <span>ONE PROJECT.</span>
          <span>FULL IMPACT.</span>
        </h1>
        <Link
          aria-label={`Throw the card to enter ${featuredProject.title}`}
          className="home-enter"
          data-transition-active={transitionActive}
          href={projectHref}
          onClick={(event) => beginProjectTransition(event, projectHref)}
        >
          <CaretDoubleRightIcon
            aria-hidden="true"
            className="home-enter-chevrons"
            size={19}
            weight="bold"
          />
          <span>THROW TO ENTER</span>
          <span aria-hidden="true" className="home-enter-line" />
        </Link>
      </section>

      <p className="home-instruction">
        <span>MOVE</span> TO SHIFT THE FRAME
      </p>

      <aside
        aria-hidden={!openPanel}
        aria-label={openPanel === "about" ? "About SCRA" : "Contact SCRA"}
        className="home-panel"
        data-open={Boolean(openPanel)}
      >
        <button
          aria-label="Close panel"
          className="home-panel-close"
          onClick={() => setOpenPanel(null)}
          type="button"
        >
          CLOSE
        </button>

        {openPanel === "about" ? (
          <div className="home-panel-content">
            <p className="home-panel-index">ABOUT / 01</p>
            <h2>BUILD THE IDEA UNTIL IT FEELS INEVITABLE.</h2>
            <p>
              SCRA 是一个把产品、系统与叙事放在同一张工作台上的个人作品场。
              当前只展示一个项目，因此每一次动效都服务于同一次进入。
            </p>
          </div>
        ) : null}

        {openPanel === "contact" ? (
          <div className="home-panel-content">
            <p className="home-panel-index">CONTACT / 02</p>
            <h2>START WITH THE WORK.</h2>
            <p>
              当前只开放项目仓库这一条联系路径。你可以从实现、问题或合作想法直接开始。
            </p>
            <a
              className="home-panel-link"
              href={featuredProject.url}
              rel="noreferrer"
              target="_blank"
            >
              OPEN GITHUB
            </a>
          </div>
        ) : null}
      </aside>

      {openPanel ? (
        <button
          aria-label="Close panel"
          className="home-panel-backdrop"
          onClick={() => setOpenPanel(null)}
          type="button"
        />
      ) : null}
    </main>
  );
}
