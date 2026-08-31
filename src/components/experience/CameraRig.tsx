"use client";

import { useFrame } from "@react-three/fiber";
import { MathUtils, Vector3 } from "three";
import { type MutableRefObject, useMemo } from "react";

import type { SceneMotionValues } from "@/components/transition/transitionMachine";

type CameraRigProps = {
  motionValues: MutableRefObject<SceneMotionValues>;
};

export function CameraRig({ motionValues }: CameraRigProps) {
  const lookTarget = useMemo(() => new Vector3(), []);

  useFrame((state, delta) => {
    const {
      characterProgress,
      flightProgress,
      pointerX,
      pointerY,
    } = motionValues.current;
    const inputInfluence = 1 - Math.min(characterProgress / 0.18, 1);
    const frameDelta = Math.min(delta, 0.05);
    const targetX = pointerX * 0.2 * inputInfluence;
    const targetY = -pointerY * 0.11 * inputInfluence;
    const targetZ = 6 - flightProgress * 0.18;

    state.camera.position.x = MathUtils.damp(
      state.camera.position.x,
      targetX,
      5.5,
      frameDelta,
    );
    state.camera.position.y = MathUtils.damp(
      state.camera.position.y,
      targetY,
      5.5,
      frameDelta,
    );
    state.camera.position.z = MathUtils.damp(
      state.camera.position.z,
      targetZ,
      6,
      frameDelta,
    );

    lookTarget.set(
      0.28 + pointerX * 0.07 * inputInfluence,
      0.02 - pointerY * 0.04 * inputInfluence,
      0,
    );
    state.camera.lookAt(lookTarget);
  }, -3);

  return null;
}
