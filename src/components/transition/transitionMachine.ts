export type TransitionPhase =
  | "idle"
  | "preparing"
  | "throwing"
  | "revealing"
  | "navigating";

export type SceneMotionValues = {
  characterProgress: number;
  flightProgress: number;
  pointerX: number;
  pointerY: number;
};

export const createSceneMotionValues = (): SceneMotionValues => ({
  characterProgress: 0,
  flightProgress: 0,
  pointerX: 0,
  pointerY: 0,
});
