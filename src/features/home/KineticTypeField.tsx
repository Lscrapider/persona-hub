"use client";

import { animate, motion, useMotionValue } from "motion/react";
import { useEffect } from "react";

import type { EffectMode } from "@/core/effect-mode";

const PATHS = [
  {
    id: "kinetic-path-primary",
    d: "M 642 120 C 850 30 1120 42 1398 138",
    text: "SYSTEMS ARE MADE OF DECISIONS · BUILD · RESEARCH · DEPLOY · ",
  },
  {
    id: "kinetic-path-context",
    d: "M 716 302 C 932 198 1192 206 1422 330",
    text: "CONTEXT SHAPES OUTCOME · ABSTRACT · COMPOSE · ITERATE · ",
  },
  {
    id: "kinetic-path-structure",
    d: "M 808 548 C 1002 426 1244 456 1442 594",
    text: "STRUCTURE ENABLES SCALE · TRACE · VERIFY · RELEASE · ",
  },
  {
    id: "kinetic-path-document",
    d: "M 916 760 C 1080 650 1280 668 1456 802",
    text: "DOCUMENT · REFINE · REUSE · ARCHIVE · LOCATE · ",
  },
] as const;

const DENSITY_ROWS = [
  "SRA/0826  BUILD/12  CONTEXT/46  SYSTEM/ACTIVE  TRACE/098",
  "INDEX/003  MODEL/READY  ROUTE/PROJECTS  STATE/RESOLVED",
  "ARCHIVE/OPEN  SIGNAL/024  RESEARCH/17  DEPLOY/STABLE",
  "COMPOSE/58  INPUT/VALID  OUTPUT/READABLE  PATH/LOCATED",
  "DECISION/31  STRUCTURE/92  SCALE/07  RECORD/2026",
  "DOCUMENT/68  REFINE/21  REUSE/44  STATUS/ACTIVE",
] as const;

type KineticTypeFieldProps = Readonly<{
  mode: EffectMode;
}>;

export function KineticTypeField({ mode }: KineticTypeFieldProps) {
  const primaryPathOffset = useMotionValue("3%");
  const secondaryPathOffset = useMotionValue("7%");
  const fieldOffset = useMotionValue(0);
  const localEmphasis = useMotionValue(0.44);
  const locatorProgress = useMotionValue(mode === "static" ? 1 : 0);

  useEffect(() => {
    primaryPathOffset.set("3%");
    secondaryPathOffset.set("7%");
    fieldOffset.set(0);
    localEmphasis.set(mode === "static" ? 0.58 : 0.32);
    locatorProgress.set(mode === "static" ? 1 : 0);

    if (mode === "static") {
      return;
    }

    if (mode === "reduced") {
      const emphasisControl = animate(localEmphasis, 0.52, {
        duration: 0.42,
        ease: [0.22, 1, 0.36, 1],
      });
      const locatorControl = animate(locatorProgress, 1, {
        duration: 0.48,
        ease: [0.22, 1, 0.36, 1],
      });

      return () => {
        emphasisControl.stop();
        locatorControl.stop();
      };
    }

    const primaryControl = animate(primaryPathOffset, ["3%", "8%", "5%"], {
      duration: 11,
      ease: "easeInOut",
    });
    const secondaryControl = animate(
      secondaryPathOffset,
      ["7%", "2%", "4%"],
      {
        duration: 13,
        ease: "easeInOut",
      },
    );
    const fieldControl = animate(fieldOffset, [0, -9, 0], {
      duration: 12,
      ease: "easeInOut",
    });
    const emphasisControl = animate(localEmphasis, [0.32, 0.7, 0.5], {
      duration: 4.8,
      ease: [0.22, 1, 0.36, 1],
      times: [0, 0.32, 1],
    });
    const locatorControl = animate(locatorProgress, 1, {
      duration: 0.72,
      delay: 0.18,
      ease: [0.22, 1, 0.36, 1],
    });

    return () => {
      primaryControl.stop();
      secondaryControl.stop();
      fieldControl.stop();
      emphasisControl.stop();
      locatorControl.stop();
    };
  }, [
    fieldOffset,
    localEmphasis,
    locatorProgress,
    mode,
    primaryPathOffset,
    secondaryPathOffset,
  ]);

  return (
    <motion.div
      animate={{
        clipPath: "inset(0% 0% 0% 0%)",
        opacity: 1,
      }}
      aria-hidden="true"
      className="kinetic-field"
      data-mode={mode}
      initial={
        mode === "static"
          ? false
          : { clipPath: "inset(0% 0% 100% 0%)", opacity: 0.72 }
      }
      transition={{
        duration: mode === "static" ? 0 : mode === "reduced" ? 0.42 : 0.72,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      <svg
        aria-hidden="true"
        className="kinetic-field__svg"
        focusable="false"
        preserveAspectRatio="xMidYMid slice"
        viewBox="0 0 1440 900"
      >
        <defs>
          {PATHS.map((path) => (
            <path d={path.d} id={path.id} key={path.id} />
          ))}
          <clipPath id="kinetic-field-clip">
            <path d="M 624 0 H 1440 V 900 H 1258 C 1072 824 906 702 808 548 C 704 384 660 204 624 0 Z" />
          </clipPath>
        </defs>

        <path
          className="kinetic-field__ground"
          d="M 624 0 H 1440 V 900 H 1258 C 1072 824 906 702 808 548 C 704 384 660 204 624 0 Z"
        />

        <g clipPath="url(#kinetic-field-clip)">
          <motion.g className="kinetic-field__density" style={{ x: fieldOffset }}>
            {DENSITY_ROWS.map((row, index) => (
              <text
                key={row}
                transform={`translate(${650 + (index % 2) * 18} ${92 + index * 132}) rotate(-5)`}
              >
                {`${row}  ${row}`}
              </text>
            ))}
          </motion.g>

          <g className="kinetic-field__guides">
            <path d="M 690 20 C 760 278 886 608 1258 900" />
            <path d="M 878 0 C 896 276 1054 638 1418 778" />
            <path d="M 1026 0 C 1088 230 1240 460 1440 520" />
          </g>

          <text className="kinetic-field__path-text kinetic-field__path-text--primary">
            <motion.textPath
              href="#kinetic-path-primary"
              startOffset={primaryPathOffset}
            >
              {PATHS[0].text}
            </motion.textPath>
          </text>
          <text className="kinetic-field__path-text kinetic-field__path-text--context">
            <motion.textPath
              href="#kinetic-path-context"
              startOffset={secondaryPathOffset}
            >
              {PATHS[1].text}
            </motion.textPath>
          </text>
          <text className="kinetic-field__path-text kinetic-field__path-text--structure">
            <textPath href="#kinetic-path-structure" startOffset="2%">
              {PATHS[2].text}
            </textPath>
          </text>
          <motion.text
            className="kinetic-field__path-text kinetic-field__path-text--document"
            style={{ opacity: localEmphasis }}
          >
            <textPath href="#kinetic-path-document" startOffset="1%">
              {PATHS[3].text}
            </textPath>
          </motion.text>

          <motion.path
            className="kinetic-field__locator"
            d="M 742 418 C 918 356 1104 362 1298 416"
            style={{ pathLength: locatorProgress }}
          />
          <circle className="kinetic-field__locator-node" cx="1088" cy="378" r="5" />
        </g>
      </svg>
    </motion.div>
  );
}
