"use client";

import { useFrame, useLoader } from "@react-three/fiber";
import {
  AnimationAction,
  AnimationMixer,
  Color,
  Group,
  LoopOnce,
  Material,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  Quaternion,
  Vector3,
} from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { clone as cloneSkeleton } from "three/examples/jsm/utils/SkeletonUtils.js";
import {
  forwardRef,
  type MutableRefObject,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";

import type { SceneMotionValues } from "@/components/transition/transitionMachine";

const CHARACTER_MODEL_URL = "/assets/models/robot-expressive.glb";

type GpuCharacterProps = {
  motionValues: MutableRefObject<SceneMotionValues>;
  onReady: () => void;
};

export type CharacterRigHandle = {
  getHandWorldPose: (
    position: Vector3,
    quaternion: Quaternion,
  ) => boolean;
};

function createPrototypeMaterial(source: Material) {
  if (!(source instanceof MeshStandardMaterial)) {
    return source.clone();
  }

  const material = source.clone();
  material.metalness = 0.48;
  material.roughness = 0.42;

  if (source.name === "Main") {
    material.color = new Color("#0b0b0e");
    material.emissive = new Color("#190303");
    material.emissiveIntensity = 0.22;
  } else if (source.name === "Grey") {
    material.color = new Color("#e8ddc8");
    material.emissive = new Color("#1d1610");
    material.emissiveIntensity = 0.1;
  } else {
    material.color = new Color("#d91f1a");
    material.emissive = new Color("#b20e0b");
    material.emissiveIntensity = 0.88;
    material.roughness = 0.3;
  }

  return material;
}

export const GpuCharacter = forwardRef<
  CharacterRigHandle,
  GpuCharacterProps
>(function GpuCharacter({ motionValues, onReady }, ref) {
  const gltf = useLoader(GLTFLoader, CHARACTER_MODEL_URL);
  const handBoneRef = useRef<Object3D | null>(null);
  const idleActionRef = useRef<AnimationAction | null>(null);
  const punchActionRef = useRef<AnimationAction | null>(null);
  const previousProgressRef = useRef(0);
  const handScale = useMemo(() => new Vector3(), []);
  const {
    instanceMaterials,
    modelRoot,
  } = useMemo(() => {
    const root = cloneSkeleton(gltf.scene) as Group;
    const materials: Material[] = [];

    root.traverse((object) => {
      const mesh = object as Mesh;

      if (!mesh.isMesh) {
        return;
      }

      const sourceMaterials = Array.isArray(mesh.material)
        ? mesh.material
        : [mesh.material];
      const styledMaterials = sourceMaterials.map((material) => {
        const styledMaterial = createPrototypeMaterial(material);
        materials.push(styledMaterial);
        return styledMaterial;
      });

      mesh.material = Array.isArray(mesh.material)
        ? styledMaterials
        : styledMaterials[0]!;
      mesh.castShadow = false;
      mesh.receiveShadow = false;
      mesh.frustumCulled = false;
    });

    return {
      instanceMaterials: materials,
      modelRoot: root,
    };
  }, [gltf.scene]);
  const mixer = useMemo(
    () => new AnimationMixer(modelRoot),
    [modelRoot],
  );

  useImperativeHandle(
    ref,
    () => ({
      getHandWorldPose(position, quaternion) {
        const handBone = handBoneRef.current;

        if (!handBone) {
          return false;
        }

        handBone.updateWorldMatrix(true, false);
        handBone.matrixWorld.decompose(
          position,
          quaternion,
          handScale,
        );
        return true;
      },
    }),
    [handScale],
  );

  useEffect(() => {
    const idleClip = gltf.animations.find(
      (clip) => clip.name === "Idle",
    );
    const punchClip = gltf.animations.find(
      (clip) => clip.name === "Punch",
    );
    const handBone =
      modelRoot.getObjectByName("Palm2R") ??
      modelRoot.getObjectByName("Palm1R") ??
      modelRoot.getObjectByName("LowerArmR");

    if (!idleClip || !punchClip || !handBone) {
      return;
    }

    const idleAction = mixer.clipAction(idleClip);
    const punchAction = mixer.clipAction(punchClip);
    punchAction.clampWhenFinished = true;
    punchAction.setLoop(LoopOnce, 1);
    punchAction.paused = true;
    idleAction.reset().play();

    handBoneRef.current = handBone;
    idleActionRef.current = idleAction;
    punchActionRef.current = punchAction;
    onReady();

    return () => {
      handBoneRef.current = null;
      idleActionRef.current = null;
      punchActionRef.current = null;
      mixer.stopAllAction();
      mixer.uncacheRoot(modelRoot);
    };
  }, [gltf.animations, mixer, modelRoot, onReady]);

  useEffect(
    () => () => {
      instanceMaterials.forEach((material) => material.dispose());
    },
    [instanceMaterials],
  );

  useFrame((_, delta) => {
    const progress = motionValues.current.characterProgress;
    const previousProgress = previousProgressRef.current;
    const idleAction = idleActionRef.current;
    const punchAction = punchActionRef.current;

    if (!idleAction || !punchAction) {
      return;
    }

    if (progress <= 0) {
      if (previousProgress > 0) {
        mixer.stopAllAction();
        idleAction.reset().play();
      }

      mixer.update(Math.min(delta, 0.05));
    } else {
      if (previousProgress <= 0) {
        idleAction.stop();
        punchAction.reset().play();
        punchAction.paused = true;
      }

      punchAction.time = Math.min(
        punchAction.getClip().duration,
        punchAction.getClip().duration * progress,
      );
      mixer.update(0);
    }

    previousProgressRef.current = progress;
    modelRoot.updateMatrixWorld(true);
  }, -2);

  return (
    <group
      position={[1.42, -2.14, 0.02]}
      rotation={[0, -0.08, 0]}
      scale={0.82}
    >
      <primitive object={modelRoot} />
    </group>
  );
});

GpuCharacter.displayName = "GpuCharacter";

useLoader.preload(GLTFLoader, CHARACTER_MODEL_URL);
