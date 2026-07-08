import { useEffect, useRef } from 'react';
import { useAtlasStore } from '../../store/atlasStore';

const VERTEX_SHADER = `
attribute vec2 a_position;

void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `
precision highp float;

uniform vec2 u_resolution;
uniform vec2 u_pointer;
uniform float u_scroll;
uniform float u_focus;
uniform float u_side;
uniform float u_tunnel;
uniform float u_tunnel_phase;
uniform float u_project;
uniform float u_time;

const float HOME_FLOW_SPEED = 0.012;
const float TUNNEL_FLOW_SPEED = 0.05;
const float PROJECT_WARP_STRENGTH = 0.34;
const float PROJECT_NEBULA_GAIN = 0.6;

mat2 rotate2d(float angle) {
  float s = sin(angle);
  float c = cos(angle);
  return mat2(c, -s, s, c);
}

float hash(vec2 p) {
  p = fract(p * vec2(127.1, 311.7));
  p += dot(p, p + 37.19);
  return fract(p.x * p.y);
}

vec2 hash2(vec2 p) {
  float x = hash(p + vec2(17.7, 41.2));
  float y = hash(p + vec2(73.1, 11.9));
  return vec2(x, y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);

  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));

  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm4(vec2 p) {
  float sum = 0.0;
  float amp = 0.5;
  mat2 turn = rotate2d(0.72);

  for (int i = 0; i < 4; i++) {
    sum += amp * noise(p);
    p = turn * p * 2.03 + vec2(6.13, -4.71);
    amp *= 0.52;
  }

  return sum;
}

vec2 flowWarp(vec2 p, float t) {
  float a = fbm4(p + vec2(t * 0.18, -t * 0.1));
  float b = fbm4(rotate2d(1.47) * p + vec2(-t * 0.12, t * 0.16));
  return vec2(a, b) - 0.5;
}

float starLayer(vec2 p, float scale, float density, float size) {
  vec2 starSpace = p * scale;
  vec2 cell = floor(starSpace);
  vec2 local = fract(starSpace) - 0.5;
  float seed = hash(cell);
  float keep = 1.0 - step(density, seed);
  vec2 offset = hash2(cell) - 0.5;
  float dist = length(local - offset * 0.62);
  float star = smoothstep(size, 0.0, dist);
  return star * keep * (0.42 + hash(cell + 19.7) * 0.58);
}

