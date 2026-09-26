/**
 * WebGL version of the hero figure. Points carry a per-point spread that is
 * drawn as a soft halo and a slow wobble (read it as posterior samples); the
 * scene morphs between structures and tilts slightly with the pointer. There
 * is no constant rotation, and rendering stops when the figure is off screen.
 */
import {
  BufferAttribute,
  BufferGeometry,
  Color,
  Group,
  LineBasicMaterial,
  LineSegments,
  PerspectiveCamera,
  Points,
  Scene,
  ShaderMaterial,
  WebGLRenderer,
} from 'three';
import { getStructures, POINT_COUNT, SIGMA_ACCENT, VIEW, type StructureId } from '@/lib/structures';

export interface HeroScene {
  setStructure(id: StructureId): void;
  setRunning(running: boolean): void;
  destroy(): void;
}

interface Callbacks {
  onReady(): void;
  onLost(): void;
}

const MORPH_MS = 1800;

const vertexShader = /* glsl */ `
  attribute float sigma;
  attribute float seed;
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uViewportH;
  uniform float uFocal;
  uniform float uThreshold;
  varying float vAccent;
  varying float vCore;
  varying float vHalo;
  varying float vFade;

  void main() {
    vec3 p = position;
    p += 0.45 * sigma * vec3(
      sin(uTime * 0.61 + seed * 12.9),
      sin(uTime * 0.47 + seed * 7.1),
      sin(uTime * 0.53 + seed * 3.7)
    );
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    float depth = -mv.z;
    float ppu = uFocal * 0.5 * uViewportH / depth;
    float haloPx = max(2.4, sigma * ppu * 1.6);
    float radiusPx = haloPx + 1.5;
    gl_PointSize = radiusPx * 2.0 * uPixelRatio;
    vAccent = smoothstep(uThreshold * 0.92, uThreshold * 1.08, sigma);
    vCore = mix(1.5, 1.8, vAccent) / radiusPx;
    vHalo = haloPx / radiusPx;
    vFade = clamp(1.25 - (depth - ${VIEW.distance.toFixed(2)}) * 0.55, 0.45, 1.0);
    gl_Position = projectionMatrix * mv;
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uInk;
  uniform vec3 uAccent;
  varying float vAccent;
  varying float vCore;
  varying float vHalo;
  varying float vFade;

  void main() {
    float d = length(gl_PointCoord * 2.0 - 1.0);
    if (d > 1.0) discard;
    float aa = 0.08;
    float core = 1.0 - smoothstep(vCore - aa, vCore + aa, d);
    float halo = (1.0 - smoothstep(vHalo * 0.25, vHalo, d)) * mix(0.08, 0.17, vAccent);
    vec3 color = mix(uInk, uAccent, vAccent);
    float alpha = max(core * vFade, halo);
    gl_FragColor = vec4(color, alpha);
  }
`;

function readColor(el: HTMLElement, name: string, fallback: string): Color {
  const value = getComputedStyle(el).getPropertyValue(name).trim();
  return new Color(value || fallback);
}

