/**
 * Procedural point structures for the hero figure. The same deterministic
 * generator feeds the build-time SVG fallback and the WebGL scene, so the
 * canvas can fade in exactly on top of the static figure.
 *
 * Each structure has the same number of points so the WebGL scene can morph
 * between them. `sigma` is an illustrative per-point spread (not model output).
 */

import { gaussian, mulberry32 } from '@/lib/random';
import { STRUCTURE_IDS, type StructureId } from '@/lib/structure-ids';

export { STRUCTURE_IDS, type StructureId };

export interface Structure {
  id: StructureId;
  /** xyz triples, roughly inside the unit sphere. */
  points: Float32Array;
  /** Per-point spread in the same units as `points`. */
  sigma: Float32Array;
  /** Line segments as pairs of xyz endpoints (6 floats per segment). */
  segments: Float32Array;
}

export const POINT_COUNT = 168;

/** Points whose spread exceeds this are drawn in the accent colour. */
export const SIGMA_ACCENT = 0.055;

type Vec3 = [number, number, number];

const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const scale = (a: Vec3, s: number): Vec3 => [a[0] * s, a[1] * s, a[2] * s];
const length = (a: Vec3): number => Math.hypot(a[0], a[1], a[2]);
const normalize = (a: Vec3): Vec3 => scale(a, 1 / (length(a) || 1));
const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];

/** Orthonormal frame around an axis direction. */
function frame(axis: Vec3): [Vec3, Vec3] {
  const helper: Vec3 = Math.abs(axis[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  const u = normalize(cross(axis, helper));
  const v = normalize(cross(axis, u));
  return [u, v];
}

function cubicBezier(p0: Vec3, p1: Vec3, p2: Vec3, p3: Vec3, t: number): Vec3 {
  const s = 1 - t;
  const a = s * s * s;
  const b = 3 * s * s * t;
  const c = 3 * s * t * t;
  const d = t * t * t;
  return [
    a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0],
    a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1],
    a * p0[2] + b * p1[2] + c * p2[2] + d * p3[2],
  ];
}

/** Centre the cloud and scale it so its furthest point sits at `radius`. */
function fit(points: Vec3[], sigma: number[], segments: [Vec3, Vec3][], radius = 1): void {
  const centre: Vec3 = [0, 0, 0];
  for (const p of points) {
    centre[0] += p[0] / points.length;
    centre[1] += p[1] / points.length;
    centre[2] += p[2] / points.length;
  }
  let max = 0;
  for (const p of points) max = Math.max(max, length(sub(p, centre)));
  for (const [a, b] of segments) max = Math.max(max, length(sub(a, centre)), length(sub(b, centre)));
  const s = radius / (max || 1);
  const tx = (p: Vec3): Vec3 => scale(sub(p, centre), s);
  for (let i = 0; i < points.length; i++) points[i] = tx(points[i]!);
  for (let i = 0; i < sigma.length; i++) sigma[i] = sigma[i]! * s;
  for (let i = 0; i < segments.length; i++) {
    const [a, b] = segments[i]!;
    segments[i] = [tx(a), tx(b)];
  }
}

function pack(id: StructureId, points: Vec3[], sigma: number[], segments: [Vec3, Vec3][]): Structure {
  if (points.length !== POINT_COUNT) {
    throw new Error(`${id}: expected ${POINT_COUNT} points, got ${points.length}`);
  }
  // Order points by height so that point i of one structure and point i of the
  // next are at similar heights; morphs then read as a reorganisation rather
  // than an explosion.
  const order = points.map((_, i) => i).sort((a, b) => points[a]![1] - points[b]![1] || points[a]![0] - points[b]![0]);
  const p = new Float32Array(POINT_COUNT * 3);
  const sg = new Float32Array(POINT_COUNT);
  order.forEach((src, i) => {
    p.set(points[src]!, i * 3);
    sg[i] = sigma[src]!;
  });
  const seg = new Float32Array(segments.length * 6);
  segments.forEach(([a, b], i) => {
    seg.set(a, i * 6);
    seg.set(b, i * 6 + 3);
  });
  return { id, points: p, sigma: sg, segments: seg };
}

