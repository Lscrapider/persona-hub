"use client";

import {
  type AnimationEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import { useEffectMode } from "@/effects/runtime/EffectMode";
import { ScrambleText } from "@/effects/primitives/ScrambleText";

type RevealState = "pending" | "animating" | "revealed";

type CopyRevealProps = Readonly<{
  text: string;
  enabled: boolean;
  className?: string;
  durationMs?: number;
  lang?: string;
}>;

function containsChinese(text: string) {
  return /[\u3400-\u9fff]/u.test(text);
}

export function CopyReveal({
  text,
  enabled,
  className,
  durationMs,
  lang,
}: CopyRevealProps) {
  const { mode } = useEffectMode();
  const rootRef = useRef<HTMLSpanElement>(null);
  const startedRef = useRef(false);
  const completionTimerRef = useRef<number | null>(null);
  const [revealState, setRevealState] = useState<RevealState>("pending");
  const isChinese = lang?.startsWith("zh") || containsChinese(text);

  useEffect(() => {
    if (
      !enabled ||
      mode !== "full" ||
      startedRef.current ||
      !rootRef.current
    ) {
      return;
    }

    const startReveal = () => {
      if (startedRef.current) {
        return;
      }

      startedRef.current = true;

      if (!isChinese) {
        setRevealState("revealed");
        return;
      }

      setRevealState("animating");
      completionTimerRef.current = window.setTimeout(() => {
        completionTimerRef.current = null;
        setRevealState("revealed");
      }, 520);
    };

    if (typeof IntersectionObserver === "undefined") {
      startReveal();
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) {
          return;
        }

        startReveal();
        observer.disconnect();
      },
      {
        rootMargin: "0px 0px -12% 0px",
        threshold: 0.14,
      },
    );

    observer.observe(rootRef.current);

    return () => {
      observer.disconnect();
    };
  }, [enabled, isChinese, mode]);

  useEffect(
    () => () => {
      if (completionTimerRef.current !== null) {
        window.clearTimeout(completionTimerRef.current);
      }
    },
    [],
  );

  const handleAnimationEnd = (event: AnimationEvent<HTMLSpanElement>) => {
    if (event.currentTarget !== event.target) {
      return;
    }

    if (completionTimerRef.current !== null) {
      window.clearTimeout(completionTimerRef.current);
      completionTimerRef.current = null;
    }

    setRevealState("revealed");
  };
  const rootClassName = ["copy-reveal", className].filter(Boolean).join(" ");
  const renderedRevealState = mode === "static" ? "revealed" : revealState;

  if (isChinese) {
    return (
      <span
        className={rootClassName + " copy-reveal--cjk"}
        data-reveal-state={renderedRevealState}
        lang={lang}
        onAnimationEnd={handleAnimationEnd}
        ref={rootRef}
      >
        {text}
      </span>
    );
  }

  return (
    <span className={rootClassName} ref={rootRef}>
      <ScrambleText
        durationMs={durationMs}
        play={revealState !== "pending"}
        text={text}
      />
    </span>
  );
}
