import * as THREE from "three";
import { architectureStepTiming } from "./architectureTiming";

/** Original GLSL: a tapered signal follows the route itself, including its elbows. */
export function createArchitecturePulse(curve: THREE.Curve<THREE.Vector3>) {
  const length = Math.max(curve.getLength(), 0.01);
  const uniforms = {
    head: { value: 0 },
    direction: { value: 1 },
    tail: { value: Math.min(0.35, 0.95 / length) },
    opacity: { value: 0 },
    copper: { value: new THREE.Color("#c78f62") },
    ivory: { value: new THREE.Color("#fff2d5") },
  };
  const material = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float head;
      uniform float direction;
      uniform float tail;
      uniform float opacity;
      uniform vec3 copper;
      uniform vec3 ivory;
      varying vec2 vUv;
      void main() {
        float behind = (head - vUv.x) * direction;
        float front = smoothstep(-0.008, 0.004, behind);
        float wake = 1.0 - smoothstep(0.0, tail, behind);
        float alpha = front * wake * opacity;
        if (alpha < 0.01) discard;
        float tip = 1.0 - smoothstep(0.0, tail * 0.32, max(behind, 0.0));
        gl_FragColor = vec4(mix(copper, ivory, tip), alpha);
        #include <colorspace_fragment>
      }
    `,
  });
  const geometry = new THREE.TubeGeometry(curve, 160, 0.035, 6, false);
  const mesh = new THREE.Mesh(geometry, material);
  // The signal stays in front of models even when the user rotates the view.
  mesh.renderOrder = 1000;
  mesh.visible = false;
  return {
    mesh,
    update(progress: number, backwards: boolean, visible: boolean) {
      const timing = architectureStepTiming(progress);
      mesh.visible = visible && timing.signalVisible;
      // Once the head reaches the port, consume the tail into that same port.
      // No mid-route opacity pulse or wrapping back to the start.
      const travel = timing.travel + timing.arrival * (uniforms.tail.value + 0.01);
      uniforms.head.value = backwards ? 1 - travel : travel;
      uniforms.direction.value = backwards ? -1 : 1;
      uniforms.opacity.value = 1;
    },
    dispose() { geometry.dispose(); material.dispose(); },
  };
}
