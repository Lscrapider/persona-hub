"use client";

import { type RefObject, useEffect, useState } from "react";

export function useSceneActivity(targetRef: RefObject<Element | null>) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [isDocumentVisible, setIsDocumentVisible] = useState(true);

  useEffect(() => {
    const target = targetRef.current;

    if (!target) {
      return;
    }

    if (typeof IntersectionObserver === "undefined") {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry?.isIntersecting ?? false);
      },
      { threshold: 0.08 },
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [targetRef]);

  useEffect(() => {
    const updateVisibility = () => {
      setIsDocumentVisible(!document.hidden);
    };

    updateVisibility();
    document.addEventListener("visibilitychange", updateVisibility);

    return () => {
      document.removeEventListener("visibilitychange", updateVisibility);
    };
  }, []);

  return isIntersecting && isDocumentVisible;
}
