import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { research } from '@/data/research';
import { projects } from '@/data/projects';
import { publications } from '@/data/publications';
import { education, experience, competitions, certifications, skills } from '@/data/experience';
import { site, contactLinks } from '@/data/site';
import { statusProblems } from '@/lib/status';

const assetsDir = fileURLToPath(new URL('../src/assets/', import.meta.url));

/** Every human-readable string in the content files. */
function allStrings(value: unknown, out: string[] = []): string[] {
  if (typeof value === 'string') out.push(value);
  else if (Array.isArray(value)) value.forEach((v) => allStrings(v, out));
  else if (value && typeof value === 'object') Object.values(value).forEach((v) => allStrings(v, out));
  return out;
}
const copy = allStrings([research, projects, publications, education, experience, competitions, certifications, skills, site]);

describe('research and publication status', () => {
  it('every entry has a consistent status and venue', () => {
    for (const entry of [...research, ...publications]) {
      expect(statusProblems(entry.status, entry.venue), entry.title).toEqual([]);
    }
  });

  it('nothing is marked accepted or published without public evidence', () => {
    for (const entry of [...research, ...publications]) {
      if (entry.status === 'accepted' || entry.status === 'published') {
        expect(entry.venue?.evidence, entry.title).toMatch(/^https:\/\//);
      }
    }
  });

  it('publications agree with their research entry on status and venue', () => {
    for (const p of publications) {
      if (!p.research) continue;
      const entry = research.find((r) => r.slug === p.research);
      expect(entry, p.title).toBeDefined();
      expect(p.status, p.title).toBe(entry!.status);
      expect(p.venue, p.title).toEqual(entry!.venue);
    }
  });

  it('publications point at existing research entries', () => {
    const slugs = new Set(research.map((r) => r.slug));
    for (const p of publications) if (p.research) expect(slugs.has(p.research), p.title).toBe(true);
  });
});

describe('projects', () => {
  it('have unique slugs', () => {
    const slugs = [...projects.map((p) => p.slug), ...research.map((r) => r.slug)];
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('link to a repository on the owner’s GitHub', () => {
    for (const p of projects) expect(p.repo, p.title).toMatch(/^https:\/\/github\.com\/saifrhman\/[\w.-]+$/);
  });

  it('carry between three and six technology labels', () => {
    for (const p of projects) {
      expect(p.tags.length, p.title).toBeGreaterThanOrEqual(3);
      expect(p.tags.length, p.title).toBeLessThanOrEqual(6);
    }
  });

  it('only reference images that exist', () => {
    for (const entry of [...projects, ...research]) {
      for (const image of entry.images ?? []) {
        expect(existsSync(assetsDir + image.src), image.src).toBe(true);
        expect(image.alt.length, image.src).toBeGreaterThan(20);
      }
    }
  });

  it('with a detail page have every section filled', () => {
    for (const p of projects.filter((x) => x.detail)) {
      const d = p.detail!;
      for (const [key, value] of Object.entries(d)) expect((value as unknown[]).length, `${p.slug}.${key}`).toBeGreaterThan(0);
    }
  });
});

describe('links', () => {
  it('are https or root-relative, never placeholders', () => {
    const hrefs = [
      ...research.flatMap((r) => r.links.map((l) => l.href)),
      ...publications.flatMap((p) => p.links.map((l) => l.href)),
      ...projects.flatMap((p) => [p.repo, ...(p.demo ? [p.demo] : [])]),
      ...contactLinks.map((l) => l.href),
      ...competitions.flatMap((c) => (c.href ? [c.href] : [])),
    ];
    for (const href of hrefs) {
      expect(href, href).toMatch(/^(https:\/\/|\/|mailto:)/);
      expect(href, href).not.toMatch(/example\.com|#$|localhost/);
    }
  });
});

describe('copy', () => {
  const banned = [
    /passionate/i,
    /cutting[- ]edge/i,
    /leverag/i,
    /innovative/i,
    /seamless/i,
    /state[- ]of[- ]the[- ]art/i,
    /results[- ]driven/i,
    /\bthrive/i,
    /\bjourney\b/i,
    /\bdelve/i,
    /synerg/i,
    /world[- ]class/i,
    /game[- ]chang/i,
    /revolutioni[sz]/i,
    /\bunlock/i,
    /\bempower/i,
  ];

  it('avoids inflated phrasing', () => {
    for (const text of copy) for (const pattern of banned) expect(text, `${pattern} in: ${text}`).not.toMatch(pattern);
  });

  it('contains no placeholders', () => {
    for (const text of copy) expect(text).not.toMatch(/\bTODO\b|\bTBD\b|lorem ipsum|xxx/i);
  });

  it('uses no em dashes', () => {
    for (const text of copy) expect(text, text).not.toContain('—');
  });

  it('never presents a target or submission as a paper at a venue', () => {
    for (const text of copy) {
      expect(text, text).not.toMatch(/\b(NeurIPS|CVPR|ICML|ICLR) (20\d\d )?paper\b/i);
      expect(text, text).not.toMatch(/\baccepted (at|to)\b/i);
      expect(text, text).not.toMatch(/\bpublished (at|in)\b/i);
    }
  });
});
