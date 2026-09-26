import { describe, expect, it } from 'vitest';
import { getStructures, POINT_COUNT, project, STRUCTURE_IDS } from '@/lib/structures';

describe('hero structures', () => {
  const structures = getStructures();

  it('share one point count so the scene can morph between them', () => {
    for (const id of STRUCTURE_IDS) {
      expect(structures[id].points.length).toBe(POINT_COUNT * 3);
      expect(structures[id].sigma.length).toBe(POINT_COUNT);
      expect(structures[id].segments.length % 6).toBe(0);
    }
  });

  it('are finite, bounded and have positive spread', () => {
    for (const id of STRUCTURE_IDS) {
      const s = structures[id];
      for (let i = 0; i < POINT_COUNT; i++) {
        const r = Math.hypot(s.points[i * 3]!, s.points[i * 3 + 1]!, s.points[i * 3 + 2]!);
        expect(Number.isFinite(r)).toBe(true);
        expect(r).toBeLessThanOrEqual(1.25);
        expect(s.sigma[i]).toBeGreaterThan(0);
      }
    }
  });

  it('project inside the hero stage with a margin, cameras included, at any pointer tilt', () => {
    const margin = 8;
    // The WebGL parallax tilts by at most ±0.16 rad of yaw and ±0.07 rad of pitch.
    const tilts = [{}, { yaw: 0.16, pitch: 0.07 }, { yaw: -0.16, pitch: -0.07 }, { yaw: 0.16, pitch: -0.07 }, { yaw: -0.16, pitch: 0.07 }];
    for (const id of STRUCTURE_IDS) for (const tilt of tilts) {
      const s = structures[id];
      const coords = [...s.points, ...s.segments];
      for (let i = 0; i < coords.length; i += 3) {
        const p = project([coords[i]!, coords[i + 1]!, coords[i + 2]!], 560, 520, tilt);
        expect(p.x, `${id} x`).toBeGreaterThan(margin);
        expect(p.x, `${id} x`).toBeLessThan(560 - margin);
        expect(p.y, `${id} y`).toBeGreaterThan(margin);
        expect(p.y, `${id} y`).toBeLessThan(520 - margin);
      }
    }
  });
});
