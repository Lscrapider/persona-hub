import { useEffect } from 'react';
import { useAtlasStore } from '../store/atlasStore';

export function useReducedMotion() {
  const setReducedMotion = useAtlasStore((state) => state.setReducedMotion);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(query.matches);

    update();
    query.addEventListener('change', update);

    return () => query.removeEventListener('change', update);
  }, [setReducedMotion]);
}