/**
 * A protein-like C-alpha trace: a Rossmann-like alpha/beta domain with five
 * parallel strands and five helices packed on both faces of the sheet. Geometry
 * uses real C-alpha spacing (helix: 100° and 1.5 Å rise per residue, radius
 * 2.3 Å; strand: 3.3 Å per residue) before scaling. Spread is low in secondary
 * structure and high in loops and termini, the way per-residue confidence
 * usually behaves.
 */
function backbone(): Structure {
  const rand = mulberry32(7);
  type Element = { kind: 'helix' | 'strand'; start: Vec3; end: Vec3; n: number };
  const strand = (x: number): Element => ({ kind: 'strand', start: [x, -10, 0], end: [x, 10, 0], n: 7 });
  const helix = (x: number, z: number): Element => ({ kind: 'helix', start: [x, 11, z], end: [x, -11, z], n: 14 });
  // Strand order across the sheet is 3-2-1-4-5; helices alternate between faces.
  const elements: Element[] = [
    strand(0),
    helix(-6, 11),
    strand(-4.8),
    helix(-8, -11),
    strand(-9.6),
    helix(4, 11),
    strand(4.8),
    helix(6, -11),
    strand(9.6),
    helix(14, 11),
  ];
  const coreCount = elements.reduce((sum, e) => sum + e.n, 0);
  const nTerm = 4;
  const cTerm = 5;
  const loopCount = elements.length - 1;
  const loopBudget = POINT_COUNT - coreCount - nTerm - cTerm;
  const perLoop = Math.floor(loopBudget / loopCount);
  const extra = loopBudget - perLoop * loopCount;

  const points: Vec3[] = [];
  const sigma: number[] = [];

  const emitElement = (e: Element): Vec3[] => {
    const axis = normalize(sub(e.end, e.start));
    const [u, v] = frame(axis);
    const out: Vec3[] = [];
    for (let i = 0; i < e.n; i++) {
      const t = e.n === 1 ? 0 : i / (e.n - 1);
      const base = add(e.start, scale(sub(e.end, e.start), t));
      if (e.kind === 'helix') {
        const angle = (i * 100 * Math.PI) / 180;
        out.push(add(base, add(scale(u, 2.3 * Math.cos(angle)), scale(v, 2.3 * Math.sin(angle)))));
      } else {
        out.push(add(base, scale(u, i % 2 === 0 ? 0.9 : -0.9)));
      }
    }
    return out;
  };

  const emitLoop = (from: Vec3, to: Vec3, fromDir: Vec3, toDir: Vec3, n: number): Vec3[] => {
    const out: Vec3[] = [];
    const reach = Math.max(5, length(sub(to, from)) * 0.55);
    const c1 = add(from, scale(fromDir, reach));
    const c2 = sub(to, scale(toDir, reach));
    for (let i = 1; i <= n; i++) {
      const t = i / (n + 1);
      const p = cubicBezier(from, c1, c2, to, t);
      out.push(add(p, [gaussian(rand) * 0.5, gaussian(rand) * 0.5, gaussian(rand) * 0.5]));
    }
    return out;
  };

  const traces = elements.map(emitElement);
  const first = traces[0]!;
  const firstDir = normalize(sub(first[1]!, first[0]!));
  for (let i = nTerm; i >= 1; i--) {
    points.push(add(first[0]!, add(scale(firstDir, -3.4 * i), [gaussian(rand) * 1.2, 0, gaussian(rand) * 1.2])));
    sigma.push(0.9 + 0.35 * i);
  }
  traces.forEach((trace, k) => {
    const kind = elements[k]!.kind;
    trace.forEach((p, i) => {
      points.push(p);
      const edge = Math.min(i, trace.length - 1 - i);
      sigma.push((kind === 'helix' ? 0.35 : 0.45) + (edge < 1 ? 0.25 : 0));
    });
    const next = traces[k + 1];
    if (next) {
      const n = perLoop + (k < extra ? 1 : 0);
      const from = trace[trace.length - 1]!;
      const to = next[0]!;
      const fromDir = normalize(sub(from, trace[trace.length - 2]!));
      const toDir = normalize(sub(next[1]!, to));
      emitLoop(from, to, fromDir, toDir, n).forEach((p, i) => {
        points.push(p);
        const mid = 1 - Math.abs(i / Math.max(1, n - 1) - 0.5) * 2;
        sigma.push(1.1 + 1.2 * mid);
      });
    }
  });
  const last = traces[traces.length - 1]!;
  const lastDir = normalize(sub(last[last.length - 1]!, last[last.length - 2]!));
  for (let i = 1; i <= cTerm; i++) {
    points.push(add(last[last.length - 1]!, add(scale(lastDir, 3.4 * i), [gaussian(rand) * 1.2, gaussian(rand) * 1.2, 0])));
    sigma.push(0.9 + 0.4 * i);
  }

  const segments: [Vec3, Vec3][] = [];
  for (let i = 1; i < points.length; i++) segments.push([points[i - 1]!, points[i]!]);
  fit(points, sigma, segments, 1);
  return pack('backbone', points, sigma, segments);
}

