import * as THREE from "three";
import type { TimelineRecord } from "@/lib/content/types";
import { createTimelineMaterials, createTimelineModel, ribbonGeometry } from "./timelineModels";
import { createTimelineCompanion } from "./timelineCompanion";
import { timelineActivity } from "./timelineActivity";

type State = { activeId: string | null; full: boolean };
export type TimelineRenderer = { update: (state: State) => void; dispose: () => void };

export function createTimelineRenderer(host: HTMLElement, canvas: HTMLCanvasElement, rail: HTMLElement, records: readonly TimelineRecord[]): TimelineRenderer {
  const scene = new THREE.Scene();
  const ownedMaterials = new Set<THREE.Material>();
  const cleanups: Array<() => void> = [];
  let disposed = false, raf = 0;
  const safely = (cleanup: () => void) => {
    try { cleanup(); } catch { /* A lost context must not prevent other resources being released. */ }
  };
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(raf); raf = 0;
    canvas.dataset.animating = "false";
    host.querySelectorAll<HTMLButtonElement>("[data-companion-hit]").forEach((button) => {
      button.style.visibility = "hidden";
      button.tabIndex = -1;
    });
    for (const cleanup of cleanups.reverse()) safely(cleanup);
    cleanups.length = 0;
    const geometries = new Set<THREE.BufferGeometry>();
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        geometries.add(object.geometry);
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => ownedMaterials.add(material));
      }
    });
    geometries.forEach((geometry) => safely(() => geometry.dispose()));
    ownedMaterials.forEach((material) => safely(() => material.dispose()));
    ownedMaterials.clear();
    scene.clear();
  };
  const fail = () => { host.dataset.renderer = "fallback"; dispose(); };
  try {
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "low-power" });
    cleanups.push(() => renderer.forceContextLoss(), () => renderer.dispose());
    renderer.setClearColor(0, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.28;
    const camera = new THREE.OrthographicCamera(-3, 3, 5, -5, .1, 100);
    camera.position.z = 30;
    const css = getComputedStyle(rail);
    // Resolve the site's OKLCH token to sRGB once; Three.Color accepts sRGB, not CSS Lab.
    const swatch = document.createElement("canvas"); swatch.width = swatch.height = 1;
    const context = swatch.getContext("2d", { willReadFrequently: true });
    let paper = "#f7f1e9";
    if (context) {
      context.fillStyle = css.getPropertyValue("--color-bone").trim();
      context.fillRect(0, 0, 1, 1);
      const [r, g, b] = context.getImageData(0, 0, 1, 1).data;
      paper = `rgb(${r}, ${g}, ${b})`;
    }
    const materials = createTimelineMaterials(css.getPropertyValue("--timeline-copper").trim(), paper);
    Object.values(materials).forEach((material) => ownedMaterials.add(material));
    scene.add(new THREE.HemisphereLight("#fffaf0", "#887460", 2.5));
    const key = new THREE.DirectionalLight("#fff6df", 4.1); key.position.set(-4, 7, 10); scene.add(key);
    const fill = new THREE.DirectionalLight("#e0e7eb", 2.2); fill.position.set(6, -3, 5); scene.add(fill);
    const assemblies = records.map((record) => {
      const model = createTimelineModel(record, materials);
      scene.add(model.group);
      return { ...model, record, amount: 0, operationPhase: 0, operationWork: 0, y: 0, x: 0, element: rail.querySelector<HTMLElement>(`[data-timeline-id="${record.id}"]`)! };
    });
    const trackGroup = new THREE.Group(); scene.add(trackGroup);
    const companion = createTimelineCompanion(materials);
    companion.group.rotation.set(.08, -.3, -.03);
    scene.add(companion.group);
    const beak = companion.group.getObjectByName("timeline-companion-contact");
    const hit = host.querySelector<HTMLButtonElement>("[data-companion-hit]");
    const modelZone = host.querySelector<HTMLElement>(".timeline-stage__model-zone")!;
    const section = rail.closest<HTMLElement>(".timeline-section")!;
    const dockPosition = new THREE.Vector3(), perchPosition = new THREE.Vector3();
    const flightPosition = new THREE.Vector3(), beakOffset = new THREE.Vector3();
    const worldContact = new THREE.Vector3(), normal = new THREE.Vector3();
    const goal = new THREE.Vector3();
    const projected = new THREE.Vector3(), targetRotation = new THREE.Quaternion();
    const rotation = new THREE.Euler(0, 0, 0, "YZX");
    const pointer = new THREE.Vector2();
    let pointerPresent = false, gazeX = 0, gazeY = 0;
    let trackCurve: THREE.CatmullRomCurve3 | null = null;
    let companionInitialized = false, flight = 0, working = 0, activityTime = 0;
    let docked: typeof assemblies[number] | undefined;
    let lastScrollAt = -Infinity, greetingAt = -Infinity, staticGreeting = false;
    let greetingPending = false;
    let excursion: THREE.CurvePath<THREE.Vector3> | null = null;
    let returnRoute: THREE.CurvePath<THREE.Vector3> | null = null;
    const routeTo = (start: THREE.Vector3, end: THREE.Vector3) => {
      const radius = Math.max(0, Math.min(.4, (start.y - end.y) / 2, (start.x - end.x) / 2));
      const lift = start.clone(); lift.z = end.z;
      const corner = new THREE.Vector3(start.x, end.y, end.z);
      const entry = corner.clone(); entry.y += radius;
      const exit = corner.clone(); exit.x -= radius;
      const route = new THREE.CurvePath<THREE.Vector3>();
      // Clear the artifact's front surface before moving across its silhouette.
      if (start.distanceTo(lift) > .001) route.add(new THREE.LineCurve3(start, lift));
      if (lift.distanceTo(entry) > .001) route.add(new THREE.LineCurve3(lift, entry));
      if (radius > .001) route.add(new THREE.QuadraticBezierCurve3(entry, corner, exit));
      if (exit.distanceTo(end) > .001) route.add(new THREE.LineCurve3(exit, end));
      if (!route.curves.length) route.add(new THREE.LineCurve3(start, end));
      return route;
    };
    const excursionStartRotation = new THREE.Quaternion();
    const excursionFacing = new THREE.Quaternion();
    const ease = (value: number) => {
      const t = THREE.MathUtils.clamp(value, 0, 1);
      return t * t * t * (t * (t * 6 - 15) + 10);
    };
    let state: State = { activeId: records[0]?.id ?? null, full: false };
    let visible = false, lost = false, lastTime = 0, time = 0;
    let scale = 100, width = 1, height = 1, zoneWidth = 1, modelCenter = 0, dirty = true;
    const clearTrack = () => {
      trackGroup.traverse((object) => { if (object instanceof THREE.Mesh) object.geometry.dispose(); });
      trackGroup.clear();
    };
    const measure = () => {
      const bounds = host.getBoundingClientRect();
      width = Math.max(1, bounds.width); height = Math.max(1, bounds.height);
      const zone = modelZone.getBoundingClientRect();
      zoneWidth = zone.width;
      scale = Math.min(170, Math.max(42, zoneWidth / 3.75), height / 4.2);
      modelCenter = (zone.left - bounds.left + zone.width / 2 - width / 2) / scale;
      // Canvas backing store is always one viewport tall, independently of document length.
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5, 2048 / Math.max(width, height)));
      renderer.setSize(width, height, false);
      camera.left = -width / scale / 2; camera.right = -camera.left;
      camera.top = height / scale / 2; camera.bottom = -camera.top;
      camera.updateProjectionMatrix();
      const railTop = rail.getBoundingClientRect().top;
      assemblies.forEach((item, index) => {
        const rect = item.element.getBoundingClientRect();
        item.y = -(rect.top - railTop + Math.min(rect.height * .42, 157)) / scale;
        item.x = modelCenter + Math.sin(index * 1.8) * .28;
        item.group.position.set(item.x, item.y, .2 + Math.sin(index * 1.4) * .16);
      });
      const points = assemblies.map((item, index) => new THREE.Vector3(item.x, item.y, -.25 + Math.sin(index * 1.4) * .16));
      if (!points.length) return;
      points.unshift(points[0]!.clone().add(new THREE.Vector3(-.13, 1.1, -.2)));
      points.push(points[points.length - 1]!.clone().add(new THREE.Vector3(.15, -1.25, .15)));
      const curve = new THREE.CatmullRomCurve3(points, false, "catmullrom", .25);
      trackCurve = curve;
      clearTrack();
      const base = new THREE.Mesh(ribbonGeometry(curve, .23, .15), materials.edge); trackGroup.add(base);
      const top = new THREE.Mesh(ribbonGeometry(curve, .14, .08), materials.copper); top.position.z = .09; trackGroup.add(top);
      dirty = false;
    };
    const draw = (stamp: number) => {
      raf = 0;
      if (disposed || lost || !visible || document.hidden) { canvas.dataset.animating = "false"; return; }
      try {
        if (dirty) {
          // Layout changes invalidate the world-space route; resume from the
          // current pose instead of playing coordinates from the old viewport.
          excursion = null; returnRoute = null; greetingPending = false; greetingAt = -Infinity;
          measure();
        }
        const delta = Math.min((stamp - (lastTime || stamp)) / 1000, .04); lastTime = stamp;
        if (state.full) time += delta;
        const hostBounds = host.getBoundingClientRect();
        const railBounds = rail.getBoundingClientRect();
        const headerBounds = section.querySelector<HTMLElement>(".archive-section__header")?.getBoundingClientRect();
        camera.position.y = -(hostBounds.top - railBounds.top + height / 2) / scale;
        camera.updateMatrixWorld();
        // Reading position owns translation, even after scrolling stops. Docking is
        // a spatial blend with separate enter/exit radii, never a timeout snap.
        const readingY = -(window.innerHeight * .42 - railBounds.top) / scale;
        const nearest = assemblies.reduce<typeof assemblies[number] | undefined>((best, item) =>
          !best || Math.abs(item.y - readingY) < Math.abs(best.y - readingY) ? item : best, undefined);
        const gap = assemblies.length > 1 ? Math.min(...assemblies.slice(1).map((item, i) => Math.abs(item.y - assemblies[i]!.y))) : 3;
        const enterRadius = Math.min(.82, gap * .22), exitRadius = Math.min(1.15, gap * .32);
        if (docked && Math.abs(docked.y - readingY) > exitRadius) docked = undefined;
        if (!docked && nearest && Math.abs(nearest.y - readingY) < enterRadius) {
          docked = nearest;
          activityTime = 0;
        }
        const docking = docked ? 1 - THREE.MathUtils.smoothstep(Math.abs(docked.y - readingY), enterRadius * .65, enterRadius) : 0;
        const scrolling = state.full && stamp - lastScrollAt < 140;
        const greetingAge = state.full ? time - greetingAt : 1.8;
        const greeting = state.full ? Math.sin(Math.PI * THREE.MathUtils.clamp(greetingAge / 3.6, 0, 1)) ** 2 : staticGreeting ? .7 : 0;
        if (greetingAge >= 3.6 && excursion) {
          excursion = null; returnRoute = null;
          // A completed greeting settles on the perch, then begins a fresh
          // inspection rather than reaching for an old, already closed page.
          activityTime = 0;
        }
        const interacting = state.full ? greetingPending || excursion !== null : staticGreeting;
        if (state.full && working > .6 && !scrolling && !interacting) activityTime += delta;
        const cycleDuration = docked?.record.kind === "EDUCATION" ? 7.2 : docked?.record.kind === "PREPARATION" ? 6.1 : 5.4;
        const phase = activityTime / cycleDuration;
        const activity = timelineActivity(phase);
        assemblies.forEach((item, index) => {
          const target = item.record.id === state.activeId ? 1 : 0;
          item.amount = state.full ? THREE.MathUtils.damp(item.amount, target, 8, delta) : target;
          if (item === docked) {
            item.operationPhase = phase;
            item.operationWork = working;
          } else item.operationWork = state.full ? THREE.MathUtils.damp(item.operationWork, 0, 9, delta) : 0;
          item.animate(item.amount, state.full ? Math.sin(time * .7 + index) : 0, item.operationPhase, state.full ? item.operationWork : 0);
        });
        if (trackCurve && nearest) {
          const visitorScale = zoneWidth < 180 ? .72 : zoneWidth < 300 ? 1 : 1.15;
          companion.group.scale.setScalar(visitorScale);
          let low = 0, high = 1;
          for (let i = 0; i < 14; i++) {
            const middle = (low + high) / 2;
            if (trackCurve.getPoint(middle).y > readingY) low = middle;
            else high = middle;
          }
          trackCurve.getPoint((low + high) / 2, flightPosition);
          flightPosition.x -= .62;
          flightPosition.z = 3;
          flightPosition.y += state.full ? Math.sin(time * 2.2) * .025 : 0;
          // A front / three-quarter resting pose; transit and contact have their
          // own volumetric orientation, interpolated as quaternions.
          let yaw = -Math.PI / 2 + .6 * Math.sin(time * .45);
          let pitch = 0;
          const reach = state.full ? activity.reach * working : 0;
          if (docked) {
            docked.group.updateMatrixWorld(true);
            worldContact.copy(docked.contact); docked.group.localToWorld(worldContact);
            perchPosition.copy(docked.perch); docked.group.localToWorld(perchPosition);
            normal.set(0, 0, 1).applyQuaternion(docked.group.quaternion);
            const workYaw = Math.atan2(normal.z, -normal.x);
            // Turn toward the task before reaching. Between pulls the torso
            // remains oblique to the page; only the neck looks around, avoiding
            // a repeated 180-degree whole-body swivel every cycle.
            const poisedYaw = workYaw - .65 * (1 - activity.orient * working);
            yaw += Math.atan2(Math.sin(poisedYaw - yaw), Math.cos(poisedYaw - yaw)) * docking;
            pitch = Math.asin(-normal.y) * activity.orient * working;
          }
          if (interacting) {
            // One short excursion through the open left margin. It remains in this
            // renderer, has no page-scroll side effects and can be interrupted.
            // One outward look, one turn home. No oscillating whole-body yaw.
            const turn = ease((greetingAge - 1.45) / .65);
            yaw = THREE.MathUtils.lerp(-Math.PI + .25, -.25, turn);
            pitch = -.09 * Math.sin(Math.PI * THREE.MathUtils.clamp(greetingAge / 3.6, 0, 1));
          } else if (scrolling) pitch = THREE.MathUtils.clamp((flightPosition.y - companion.group.position.y) * .16, -.3, .3);
          rotation.set(0, yaw, pitch, "YZX");
          targetRotation.setFromEuler(rotation);
          if (interacting && state.full) {
            excursionFacing.copy(targetRotation);
            targetRotation.copy(excursionStartRotation).slerp(excursionFacing,
              ease(greetingAge / .65) * (1 - ease((greetingAge - 2.9) / .7)));
          }
          if (!companionInitialized || !state.full) companion.group.quaternion.copy(targetRotation);
          else companion.group.quaternion.slerp(targetRotation, 1 - Math.exp(-delta * 9));
          projected.copy(companion.group.position).project(camera);
          const birdX = hostBounds.left + (projected.x + 1) * width / 2;
          const birdY = hostBounds.top + (1 - projected.y) * height / 2;
          const pointerWeight = pointerPresent && !interacting ? 1 - reach : 0;
          gazeX = THREE.MathUtils.damp(gazeX, pointerWeight * THREE.MathUtils.clamp((pointer.x - birdX) / 240, -1, 1), 6, delta);
          gazeY = THREE.MathUtils.damp(gazeY, pointerWeight * THREE.MathUtils.clamp((birdY - pointer.y) / 180, -1, 1), 6, delta);
          companion.animate(state.full ? time : 0, state.full ? flight : 0, phase, state.full ? working : 0, { gazeX, gazeY, greeting, handlingLeaf: docked?.record.kind === "EDUCATION" });
          companion.group.updateMatrixWorld(true);
          if (beak) { beak.getWorldPosition(beakOffset); beakOffset.sub(companion.group.position); }
          else beakOffset.set(.4, .25, 0);
          goal.copy(flightPosition);
          if (docked) {
            dockPosition.copy(worldContact).sub(beakOffset);
            // Approach the front surface from its outward normal, not through the
            // solid artifact. Only the actual beak tip reaches the moving surface.
            dockPosition.addScaledVector(normal, Math.sin(Math.PI * reach) * .24);
            perchPosition.lerp(dockPosition, reach);
            goal.lerp(perchPosition, docking);
            goal.z += Math.sin(Math.PI * docking) * .5;
          }
          // Keep the full wing span out of semantic text and the sticky heading.
          // DOM obstacles are measured in the same coordinate space as the camera.
          const safe = visitorScale * .55;
          goal.x = THREE.MathUtils.clamp(goal.x, camera.left + safe, modelCenter + zoneWidth / scale * .35 - safe);
          goal.y = THREE.MathUtils.clamp(goal.y, camera.position.y + camera.bottom + safe, camera.position.y + camera.top - safe * 1.5);
          if (headerBounds && width > 750) {
            const rect = headerBounds;
            const right = (rect.right - hostBounds.left - width / 2) / scale + safe;
            const bottom = camera.position.y + (height / 2 - (rect.bottom - hostBounds.top)) / scale - safe;
            if (goal.x < right && (goal.y > bottom || companion.group.position.y > bottom)) goal.x = right;
            if (companionInitialized && companion.group.position.x < right - .02 && goal.y > bottom) goal.y = bottom;
          }
          if (greetingPending) {
            // Plan once, with a rounded corner below the heading. The entire
            // route has one owner; per-frame obstacle feedback cannot flip it.
            const start = companion.group.position.clone();
            const bottom = camera.position.y + camera.bottom + safe;
            const headingBottom = headerBounds && width > 750
              ? camera.position.y + (height / 2 - (headerBounds.bottom - hostBounds.top)) / scale - safe
              : start.y;
            const end = start.clone();
            end.x = Math.max(camera.left + safe, start.x - Math.min(2.6, (modelCenter - camera.left) * .46));
            end.y = Math.max(bottom, Math.min(start.y - .75, headingBottom - .65));
            end.z = Math.max(start.z, 3.8);
            // If the short viewport has no space below the heading, stay in the
            // model corridor instead of crossing the DOM text.
            if (end.y > headingBottom && headerBounds && width > 750) end.x = start.x;
            excursion = routeTo(start, end);
            const landing = docking > .94 && docked
              ? docked.group.localToWorld(docked.perch.clone()) : start.clone();
            returnRoute = routeTo(landing, end);
            greetingPending = false;
          }
          if (excursion) {
            const travel = greetingAge < 1.5 ? ease(greetingAge / 1.5)
              : greetingAge < 2.1 ? 1 : 1 - ease((greetingAge - 2.1) / 1.5);
            (greetingAge > 2.1 && returnRoute ? returnRoute : excursion).getPointAt(travel, goal);
          }
          if (!companionInitialized || !state.full) {
            companion.group.position.copy(goal); companionInitialized = true;
          } else {
            // Continuous convergence survives reversals and cancelled greetings.
            companion.group.position.lerp(goal, 1 - Math.exp(-delta * (scrolling ? 12 : 9 + activity.grip * working * 7)));

          }
          if (docked && docking > .99 && reach > .999 && !interacting) companion.settleContact(worldContact, activity.grip * working);
          if (beak && docked && activity.grip > .99 && working > .99) {
            beak.getWorldPosition(beakOffset);
            canvas.dataset.companionContactError = beakOffset.distanceTo(worldContact).toFixed(4);
          } else delete canvas.dataset.companionContactError;
          const distance = companion.group.position.distanceTo(goal);
          const airborne = docking < .95 || scrolling || interacting || distance > .18 || reach > .03;
          flight = state.full ? THREE.MathUtils.damp(flight, airborne ? 1 : 0, 9, delta) : 0;
          // Work eligibility must not depend on distance to a goal that work
          // itself moves; that feedback repeatedly retracted the beak on return.
          working = state.full ? THREE.MathUtils.damp(working, docking > .94 && !scrolling && !interacting ? 1 : 0, 7, delta) : 0;
          // The single projected hit area belongs to the bird, never the artifacts.
          projected.copy(companion.group.position); projected.y += visitorScale * .22; projected.project(camera);
          const x = (projected.x + 1) * width / 2, y = (1 - projected.y) * height / 2;
          if (hit) {
            const size = Math.max(44, scale * visitorScale * .83);
            hit.style.width = hit.style.height = `${size}px`;
            hit.style.transform = `translate(${x - size / 2}px, ${y - size / 2}px)`;
            const onScreen = y > 0 && y < height && hostBounds.top + y > 0 && hostBounds.top + y < window.innerHeight;
            hit.style.visibility = onScreen ? "visible" : "hidden";
            hit.tabIndex = onScreen ? 0 : -1;
          }
          canvas.dataset.companionRecord = docked?.record.id ?? "between";
          canvas.dataset.companionState = !state.full ? "static" : interacting ? "greeting" : docking < .01 ? "hovering" : airborne ? "flying" : "working";
          canvas.dataset.companionCycle = phase.toFixed(2);
          canvas.dataset.companionGesture = activity.grip > .99 ? "holding" : activity.release > .1 ? "releasing" : activity.reach > .1 ? "approaching" : "observing";
          canvas.dataset.companionFlight = flight.toFixed(2);
          canvas.dataset.companionDock = docking.toFixed(3);
          canvas.dataset.companionPosition = companion.group.position.toArray().map((value) => value.toFixed(3)).join(",");
          canvas.dataset.companionYaw = yaw.toFixed(3);
          canvas.dataset.companionGreeting = greeting.toFixed(3);
          canvas.dataset.companionInteraction = interacting ? greetingAge < 1.5 ? "outbound" : greetingAge < 2.1 ? "turning" : "returning" : "idle";
          canvas.dataset.companionGaze = `${gazeX.toFixed(2)},${gazeY.toFixed(2)}`;
        }
        renderer.render(scene, camera);
        canvas.dataset.frames = String(Number(canvas.dataset.frames || 0) + 1);
        canvas.dataset.animating = String(state.full);
        host.dataset.renderer = "ready";
        if (state.full) raf = requestAnimationFrame(draw);
      } catch (error) { host.dataset.rendererError = error instanceof Error ? error.message : String(error); fail(); }
    };
    const schedule = () => { if (!raf && visible && !document.hidden && !lost && !disposed) raf = requestAnimationFrame(draw); };
    const pause = () => {
      cancelAnimationFrame(raf); raf = 0; lastTime = 0; canvas.dataset.animating = "false";
      if (hit && (!visible || document.hidden || lost)) { hit.style.visibility = "hidden"; hit.tabIndex = -1; }
    };
    const resize = new ResizeObserver(() => { dirty = true; schedule(); });
    cleanups.push(() => resize.disconnect());
    resize.observe(host); resize.observe(rail); assemblies.forEach((item) => resize.observe(item.element));
    const visibility = new IntersectionObserver(([entry]) => { visible = !!entry?.isIntersecting; if (visible) schedule(); else pause(); });
    cleanups.push(() => visibility.disconnect());
    visibility.observe(host);
    const pageVisibility = () => { if (document.hidden) pause(); else schedule(); };
    const contextLost = (event: Event) => { event.preventDefault(); lost = true; pause(); host.dataset.renderer = "fallback"; };
    const contextRestored = () => { lost = false; dirty = true; schedule(); };
    const onScroll = () => { lastScrollAt = performance.now(); greetingAt = -Infinity; greetingPending = false; excursion = null; returnRoute = null; staticGreeting = false; schedule(); };
    const onPointer = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      pointer.set(event.clientX, event.clientY); pointerPresent = true;
      // STATIC stays event-driven; pointer motion does not restart animation.
      if (state.full) schedule();
    };
    const onLeave = () => { pointerPresent = false; };
    const onGreeting = () => {
      if (state.full) {
        if (!excursion && !greetingPending) {
          greetingAt = time; greetingPending = true;
          excursionStartRotation.copy(companion.group.quaternion);
        }
      }
      else staticGreeting = !staticGreeting;
      schedule();
    };
    section.addEventListener("pointermove", onPointer, { passive: true });
    section.addEventListener("pointerleave", onLeave);
    hit?.addEventListener("click", onGreeting);
    cleanups.push(() => section.removeEventListener("pointermove", onPointer), () => section.removeEventListener("pointerleave", onLeave), () => hit?.removeEventListener("click", onGreeting));
    window.addEventListener("scroll", onScroll, { passive: true });
    cleanups.push(() => window.removeEventListener("scroll", onScroll));
    const onResize = () => { dirty = true; schedule(); };
    window.addEventListener("resize", onResize, { passive: true });
    cleanups.push(() => window.removeEventListener("resize", onResize));
    document.addEventListener("visibilitychange", pageVisibility);
    cleanups.push(() => document.removeEventListener("visibilitychange", pageVisibility));
    canvas.addEventListener("webglcontextlost", contextLost);
    cleanups.push(() => canvas.removeEventListener("webglcontextlost", contextLost));
    canvas.addEventListener("webglcontextrestored", contextRestored);
    cleanups.push(() => canvas.removeEventListener("webglcontextrestored", contextRestored));
    return {
      update(next) { if (disposed) return; state = next; if (!state.full) { pause(); greetingAt = -Infinity; greetingPending = false; excursion = null; returnRoute = null; working = 0; } schedule(); },
      dispose,
    };
  } catch (error) {
    fail();
    throw error;
  }
}
