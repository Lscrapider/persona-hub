import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { useAtlasStore } from '../store/atlasStore';

gsap.registerPlugin(ScrollTrigger);

function currentScrollProgress() {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;

  if (scrollable <= 0) {
    return 0;
  }

  return Math.min(1, Math.max(0, window.scrollY / scrollable));
}

export function useScrollRig() {
  const setScrollProgress = useAtlasStore((state) => state.setScrollProgress);
  const reducedMotion = useAtlasStore((state) => state.reducedMotion);

  useEffect(() => {
    if (reducedMotion) {
      const update = () => setScrollProgress(currentScrollProgress());

      update();
      window.addEventListener('scroll', update, { passive: true });
      window.addEventListener('resize', update);

      return () => {
        window.removeEventListener('scroll', update);
        window.removeEventListener('resize', update);
      };
    }

    const lenis = new Lenis({
      duration: 1.08,
      easing: (value) => Math.min(1, 1.001 - Math.pow(2, -10 * value)),
      smoothWheel: true
    });

    const updateScrollTrigger = () => ScrollTrigger.update();
    lenis.on('scroll', updateScrollTrigger);

    const ticker = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(ticker);
    gsap.ticker.lagSmoothing(0);

    const trigger = ScrollTrigger.create({
      trigger: document.body,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.5,
      onUpdate: (self) => setScrollProgress(self.progress)
    });

    ScrollTrigger.refresh();

    return () => {
      trigger.kill();
      lenis.off('scroll', updateScrollTrigger);
      gsap.ticker.remove(ticker);
      lenis.destroy();
    };
  }, [reducedMotion, setScrollProgress]);
}