float ellipse(vec2 p, vec2 center, vec2 radius, float rotation) {
  vec2 q = rotate2d(rotation) * (p - center);
  return 1.0 - smoothstep(0.62, 1.0, length(q / radius));
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  vec2 aspect = vec2(u_resolution.x / max(u_resolution.y, 1.0), 1.0);
  vec2 p = (uv - 0.5) * aspect;
  vec2 pointer = u_pointer * vec2(0.045, 0.032);
  float scroll = clamp(u_scroll, 0.0, 1.0);
  float tunnel = clamp(u_tunnel, 0.0, 1.0);
  float tunnelPhase = clamp(u_tunnel_phase, 0.0, 1.0);
  float project = clamp(u_project, 0.0, 1.0);
  float t = u_time * (HOME_FLOW_SPEED + tunnel * TUNNEL_FLOW_SPEED);
  float launch = smoothstep(0.0, 0.3, tunnelPhase);
  float cruise = smoothstep(0.18, 0.38, tunnelPhase) * (1.0 - smoothstep(0.72, 0.94, tunnelPhase));
  float arrival = smoothstep(0.64, 1.0, tunnelPhase);
  float transitArrival = arrival * smoothstep(0.03, 0.18, tunnel);

  float lens = smoothstep(0.58, 0.0, length(p - pointer * 1.6));
  p += (pointer - p) * lens * 0.007;

  vec2 tunnelTarget = vec2(u_side * 0.4, -0.03);
  vec2 zoomOrigin = mix(vec2(0.0), tunnelTarget, transitArrival);
  float zoomScale = mix(1.0, 0.14, tunnel * launch * (1.0 - transitArrival * 0.42));
  vec2 zoomedP = zoomOrigin + (p - zoomOrigin) * zoomScale;

  vec2 slowWarp = flowWarp(zoomedP * 1.06, t);
  vec2 field = zoomedP + slowWarp * (0.18 + tunnel * 0.08);
  vec2 atlas = rotate2d(-0.24 + sin(t * 0.42) * 0.01) * field;

  float verticalDepth = smoothstep(-0.72, 0.88, p.y + 0.16);
  float radialDepth = 1.0 - smoothstep(0.08, 1.14, length(p * vec2(0.78, 1.02)));

  vec3 abyss = vec3(0.008, 0.018, 0.028);
  vec3 deepBlue = vec3(0.018, 0.052, 0.073);
  vec3 inkBlue = vec3(0.026, 0.082, 0.096);
  vec3 duskViolet = vec3(0.16, 0.12, 0.22);
  vec3 dustBlue = vec3(0.16, 0.22, 0.3);
  vec3 dustViolet = vec3(0.24, 0.17, 0.31);
  vec3 signalCyan = vec3(0.24, 0.62, 0.66);
  vec3 amber = vec3(0.46, 0.32, 0.18);
  vec3 mint = vec3(0.18, 0.72, 0.58);
  vec3 solar = vec3(0.72, 0.45, 0.18);
  vec3 violet = vec3(0.48, 0.32, 0.82);

  float focusOne = 1.0 - step(0.5, abs(u_focus - 1.0));
  float focusTwo = 1.0 - step(0.5, abs(u_focus - 2.0));
  float focusFuture = 1.0 - step(0.5, abs(u_focus - 3.0));
  vec3 projectColor = mint * focusOne + solar * focusTwo + violet * focusFuture;
  projectColor = mix(signalCyan, projectColor, clamp(focusOne + focusTwo + focusFuture, 0.0, 1.0));
  float futureDimming = 1.0 - focusFuture * 0.34;
  float projectSizeBalance = 1.0 - focusOne * 0.28 + focusFuture * 0.08;
  float projectLightBalance = 1.0 - focusOne * 0.12 + focusFuture * 0.34;

  vec3 color = mix(abyss, deepBlue, verticalDepth);
  color += inkBlue * radialDepth * 0.22;

  vec2 bandSpace = rotate2d(0.46) * (field + vec2(0.04, -0.04));
  float diagonalBody = 1.0 - smoothstep(0.16, 0.78, abs(bandSpace.y));
  float diagonalCore = 1.0 - smoothstep(0.05, 0.34, abs(bandSpace.y + 0.03));

  float localClouds =
    diagonalBody * 0.8 +
    diagonalCore * 0.34 +
    ellipse(field, vec2(-0.54, 0.18), vec2(0.66, 0.3), 0.58) * 0.5 +
    ellipse(field, vec2(0.46, -0.24), vec2(0.76, 0.38), -0.48) * 0.58 +
    ellipse(field, vec2(0.12, 0.36), vec2(0.52, 0.24), 0.1) * 0.28;

  float broad = smoothstep(0.32, 0.78, fbm4(atlas * 1.35 + slowWarp * 0.55 + vec2(t * 0.1, -t * 0.06)));
  float softFog = smoothstep(0.4, 0.86, fbm4(atlas * 2.28 + slowWarp * 0.8 + vec2(-t * 0.12, t * 0.09)));
  float fineDust = smoothstep(0.52, 0.9, fbm4(atlas * 5.4 + slowWarp * 1.5));
  float voidField = smoothstep(0.48, 0.86, fbm4(atlas * 3.05 + vec2(4.4, -8.8) + slowWarp));
  float darkFilament = smoothstep(0.52, 0.86, fbm4(atlas * 4.2 + vec2(-13.6, 7.4) - slowWarp * 0.7));

  float centerQuiet = 1.0 - smoothstep(0.12, 0.64, length((p - vec2(-0.22, -0.18)) * vec2(1.08, 0.88)));
  float nebula = clamp(localClouds * broad * (0.72 + softFog * 0.42), 0.0, 1.0);
  nebula *= 1.0 - voidField * 0.24;
  nebula *= 1.0 - centerQuiet * 0.22;

  color += dustBlue * nebula * 0.58;
  color += dustViolet * softFog * localClouds * 0.3;
  color += duskViolet * fineDust * localClouds * 0.16;
  color += amber * smoothstep(0.64, 0.94, fbm4((field + vec2(-0.35, 0.1)) * 3.1)) * nebula * 0.06;
  color *= 1.0 - voidField * localClouds * 0.18;
  color *= 1.0 - darkFilament * localClouds * 0.28;

  vec2 projectCenter = vec2(u_side * 0.42, -0.03);
  float arrivalScale = mix(0.16, 0.74, max(transitArrival, project));
  float projectScale = arrivalScale * projectSizeBalance;
  vec2 projectLocal = (field - projectCenter) / projectScale;
  vec2 projectSpace = rotate2d(u_side * (0.32 + focusTwo * 0.32 - focusFuture * 0.18)) * projectLocal;
  vec2 projectWarp = flowWarp(projectSpace * 1.72 + vec2(u_focus * 4.7, -u_focus * 2.9), t * 0.8);
  vec2 brokenSpace = projectSpace + projectWarp * PROJECT_WARP_STRENGTH + vec2(projectSpace.y * 0.16, -projectSpace.x * 0.12);
  vec2 scatterSpace = rotate2d(0.92 - u_side * 0.28) * brokenSpace;

  float envelope = 1.0 - smoothstep(0.16, 0.88, length(brokenSpace * vec2(0.82, 1.18)));
  float lobeA = ellipse(scatterSpace, vec2(-0.12, 0.06), vec2(0.32, 0.22), 0.38);
  float lobeB = ellipse(scatterSpace, vec2(0.18, -0.16), vec2(0.28, 0.18), -0.82);
  float lobeC = ellipse(scatterSpace, vec2(-0.05, 0.24), vec2(0.22, 0.14), 0.18);
  float fracturedCloud = smoothstep(0.28, 0.82, fbm4(brokenSpace * 2.55 + projectWarp * 1.4 + vec2(u_focus * 1.7, -3.1)));
  float innerThreads = smoothstep(0.42, 0.88, fbm4(scatterSpace * 5.4 + vec2(-6.2, 11.5)));
  float projectCore = smoothstep(0.42, 0.9, fbm4(brokenSpace * 3.45 + projectWarp * 1.1));
  float projectGrain = smoothstep(0.52, 0.92, fbm4(brokenSpace * 7.2 + vec2(9.4, -3.7)));
  float projectVoid = smoothstep(0.48, 0.88, fbm4(brokenSpace * 4.9 + vec2(-6.2, 11.5)));
  float projectShell = envelope * fracturedCloud * 0.84 + lobeA * 0.28 + lobeB * 0.22 + lobeC * 0.16;
  float projectNebula = clamp(projectShell * (0.34 + projectCore * 0.46 + innerThreads * 0.08), 0.0, 1.0);
  projectNebula *= 0.62 + smoothstep(0.22, 0.86, fbm4(brokenSpace * 6.0 + projectWarp * 1.9)) * 0.34;
  projectNebula *= 1.0 - projectVoid * 0.32;
  projectNebula += envelope * fracturedCloud * 0.12 + projectShell * projectGrain * 0.05;

  color += projectColor * projectNebula * project * PROJECT_NEBULA_GAIN * futureDimming * projectLightBalance;
  color += mix(projectColor, vec3(0.9, 0.86, 0.74), 0.25) * projectCore * projectShell * project * 0.08 * futureDimming * projectLightBalance;
  color *= 1.0 + projectNebula * project * 0.12 * futureDimming * projectLightBalance;

  float clusterMask = smoothstep(0.32, 0.72, fbm4(p * 1.45 + vec2(12.7, -4.8)));
  clusterMask += nebula * 0.28;
  clusterMask *= 1.0 - centerQuiet * 0.3;
  float starsSmall = starLayer(p + slowWarp * 0.04, 210.0, 0.014 + clusterMask * 0.034, 0.028);
  float starsMedium = starLayer(p - slowWarp * 0.026, 88.0, 0.003 + clusterMask * 0.008, 0.046);
  float starsFaint = starLayer(p + slowWarp * 0.018, 292.0, 0.04 + clusterMask * 0.04, 0.014);
  float twinkle = 0.94 + 0.06 * sin(u_time * 0.08 + hash(floor(p * 42.0)) * 6.283);
  vec3 starTint = mix(vec3(0.74, 0.86, 0.92), vec3(0.92, 0.78, 0.65), hash(floor(p * 33.0) + vec2(5.1, 9.3)));
  float dustSpark = step(0.9972, hash(floor(gl_FragCoord.xy * 0.72)));
  color += starTint * (starsFaint * 0.11 + starsSmall * 0.54 + starsMedium * 0.76 + dustSpark * 0.05) * twinkle;

  vec2 travelOrigin = mix(vec2(0.0), projectCenter, transitArrival);
  vec2 travelP = p - travelOrigin;
  float travelRadius = max(length(travelP), 0.012);
  float centerPull = smoothstep(0.32, 0.0, travelRadius);
  float exitBloom = transitArrival * smoothstep(0.62, 0.0, length(p - projectCenter));
  float entryDark = smoothstep(0.0, 0.5, tunnelPhase) * (1.0 - smoothstep(1.0, 1.55, travelRadius));

  color = mix(color, abyss + deepBlue * 0.25, tunnel * (0.32 + cruise * 0.18));
  color += mix(signalCyan, projectColor, transitArrival) * centerPull * tunnel * 0.12;
  color += projectColor * exitBloom * tunnel * 0.22;
  color *= 1.0 - entryDark * tunnel * 0.18;

  float signalGain = smoothstep(0.2, 0.6, scroll);
  float registryGain = smoothstep(0.78, 0.96, scroll);
  float signalA = smoothstep(0.07, 0.0, length(field - vec2(0.32, -0.04)));
  float signalB = smoothstep(0.052, 0.0, length(field - vec2(0.54, -0.2)));
  float signalC = smoothstep(0.045, 0.0, length(field - vec2(-0.44, 0.24)));
  float signalPulse = 0.9 + 0.1 * sin(u_time * 0.18);
  float pointerGlow = smoothstep(0.42, 0.0, length(p - pointer * vec2(1.5, 1.22)));

  color += signalCyan * (signalA * 0.08 + signalB * 0.054 + signalC * 0.045) * signalPulse * (0.34 + signalGain * 0.58);
  color += signalCyan * registryGain * (signalA + signalB) * 0.034;
  color += signalCyan * pointerGlow * 0.016;
  color *= 1.0 - centerQuiet * 0.14;

  float vignette = smoothstep(1.08, 0.16, length(p * vec2(0.82, 1.08)));
  color *= 0.52 + vignette * 0.82;
  color += abyss * (1.0 - vignette) * 0.5;
  color = pow(clamp(color * 1.64, 0.0, 1.0), vec3(0.86));

  gl_FragColor = vec4(color, 1.0);
}
`;

function compileShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);

  if (!shader) {
    throw new Error('Unable to create shader');
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader) ?? 'Unknown shader compile error';
    gl.deleteShader(shader);
    throw new Error(log);
  }

  return shader;
}

function createProgram(gl: WebGLRenderingContext) {
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
  const program = gl.createProgram();

  if (!program) {
    throw new Error('Unable to create shader program');
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program) ?? 'Unknown shader link error';
    gl.deleteProgram(program);
    throw new Error(log);
  }

  return program;
}

type CosmicShaderBackgroundProps = {
  focusIndex: number;
  focusSide: number;
  tunnelIntensity: number;
  tunnelPhase: number;
  projectPresence: number;
};

export function CosmicShaderBackground({
  focusIndex,
  focusSide,
  tunnelIntensity,
  tunnelPhase,
  projectPresence
}: CosmicShaderBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pointer = useAtlasStore((state) => state.pointer);
  const scrollProgress = useAtlasStore((state) => state.scrollProgress);
  const reducedMotion = useAtlasStore((state) => state.reducedMotion);
  const pointerRef = useRef(pointer);
  const scrollRef = useRef(scrollProgress);
  const sceneRef = useRef({ focusIndex, focusSide, tunnelIntensity, tunnelPhase, projectPresence });
  const drawOnceRef = useRef<((now: number) => void) | null>(null);

  useEffect(() => {
    pointerRef.current = pointer;
  }, [pointer]);

  useEffect(() => {
    scrollRef.current = scrollProgress;

    if (reducedMotion) {
      drawOnceRef.current?.(performance.now());
    }
  }, [scrollProgress, reducedMotion]);

  useEffect(() => {
    sceneRef.current = { focusIndex, focusSide, tunnelIntensity, tunnelPhase, projectPresence };

    if (reducedMotion) {
      drawOnceRef.current?.(performance.now());
    }
  }, [focusIndex, focusSide, tunnelIntensity, tunnelPhase, projectPresence, reducedMotion]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas?.getContext('webgl', {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: false
    });

    if (!canvas || !gl) return;

    let frame = 0;
    let disposed = false;
    const start = performance.now();

    try {
      const program = createProgram(gl);
      const positionLocation = gl.getAttribLocation(program, 'a_position');
      const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
      const pointerLocation = gl.getUniformLocation(program, 'u_pointer');
      const scrollLocation = gl.getUniformLocation(program, 'u_scroll');
      const focusLocation = gl.getUniformLocation(program, 'u_focus');
      const sideLocation = gl.getUniformLocation(program, 'u_side');
      const tunnelLocation = gl.getUniformLocation(program, 'u_tunnel');
      const tunnelPhaseLocation = gl.getUniformLocation(program, 'u_tunnel_phase');
      const projectLocation = gl.getUniformLocation(program, 'u_project');
      const timeLocation = gl.getUniformLocation(program, 'u_time');
      const buffer = gl.createBuffer();

      if (!buffer || positionLocation < 0) return;

      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      gl.useProgram(program);
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
      gl.disable(gl.DEPTH_TEST);
      gl.disable(gl.CULL_FACE);

      const resize = () => {
        const rect = canvas.getBoundingClientRect();
        const largestSide = Math.max(rect.width, rect.height);
        const ratioCap = largestSide > 1800 ? 0.36 : largestSide > 1200 ? 0.46 : 0.62;
        const ratio = Math.min(window.devicePixelRatio || 1, ratioCap);
        const width = Math.max(1, Math.floor(rect.width * ratio));
        const height = Math.max(1, Math.floor(rect.height * ratio));

        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width;
          canvas.height = height;
        }

        gl.viewport(0, 0, canvas.width, canvas.height);
      };

      const schedule = () => {
        if (!reducedMotion && !disposed && !document.hidden) {
          frame = window.requestAnimationFrame(render);
        }
      };

      const render = (now: number) => {
        if (disposed) return;

        const pointerValue = reducedMotion ? { x: 0, y: 0 } : pointerRef.current;
        const sceneValue = sceneRef.current;
        const time = reducedMotion ? 22 : (now - start) / 1000;

        gl.useProgram(program);
        gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
        gl.uniform2f(pointerLocation, pointerValue.x, pointerValue.y);
        gl.uniform1f(scrollLocation, scrollRef.current);
        gl.uniform1f(focusLocation, sceneValue.focusIndex);
        gl.uniform1f(sideLocation, sceneValue.focusSide);
        gl.uniform1f(tunnelLocation, reducedMotion ? 0 : sceneValue.tunnelIntensity);
        gl.uniform1f(tunnelPhaseLocation, sceneValue.tunnelPhase);
        gl.uniform1f(projectLocation, sceneValue.projectPresence);
        gl.uniform1f(timeLocation, time);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        schedule();
      };

      const handleVisibilityChange = () => {
        if (!document.hidden) {
          window.cancelAnimationFrame(frame);
          schedule();
        }
      };

      drawOnceRef.current = render;
      resize();

      render(start);
      const resizeObserver = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
      resizeObserver?.observe(canvas);
      window.addEventListener('resize', resize);
      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
        disposed = true;
        drawOnceRef.current = null;
        resizeObserver?.disconnect();
        window.removeEventListener('resize', resize);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.cancelAnimationFrame(frame);
        gl.deleteBuffer(buffer);
        gl.deleteProgram(program);
      };
    } catch (error) {
      console.warn('Cosmic shader background disabled:', error);
      return undefined;
    }
  }, [reducedMotion]);

  return <canvas ref={canvasRef} className="field-shader-cosmos" aria-hidden="true" />;
}
