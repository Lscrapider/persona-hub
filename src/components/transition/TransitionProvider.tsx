"use client";

import { gsap } from "gsap";
import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  type MouseEvent,
  type MutableRefObject,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { TransitionOverlay } from "@/components/transition/TransitionOverlay";
import {
  createSceneMotionValues,
  type SceneMotionValues,
  type TransitionPhase,
} from "@/components/transition/transitionMachine";

type TransitionContextValue = {
  beginProjectTransition: (
    event: MouseEvent<HTMLElement>,
    href: string,
  ) => void;
  motionValues: MutableRefObject<SceneMotionValues>;
  motionPreferenceResolved: boolean;
  phase: TransitionPhase;
  reducedMotion: boolean;
  sceneReady: boolean;
  setSceneReady: (ready: boolean) => void;
  setPointer: (x: number, y: number) => void;
};

const TransitionContext = createContext<TransitionContextValue | null>(null);

type TransitionProviderProps = {
  children: ReactNode;
};

export function TransitionProvider({ children }: TransitionProviderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const overlayRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const scanRef = useRef<HTMLDivElement>(null);
  const motionValues = useRef(createSceneMotionValues());
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const routeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeHrefRef = useRef<string | null>(null);
  const runIdRef = useRef(0);
  const [phase, setPhase] = useState<TransitionPhase>("idle");
  const [sceneReady, setSceneReady] = useState(false);
  const [reducedMotion, setReducedMotion] = useState<boolean | null>(null);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const resetTransition = useCallback(() => {
    timelineRef.current?.kill();
    timelineRef.current = null;

    if (routeTimeoutRef.current) {
      clearTimeout(routeTimeoutRef.current);
      routeTimeoutRef.current = null;
    }

    motionValues.current.characterProgress = 0;
    motionValues.current.flightProgress = 0;
    activeHrefRef.current = null;
    setPhase("idle");

    if (overlayRef.current) {
      gsap.set(overlayRef.current, {
        clearProps: "display,opacity,pointerEvents",
      });
    }

    if (cardRef.current) {
      gsap.set(cardRef.current, { clearProps: "all" });
    }

    if (scanRef.current) {
      gsap.set(scanRef.current, { clearProps: "all" });
    }
  }, []);

  useEffect(() => {
    const activeHref = activeHrefRef.current;
    const overlay = overlayRef.current;

    if (!activeHref || !overlay || !pathname.startsWith(activeHref)) {
      return;
    }

    setPhase("navigating");
    gsap.to(overlay, {
      delay: 0.08,
      duration: 0.26,
      ease: "power3.out",
      opacity: 0,
      onComplete: resetTransition,
    });
  }, [pathname, resetTransition]);

  useEffect(
    () => () => {
      timelineRef.current?.kill();
      if (routeTimeoutRef.current) {
        clearTimeout(routeTimeoutRef.current);
      }
    },
    [],
  );

  const beginProjectTransition = useCallback(
    (event: MouseEvent<HTMLElement>, href: string) => {
      if (phase !== "idle") {
        event.preventDefault();
        return;
      }

      if (!sceneReady || reducedMotion) {
        return;
      }

      const overlay = overlayRef.current;
      const card = cardRef.current;
      const scan = scanRef.current;

      if (!overlay || !card || !scan) {
        return;
      }

      event.preventDefault();
      runIdRef.current += 1;
      const runId = runIdRef.current;
      activeHrefRef.current = href;
      motionValues.current.characterProgress = 0;
      motionValues.current.flightProgress = 0;
      setPhase("preparing");

      gsap.set(overlay, {
        display: "grid",
        opacity: 0,
        pointerEvents: "auto",
      });
      gsap.set(card, {
        borderRadius: "2.5rem",
        opacity: 1,
        transform:
          "perspective(1200px) translate3d(13%, 8%, 0) rotateY(-14deg) rotateZ(-6deg) scale(0.52)",
      });
      gsap.set(scan, { xPercent: -130 });

      const timeline = gsap.timeline({
        defaults: { overwrite: true },
      });
      timelineRef.current = timeline;

      timeline
        .call(() => {
          if (runId === runIdRef.current) {
            setPhase("throwing");
          }
        })
        .to(
          motionValues.current,
          {
            duration: 0.72,
            ease: "none",
            characterProgress: 1,
          },
          0,
        )
        .to(
          motionValues.current,
          {
            duration: 0.51,
            ease: "power3.inOut",
            flightProgress: 1,
          },
          0.27,
        )
        .to(
          overlay,
          {
            duration: 0.12,
            ease: "power2.out",
            opacity: 1,
          },
          0.5,
        )
        .call(
          () => {
            if (runId === runIdRef.current) {
              setPhase("revealing");
            }
          },
          [],
          0.56,
        )
        .to(
          card,
          {
            borderRadius: 0,
            duration: 0.5,
            ease: "power4.inOut",
            opacity: 1,
            transform:
              "perspective(1200px) translate3d(0, 0, 0) rotateY(0deg) rotateZ(0deg) scale(1)",
          },
          0.52,
        )
        .to(
          scan,
          {
            duration: 0.4,
            ease: "power3.inOut",
            xPercent: 130,
          },
          0.56,
        )
        .call(
          () => {
            if (runId !== runIdRef.current) {
              return;
            }

            setPhase("navigating");
            router.push(href);
          },
          [],
          1.04,
        );

      routeTimeoutRef.current = setTimeout(() => {
        if (runId !== runIdRef.current || pathname.startsWith(href)) {
          return;
        }
        resetTransition();
      }, 3200);
    },
    [pathname, phase, reducedMotion, resetTransition, router, sceneReady],
  );

  const setPointer = useCallback((x: number, y: number) => {
    motionValues.current.pointerX = x;
    motionValues.current.pointerY = y;
  }, []);

  const value = useMemo<TransitionContextValue>(
    () => ({
      beginProjectTransition,
      motionValues,
      motionPreferenceResolved: reducedMotion !== null,
      phase,
      reducedMotion: reducedMotion === true,
      sceneReady,
      setPointer,
      setSceneReady,
    }),
    [
      beginProjectTransition,
      phase,
      reducedMotion,
      sceneReady,
      setPointer,
    ],
  );

  return (
    <TransitionContext.Provider value={value}>
      {children}
      <TransitionOverlay
        cardRef={cardRef}
        overlayRef={overlayRef}
        scanRef={scanRef}
      />
    </TransitionContext.Provider>
  );
}

export function useCardTransition() {
  const context = useContext(TransitionContext);

  if (!context) {
    throw new Error(
      "useCardTransition must be used within TransitionProvider",
    );
  }

  return context;
}
