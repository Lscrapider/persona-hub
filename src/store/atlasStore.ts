import { create } from 'zustand';
import type { AtlasProject } from '../config/atlas.schema';

type PointerState = {
  x: number;
  y: number;
};

type AtlasState = {
  selectedProject: AtlasProject | null;
  scrollProgress: number;
  pointer: PointerState;
  reducedMotion: boolean;
  selectProject: (project: AtlasProject | null) => void;
  setScrollProgress: (progress: number) => void;
  setPointer: (pointer: PointerState) => void;
  setReducedMotion: (reducedMotion: boolean) => void;
};

export const useAtlasStore = create<AtlasState>((set) => ({
  selectedProject: null,
  scrollProgress: 0,
  pointer: { x: 0, y: 0 },
  reducedMotion: false,
  selectProject: (selectedProject) => set({ selectedProject }),
  setScrollProgress: (scrollProgress) => set({ scrollProgress }),
  setPointer: (pointer) => set({ pointer }),
  setReducedMotion: (reducedMotion) => set({ reducedMotion })
}));