const easeInOut = (t: number): number => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export function createHeroScene(container: HTMLElement, initial: StructureId, callbacks: Callbacks): HeroScene | null {
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  } catch {
    return null;
  }

  const structures = getStructures();
  const canvas = renderer.domElement;
  canvas.setAttribute('aria-hidden', 'true');
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  container.appendChild(canvas);

  const scene = new Scene();
  const camera = new PerspectiveCamera(VIEW.fov, 1, 0.1, 20);
  camera.position.set(0, 0, VIEW.distance);
  camera.lookAt(0, 0, 0);

  const group = new Group();
  group.rotation.set(VIEW.pitch, VIEW.yaw, 0);
  scene.add(group);

  // Points
  const start = structures[initial];
  const positions = Float32Array.from(start.points);
  const sigmas = Float32Array.from(start.sigma);
  const seeds = Float32Array.from({ length: POINT_COUNT }, (_, i) => ((i * 0.618034) % 1) * 1.0);
  const pointGeometry = new BufferGeometry();
  const positionAttr = new BufferAttribute(positions, 3);
  const sigmaAttr = new BufferAttribute(sigmas, 1);
  pointGeometry.setAttribute('position', positionAttr);
  pointGeometry.setAttribute('sigma', sigmaAttr);
  pointGeometry.setAttribute('seed', new BufferAttribute(seeds, 1));

  const focal = 1 / Math.tan((VIEW.fov * Math.PI) / 360);
  const pointMaterial = new ShaderMaterial({
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    uniforms: {
      uTime: { value: 0 },
      uPixelRatio: { value: renderer.getPixelRatio() },
      uViewportH: { value: 400 },
      uFocal: { value: focal },
      uThreshold: { value: SIGMA_ACCENT },
      uInk: { value: readColor(container, '--color-figure-ink', '#17181b') },
      uAccent: { value: readColor(container, '--color-accent', '#b0421b') },
    },
  });
  const points = new Points(pointGeometry, pointMaterial);
  points.frustumCulled = false;
  group.add(points);

  // Lines: one object per structure, cross-faded during morphs.
  const lineMaterials = new Map<StructureId, LineBasicMaterial>();
  const lineGeometries: BufferGeometry[] = [];
  for (const s of Object.values(structures)) {
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(s.segments, 3));
    const material = new LineBasicMaterial({
      color: readColor(container, '--color-figure-ink', '#17181b'),
      transparent: true,
      opacity: s.id === initial ? 0.32 : 0,
      depthWrite: false,
    });
    lineMaterials.set(s.id, material);
    lineGeometries.push(geometry);
    const lines = new LineSegments(geometry, material);
    lines.frustumCulled = false;
    group.add(lines);
  }

  // Morph state
  let current: StructureId = initial;
  let from = { points: Float32Array.from(start.points), sigma: Float32Array.from(start.sigma) };
  let morphStart = -1;

  const setStructure = (id: StructureId): void => {
    if (id === current && morphStart < 0) return;
    from = { points: Float32Array.from(positions), sigma: Float32Array.from(sigmas) };
    current = id;
    morphStart = performance.now();
    if (!running) renderOnce();
  };

  // Pointer parallax (fine pointers only)
  const finePointer = window.matchMedia('(pointer: fine)').matches;
  let targetYaw = 0;
  let targetPitch = 0;
  let yaw = 0;
  let pitch = 0;
  const onPointerMove = (event: PointerEvent): void => {
    targetYaw = (event.clientX / window.innerWidth - 0.5) * 0.32;
    targetPitch = (event.clientY / window.innerHeight - 0.5) * 0.14;
  };
  if (finePointer) window.addEventListener('pointermove', onPointerMove, { passive: true });

  // Sizing
  const resize = (): void => {
    const { width, height } = container.getBoundingClientRect();
    if (width === 0 || height === 0) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    pointMaterial.uniforms.uViewportH!.value = height;
    if (!running) renderOnce();
  };
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);

  const onTheme = (): void => {
    // Wait a frame so the new custom property values have been applied.
    requestAnimationFrame(() => {
      const ink = readColor(container, '--color-figure-ink', '#17181b');
      pointMaterial.uniforms.uInk!.value = ink;
      pointMaterial.uniforms.uAccent!.value = readColor(container, '--color-accent', '#b0421b');
      for (const material of lineMaterials.values()) material.color = ink;
      if (!running) renderOnce();
    });
  };
  window.addEventListener('themechange', onTheme);

  // Frame loop
  let running = false;
  let frame = 0;
  let readyFired = false;
  const t0 = performance.now();

  const update = (now: number): void => {
    pointMaterial.uniforms.uTime!.value = (now - t0) / 1000;

    if (morphStart >= 0) {
      const t = Math.min(1, (now - morphStart) / MORPH_MS);
      const e = easeInOut(t);
      const target = structures[current];
      for (let i = 0; i < positions.length; i++) {
        positions[i] = from.points[i]! + (target.points[i]! - from.points[i]!) * e;
      }
      for (let i = 0; i < sigmas.length; i++) {
        sigmas[i] = from.sigma[i]! + (target.sigma[i]! - from.sigma[i]!) * e;
      }
      positionAttr.needsUpdate = true;
      sigmaAttr.needsUpdate = true;
      for (const [id, material] of lineMaterials) {
        const goal = id === current ? 0.32 : 0;
        // Fade old lines out in the first half, new lines in during the second.
        material.opacity = id === current ? goal * Math.max(0, (e - 0.5) * 2) : Math.min(material.opacity, 0.32 * Math.max(0, 1 - e * 2));
      }
      if (t >= 1) morphStart = -1;
    }

    yaw += (targetYaw - yaw) * 0.05;
    pitch += (targetPitch - pitch) * 0.05;
    group.rotation.set(VIEW.pitch + pitch, VIEW.yaw + yaw, 0);
  };

  const renderOnce = (): void => {
    update(performance.now());
    renderer.render(scene, camera);
  };

  const loop = (now: number): void => {
    if (!running) return;
    update(now);
    renderer.render(scene, camera);
    if (!readyFired) {
      readyFired = true;
      callbacks.onReady();
    }
    frame = requestAnimationFrame(loop);
  };

  const setRunning = (next: boolean): void => {
    if (next === running) return;
    running = next;
    cancelAnimationFrame(frame);
    if (running) frame = requestAnimationFrame(loop);
  };

  let destroyed = false;
  const destroy = (): void => {
    if (destroyed) return;
    destroyed = true;
    running = false;
    cancelAnimationFrame(frame);
    resizeObserver.disconnect();
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('themechange', onTheme);
    window.removeEventListener('pagehide', onPageHide);
    canvas.removeEventListener('webglcontextlost', onContextLost);
    pointGeometry.dispose();
    pointMaterial.dispose();
    for (const g of lineGeometries) g.dispose();
    for (const m of lineMaterials.values()) m.dispose();
    renderer.dispose();
    canvas.remove();
  };

  const onPageHide = (event: PageTransitionEvent): void => {
    if (!event.persisted) destroy();
  };
  const onContextLost = (event: Event): void => {
    event.preventDefault();
    destroy();
    callbacks.onLost();
  };
  window.addEventListener('pagehide', onPageHide);
  canvas.addEventListener('webglcontextlost', onContextLost);

  resize();
  return { setStructure, setRunning, destroy };
}
