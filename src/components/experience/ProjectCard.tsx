"use client";

import { useFrame, useLoader } from "@react-three/fiber";
import {
  AdditiveBlending,
  BoxGeometry,
  DoubleSide,
  Euler,
  Group,
  LinearFilter,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  QuadraticBezierCurve3,
  Quaternion,
  SRGBColorSpace,
  TextureLoader,
  Vector3,
} from "three";
import {
  type MutableRefObject,
  useEffect,
  useMemo,
  useRef,
} from "react";

import type { CharacterRigHandle } from "@/components/experience/GpuCharacter";
import type { SceneMotionValues } from "@/components/transition/transitionMachine";

const CARD_TEXTURE_URL =
  "/assets/projects/featured-project-card.png";
const ATTACHED_CARD_SCALE = 0.34;

type ProjectCardProps = {
  characterRef: MutableRefObject<CharacterRigHandle | null>;
  motionValues: MutableRefObject<SceneMotionValues>;
};

export function ProjectCard({
  characterRef,
  motionValues,
}: ProjectCardProps) {
  const cardGroup = useRef<Group>(null);
  const cardCore =
    useRef<Mesh<BoxGeometry, MeshStandardMaterial>>(null);
  const cardFace =
    useRef<Mesh<PlaneGeometry, MeshBasicMaterial>>(null);
  const trailGroup = useRef<Group>(null);
  const previousFlightProgress = useRef(0);
  const releaseLatched = useRef(false);
  const cardSource = useLoader(TextureLoader, CARD_TEXTURE_URL);
  const cardTexture = useMemo(() => {
    const texture = cardSource.clone();
    texture.colorSpace = SRGBColorSpace;
    texture.minFilter = LinearFilter;
    texture.magFilter = LinearFilter;
    texture.needsUpdate = true;
    return texture;
  }, [cardSource]);
  const handPosition = useMemo(() => new Vector3(), []);
  const handQuaternion = useMemo(() => new Quaternion(), []);
  const handOffset = useMemo(
    () => new Vector3(0.14, 0.02, 0.24),
    [],
  );
  const offsetScratch = useMemo(() => new Vector3(), []);
  const attachedRotation = useMemo(
    () =>
      new Quaternion().setFromEuler(
        new Euler(-0.18, 0.24, 1.04),
      ),
    [],
  );
  const releasePosition = useMemo(() => new Vector3(), []);
  const releaseQuaternion = useMemo(() => new Quaternion(), []);
  const targetQuaternion = useMemo(
    () =>
      new Quaternion().setFromEuler(
        new Euler(0.12, 0.28, 1.72),
      ),
    [],
  );
  const flightPoint = useMemo(() => new Vector3(), []);
  const flightCurve = useMemo(
    () =>
      new QuadraticBezierCurve3(
        new Vector3(),
        new Vector3(),
        new Vector3(),
      ),
    [],
  );

  useEffect(
    () => () => {
      cardTexture.dispose();
    },
    [cardTexture],
  );

  useFrame(() => {
    const card = cardGroup.current;
    const flightProgress = motionValues.current.flightProgress;
    const previousProgress = previousFlightProgress.current;

    if (!card) {
      return;
    }

    if (flightProgress <= 0) {
      releaseLatched.current = false;
      const hasHandPose =
        characterRef.current?.getHandWorldPose(
          handPosition,
          handQuaternion,
        ) ?? false;

      if (hasHandPose) {
        offsetScratch
          .copy(handOffset)
          .applyQuaternion(handQuaternion);
        card.position.copy(handPosition).add(offsetScratch);
        card.quaternion
          .copy(handQuaternion)
          .multiply(attachedRotation);
        card.scale.setScalar(ATTACHED_CARD_SCALE);
      }
    } else {
      if (!releaseLatched.current || previousProgress <= 0) {
        releasePosition.copy(card.position);
        releaseQuaternion.copy(card.quaternion);
        flightCurve.v0.copy(releasePosition);
        flightCurve.v1.set(
          releasePosition.x * 0.28,
          releasePosition.y * 0.35,
          3.35,
        );
        flightCurve.v2.set(0, 0, 5.5);
        releaseLatched.current = true;
      }

      flightCurve.getPoint(flightProgress, flightPoint);
      card.position.copy(flightPoint);
      card.quaternion.slerpQuaternions(
        releaseQuaternion,
        targetQuaternion,
        flightProgress,
      );
      card.scale.setScalar(
        ATTACHED_CARD_SCALE + flightProgress * 2.58,
      );
    }

    if (trailGroup.current) {
      trailGroup.current.visible =
        flightProgress > 0.015 && flightProgress < 0.9;
      trailGroup.current.scale.x =
        0.7 + flightProgress * 1.6;
      trailGroup.current.position.x =
        -0.48 - flightProgress * 0.3;
    }

    if (cardCore.current) {
      cardCore.current.material.emissiveIntensity =
        0.2 + flightProgress * 0.82;
    }

    if (cardFace.current) {
      cardFace.current.material.opacity =
        0.96 + flightProgress * 0.04;
    }

    previousFlightProgress.current = flightProgress;
  }, -1);

  return (
    <group ref={cardGroup}>
      <mesh ref={cardCore}>
        <boxGeometry args={[2.3, 1.44, 0.065]} />
        <meshStandardMaterial
          color="#111111"
          emissive="#e51f19"
          emissiveIntensity={0.2}
          metalness={0.72}
          roughness={0.34}
        />
      </mesh>

      <mesh position={[0, 0, 0.036]}>
        <planeGeometry args={[2.27, 1.41]} />
        <meshBasicMaterial
          color="#f0e2c7"
          side={DoubleSide}
          toneMapped={false}
        />
      </mesh>

      <mesh position={[0, 0, 0.039]} ref={cardFace}>
        <planeGeometry args={[2.19, 1.33]} />
        <meshBasicMaterial
          map={cardTexture}
          opacity={0.96}
          side={DoubleSide}
          toneMapped={false}
          transparent
        />
      </mesh>

      <group ref={trailGroup} visible={false}>
        <mesh
          position={[-1.1, -0.08, -0.02]}
          rotation={[0, 0, 0.08]}
        >
          <planeGeometry args={[1.75, 0.055]} />
          <meshBasicMaterial
            blending={AdditiveBlending}
            color="#e51f19"
            depthWrite={false}
            opacity={0.82}
            transparent
          />
        </mesh>
        <mesh
          position={[-1.25, 0.13, -0.04]}
          rotation={[0, 0, 0.08]}
        >
          <planeGeometry args={[1.15, 0.018]} />
          <meshBasicMaterial
            blending={AdditiveBlending}
            color="#fff1d8"
            depthWrite={false}
            opacity={0.72}
            transparent
          />
        </mesh>
      </group>
    </group>
  );
}

useLoader.preload(TextureLoader, CARD_TEXTURE_URL);
