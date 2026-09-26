/**
 * Checks the production build in dist/ (run `npm run build` first; skipped if
 * there is no build). Verifies internal links, assets and page metadata.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const dist = fileURLToPath(new URL('../dist/', import.meta.url));
const hasBuild = existsSync(join(dist, 'index.html'));

function htmlFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return htmlFiles(path);
    return name.endsWith('.html') ? [path] : [];
  });
}

function resolves(href: string): boolean {
  const clean = decodeURIComponent(href.split('#')[0]!.split('?')[0]!);
  if (clean === '') return true;
  const path = join(dist, clean);
  if (existsSync(path) && statSync(path).isFile()) return true;
  return existsSync(join(path, 'index.html'));
}

describe.skipIf(!hasBuild)('production build', () => {
  const pages = hasBuild ? htmlFiles(dist) : [];

  it('produced every expected route', () => {
    for (const route of ['index.html', 'research/index.html', 'projects/index.html', 'about/index.html', 'cv/index.html', '404.html']) {
      expect(existsSync(join(dist, route)), route).toBe(true);
    }
  });

  for (const page of pages) {
    const name = page.slice(dist.length);
    const html = readFileSync(page, 'utf8');

    it(`${name}: has language, title, description and canonical URL`, () => {
      expect(html).toMatch(/<html lang="en-GB"/);
      expect(html).toMatch(/<title>[^<]{5,}<\/title>/);
      expect(html).toMatch(/<meta name="description" content="[^"]{40,}"/);
      if (html.includes('<meta name="robots" content="noindex"')) {
        expect(html).not.toMatch(/<link rel="canonical"/);
      } else {
        expect(html).toMatch(/<link rel="canonical" href="https:\/\/saifrhman\.github\.io\//);
      }
      expect(html).toMatch(/<meta property="og:image" content="https:\/\/saifrhman\.github\.io\/og\.png"/);
    });

    it(`${name}: has exactly one h1 and unique ids`, () => {
      expect(html.match(/<h1[\s>]/g)?.length ?? 0).toBe(1);
      const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
      expect(ids.length).toBe(new Set(ids).size);
    });

    it(`${name}: internal links and assets resolve`, () => {
      const refs = [...html.matchAll(/\s(?:href|src)="(\/[^"]*)"/g)].map((m) => m[1]!);
      for (const ref of refs) if (!ref.startsWith('//')) expect(resolves(ref), ref).toBe(true);
    });

    it(`${name}: in-page anchors exist`, () => {
      const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
      for (const m of html.matchAll(/href="#([^"]+)"/g)) expect(ids.has(m[1]), `#${m[1]}`).toBe(true);
    });

    it(`${name}: images have alt text`, () => {
      for (const m of html.matchAll(/<img\b[^>]*>/g)) expect(m[0], m[0]).toMatch(/\salt="[^"]+"/);
    });
  }

  it('cross-page anchors point at real ids', () => {
    const research = readFileSync(join(dist, 'research/index.html'), 'utf8');
    const ids = new Set([...research.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
    for (const page of pages) {
      for (const m of readFileSync(page, 'utf8').matchAll(/href="\/research\/#([^"]+)"/g)) {
        expect(ids.has(m[1]), `/research/#${m[1]}`).toBe(true);
      }
    }
  });
});
