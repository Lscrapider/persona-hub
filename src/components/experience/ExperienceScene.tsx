"use client";

import { useFrame, useLoader, useThree } from "@react-three/fiber";
import {
  Group,
  LinearFilter,
  SRGBColorSpace,
  Texture,
  TextureLoader,
} from "three";
import {
  type MutableRefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { CameraRig } from "@/components/experience/CameraRig";
import {
  type CharacterRigHandle,
  GpuCharacter,
} from "@/components/experience/GpuCharacter";
import { ProjectCard } from "@/components/experience/ProjectCard";
import type { SceneMotionValues } from "@/components/transition/transitionMachine";

const BACKGROUND_URL =
  "/assets/hero/phantom-courier-background.png";
const BACKGROUND_DEPTH_SCALE = 1.38;

type ExperienceSceneProps = {
  motionValues: MutableRefObject<SceneMotionValues>;
  onDispose: () => void;
  onReady: () => void;
};

function configureCoverTexture(
  texture: Texture,
  containerAspect: number,
) {
  const image = texture.image as HTMLImageElement;
  const imageAspect = image.width / image.height;

  texture.repeat.set(1, 1);
  texture.offset.set(0, 0);

  if (containerAspect > imageAspect) {
    texture.repeat.y = imageAspect / containerAspect;
    texture.offset.y = (1 - texture.repeat.y) / 2;
  } else {
    texture.repeat.x = containerAspect / imageAspect;
    texture.offset.x = (1 - texture.repeat.x) / 2;
  }

  texture.colorSpace = SRGBColorSpace;
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  texture.needsUpdate = true;
}

export function ExperienceScene({
  motionValues,
  onDispose,
  onReady,
}: ExperienceSceneProps) {
  const stageGroup = useRef<Group>(null);
  const characterRef = useRef<CharacterRigHandle>(null);
  const [characterReady, setCharacterReady] = useState(false);
  const { viewport } = useThree();
  const stageSource = useLoader(TextureLoader, BACKGROUND_URL);
  const stageTexture = useMemo(
    () => stageSource.clone(),
    [stageSource],
  );
  const handleCharacterReady = useCallback(
    () => setCharacterReady(true),
    [],
  );

  useEffect(() => {
    configureCoverTexture(
      stageTexture,
      viewport.width / viewport.height,
    );
  }, [stageTexture, viewport.height, viewport.width]);

  useEffect(() => {
    if (!characterReady) {
      return;
    }

    const readyFrame = requestAnimationFrame(onReady);

    return () => cancelAnimationFrame(readyFrame);
  }, [characterReady, onReady]);

  useEffect(
    () => () => {
      onDispose();
      stageTexture.dispose();
    },
    [onDispose, stageTexture],
  );

  useFrame(() => {
    const stage = stageGroup.current;

    if (!stage) {
      return;
    }

    const {
      flightProgress,
      pointerX,
      pointerY,
    } = motionValues.current;
    stage.position.x = -pointerX * 0.035;
    stage.position.y = pointerY * 0.022;
    stage.position.z = -1.8 - flightProgress * 0.2;
    stage.scale.setScalar(1 + flightProgress * 0.025);
  }, -4);

  return (
    <>
      <CameraRig motionValues={motionValues} />

      <ambientLight intensity={1.08} />
      <directionalLight
        color="#fff0d8"
        intensity={3.2}
        position={[2.6, 4.2, 4.8]}
      />
      <pointLight
        color="#e51f19"
        intensity={18}
        position={[2.2, 0.2, 2.8]}
      />
      <pointLight
        color="#6d0b08"
        intensity={8}
        position={[-2.4, -1.2, 1.4]}
      />

      <group position={[0, 0, -1.8]} ref={stageGroup}>
        <mesh>
          <planeGeometry
            args={[
              viewport.width * BACKGROUND_DEPTH_SCALE,
              viewport.height * BACKGROUND_DEPTH_SCALE,
            ]}
          />
          <meshBasicMaterial
            map={stageTexture}
            toneMapped={false}
          />
        </mesh>
      </group>

      <GpuCharacter
        motionValues={motionValues}
        onReady={handleCharacterReady}
        ref={characterRef}
      />
      <ProjectCard
        characterRef={characterRef}
        motionValues={motionValues}
      />
    </>
  );
}

useLoader.preload(TextureLoader, BACKGROUND_URL);
