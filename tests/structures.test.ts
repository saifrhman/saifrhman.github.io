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

  it('project into the viewport', () => {
    const s = structures.backbone;
    for (let i = 0; i < POINT_COUNT; i++) {
      const p = project([s.points[i * 3]!, s.points[i * 3 + 1]!, s.points[i * 3 + 2]!], 560, 520);
      expect(p.x).toBeGreaterThan(0);
      expect(p.x).toBeLessThan(560);
      expect(p.y).toBeGreaterThan(0);
      expect(p.y).toBeLessThan(520);
    }
  });
});