/**
 * A small multi-view scene: a ground patch, a box and a cylinder observed by
 * four cameras. Spread grows with distance from the cameras and on surfaces
 * that face away from them, which is where a feed-forward geometry model has
 * the least support.
 */
function scene(): Structure {
  const rand = mulberry32(21);
  const points: Vec3[] = [];
  const sigma: number[] = [];

  const cameras: { centre: Vec3; target: Vec3 }[] = [
    { centre: [-1.9, 1.3, 1.6], target: [0, 0.3, 0] },
    { centre: [-0.4, 1.5, 2.4], target: [0, 0.3, 0] },
    { centre: [1.6, 1.4, 2.0], target: [0, 0.3, 0] },
    { centre: [2.4, 1.2, 0.4], target: [0, 0.3, 0] },
  ];

  const support = (p: Vec3, normal: Vec3): number => {
    let best = 0;
    for (const c of cameras) {
      const toCam = normalize(sub(c.centre, p));
      const facing = normal[0] * toCam[0] + normal[1] * toCam[1] + normal[2] * toCam[2];
      best = Math.max(best, facing);
    }
    return best;
  };
  const spread = (p: Vec3, normal: Vec3): number => {
    const dist = Math.min(...cameras.map((c) => length(sub(c.centre, p))));
    return 0.04 + 0.018 * dist + 0.35 * Math.max(0, 0.3 - support(p, normal));
  };

  // Ground patch (jittered grid)
  const groundN = 64;
  for (let i = 0; i < groundN; i++) {
    const gx = (i % 8) / 7 - 0.5;
    const gz = Math.floor(i / 8) / 7 - 0.5;
    const p: Vec3 = [gx * 2.6 + gaussian(rand) * 0.04, 0, gz * 2.2 + gaussian(rand) * 0.04];
    points.push(p);
    sigma.push(spread(p, [0, 1, 0]));
  }
  // Box: five visible-ish faces
  const boxN = 60;
  const box = { min: [-1.1, 0, -0.9] as Vec3, max: [0.2, 1.2, 0.3] as Vec3 };
  const faces: { normal: Vec3; sample: () => Vec3 }[] = [
    { normal: [0, 1, 0], sample: () => [lerp(box.min[0], box.max[0], rand()), box.max[1], lerp(box.min[2], box.max[2], rand())] },
    { normal: [0, 0, 1], sample: () => [lerp(box.min[0], box.max[0], rand()), lerp(0, box.max[1], rand()), box.max[2]] },
    { normal: [1, 0, 0], sample: () => [box.max[0], lerp(0, box.max[1], rand()), lerp(box.min[2], box.max[2], rand())] },
    { normal: [-1, 0, 0], sample: () => [box.min[0], lerp(0, box.max[1], rand()), lerp(box.min[2], box.max[2], rand())] },
    { normal: [0, 0, -1], sample: () => [lerp(box.min[0], box.max[0], rand()), lerp(0, box.max[1], rand()), box.min[2]] },
  ];
  for (let i = 0; i < boxN; i++) {
    const face = faces[i % faces.length]!;
    const p = face.sample();
    points.push(p);
    sigma.push(spread(p, face.normal));
  }
  // Cylinder
  const cylN = POINT_COUNT - groundN - boxN;
  for (let i = 0; i < cylN; i++) {
    const a = (i / cylN) * Math.PI * 2 * 3 + rand() * 0.2;
    const h = (i / cylN) * 0.8;
    const normal: Vec3 = [Math.cos(a), 0, Math.sin(a)];
    const p: Vec3 = [0.95 + 0.34 * Math.cos(a), h, 0.55 + 0.34 * Math.sin(a)];
    points.push(p);
    sigma.push(spread(p, normal));
  }

  // Camera frustums: apex plus a small image rectangle
  const segments: [Vec3, Vec3][] = [];
  for (const c of cameras) {
    const forward = normalize(sub(c.target, c.centre));
    const right = normalize(cross(forward, [0, 1, 0]));
    const up = normalize(cross(right, forward));
    const depth = 0.36;
    const w = 0.2;
    const h = 0.13;
    const centre = add(c.centre, scale(forward, depth));
    const corners: Vec3[] = [
      add(centre, add(scale(right, -w), scale(up, h))),
      add(centre, add(scale(right, w), scale(up, h))),
      add(centre, add(scale(right, w), scale(up, -h))),
      add(centre, add(scale(right, -w), scale(up, -h))),
    ];
    for (let k = 0; k < 4; k++) {
      segments.push([c.centre, corners[k]!]);
      segments.push([corners[k]!, corners[(k + 1) % 4]!]);
    }
  }
  fit(points, sigma, segments, 1.0);
  return pack('scene', points, sigma, segments);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Six agents moving on a plane, drawn in space-time (time runs upward).
 * Spread grows with the prediction horizon.
 */
function agents(): Structure {
  const rand = mulberry32(5);
  const count = 6;
  const steps = POINT_COUNT / count;
  const points: Vec3[] = [];
  const sigma: number[] = [];
  const segments: [Vec3, Vec3][] = [];
  const phases = Array.from({ length: count }, (_, k) => (k / count) * Math.PI * 2 + rand() * 0.4);
  for (let k = 0; k < count; k++) {
    const r0 = 0.6 + rand() * 0.5;
    const drift = (rand() - 0.5) * 0.9;
    const swirl = 0.8 + rand() * 0.9;
    let prev: Vec3 | null = null;
    for (let s = 0; s < steps; s++) {
      const t = s / (steps - 1);
      const a = phases[k]! + drift * t * Math.PI + Math.sin(t * swirl * Math.PI) * 0.5;
      const r = r0 * (1 - 0.45 * Math.sin(t * Math.PI));
      const p: Vec3 = [r * Math.cos(a), -1.1 + 2.2 * t, r * Math.sin(a)];
      points.push(p);
      sigma.push(0.012 + 0.11 * t * t);
      if (prev) segments.push([prev, p]);
      prev = p;
    }
  }
  fit(points, sigma, segments, 1);
  return pack('agents', points, sigma, segments);
}

let cache: Record<StructureId, Structure> | null = null;

export function getStructures(): Record<StructureId, Structure> {
  cache ??= { backbone: backbone(), scene: scene(), agents: agents() };
  return cache;
}

/* ---- Shared camera, so SVG and WebGL render identical views ---- */

export const VIEW = {
  fov: 34,
  distance: 3.6,
  /** Model rotation in radians applied before projection. */
  yaw: -0.5,
  pitch: 0.28,
};

/** Rotate a point by the view's yaw (around y) then pitch (around x). */
export function rotate(p: Vec3, yaw = VIEW.yaw, pitch = VIEW.pitch): Vec3 {
  const cy = Math.cos(yaw);
  const sy = Math.sin(yaw);
  const x1 = p[0] * cy + p[2] * sy;
  const z1 = -p[0] * sy + p[2] * cy;
  const cp = Math.cos(pitch);
  const sp = Math.sin(pitch);
  const y2 = p[1] * cp - z1 * sp;
  const z2 = p[1] * sp + z1 * cp;
  return [x1, y2, z2];
}

/**
 * Perspective projection matching a three.js PerspectiveCamera at
 * (0, 0, VIEW.distance) looking at the origin. Returns pixel coordinates for a
 * viewport of the given size plus the view-space depth.
 */
export function project(p: Vec3, width: number, height: number): { x: number; y: number; depth: number } {
  const [x, y, z] = rotate(p);
  const zc = VIEW.distance - z;
  const f = 1 / Math.tan((VIEW.fov * Math.PI) / 360);
  const aspect = width / height;
  const ndcX = (f / aspect) * (x / zc);
  const ndcY = f * (y / zc);
  return { x: (ndcX + 1) * 0.5 * width, y: (1 - ndcY) * 0.5 * height, depth: zc };
}

/** Pixels per world unit at view depth `zc` for a viewport of `height` px. */
export function pixelsPerUnit(zc: number, height: number): number {
  const f = 1 / Math.tan((VIEW.fov * Math.PI) / 360);
  return (f / zc) * 0.5 * height;
}
