#!/usr/bin/env node
/**
 * Renders build-derived static assets with a local Chrome/Chromium:
 *   - public/og.png                      social preview image (1200×630)
 *   - public/cv/saif-ur-rehman-cv.pdf    PDF of the /cv/ page
 *
 * Usage: npm run assets        (builds the site first)
 *        node scripts/render-assets.mjs [og|cv]
 *
 * Set CHROME_PATH if Chrome is not at a standard location. The outputs are
 * committed, so CI never needs a browser.
 */
import { createServer } from 'node:http';
import { readFile, stat, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const root = fileURLToPath(new URL('..', import.meta.url));
const dist = join(root, 'dist');
const only = process.argv[2];

const candidates = [
  process.env.CHROME_PATH,
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean);
const executablePath = candidates.find((p) => existsSync(p));
if (!executablePath) {
  console.error('No Chrome found. Set CHROME_PATH to a Chrome or Chromium binary.');
  process.exit(1);
}
if (!existsSync(join(dist, 'index.html'))) {
  console.error('dist/ is missing. Run `npm run build` first.');
  process.exit(1);
}

const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.woff2': 'font/woff2',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.pdf': 'application/pdf',
  '.xml': 'application/xml',
};

// Minimal static server for dist/.
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? '/', 'http://localhost');
    let path = normalize(join(dist, decodeURIComponent(url.pathname)));
    if (!path.startsWith(dist)) throw new Error('outside dist');
    if ((await stat(path).catch(() => null))?.isDirectory()) path = join(path, 'index.html');
    const body = await readFile(path);
    res.writeHead(200, { 'content-type': types[extname(path)] ?? 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end('not found');
  }
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const address = server.address();
const base = `http://127.0.0.1:${typeof address === 'object' && address ? address.port : 0}`;

const browser = await chromium.launch({ executablePath });

try {
  if (!only || only === 'cv') {
    const page = await browser.newPage({ colorScheme: 'light' });
    await page.goto(`${base}/cv/`, { waitUntil: 'networkidle' });
    await page.emulateMedia({ media: 'print', colorScheme: 'light' });
    await mkdir(join(root, 'public', 'cv'), { recursive: true });
    await page.pdf({
      path: join(root, 'public', 'cv', 'saif-ur-rehman-cv.pdf'),
      preferCSSPageSize: true,
      printBackground: true,
      tagged: true,
      outline: true,
    });
    await page.close();
    console.log('wrote public/cv/saif-ur-rehman-cv.pdf');
  }

  if (!only || only === 'og') {
    const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1, colorScheme: 'light' });
    await page.goto(`${base}/`, { waitUntil: 'networkidle' });
    // Reuse the site's own fonts and the build-time hero figure (backbone view).
    await page.evaluate(() => {
      const figure = document.querySelector('[data-hero-figure] svg.static');
      const fontStyles = [...document.querySelectorAll('head style')].map((s) => s.outerHTML).join('');
      const links = [...document.querySelectorAll('head link[rel="stylesheet"]')].map((l) => l.outerHTML).join('');
      document.head.innerHTML = `<meta charset="utf-8">${links}${fontStyles}`;
      document.body.innerHTML = `
        <div class="og">
          <div class="og-text">
            <p class="og-eyebrow">MSc Data Science &amp; AI · University of Liverpool</p>
            <h1>Saif Ur Rehman</h1>
            <p class="og-role">Machine learning engineer and AI researcher</p>
            <p class="og-topics">Geometry foundation models · Multi-agent AI safety<br>Protein structure data · ML systems</p>
          </div>
          <div class="og-figure">${figure ? figure.outerHTML : ''}</div>
        </div>`;
      const style = document.createElement('style');
      style.textContent = `
        html, body { margin: 0; width: 1200px; height: 630px; background: #f4f2ec; }
        .og { box-sizing: border-box; width: 1200px; height: 630px; padding: 72px 64px 64px 80px; display: grid; grid-template-columns: 1fr 380px; gap: 24px; align-items: center; border-bottom: 10px solid #b0421b; }
        .og-eyebrow { font-family: var(--font-mono); font-size: 18px; letter-spacing: 0.08em; text-transform: uppercase; color: #65676d; margin: 0 0 28px; }
        h1 { font-family: var(--font-serif); font-weight: 400; font-size: 88px; line-height: 1; letter-spacing: -0.025em; color: #17181b; margin: 0; }
        .og-role { font-family: var(--font-serif); font-style: italic; font-size: 32px; color: #44464c; margin: 20px 0 0; }
        .og-topics { font-family: var(--font-sans); font-size: 22px; line-height: 1.45; color: #44464c; margin: 40px 0 0; white-space: nowrap; }
        .og-figure svg { position: static !important; display: block; width: 380px !important; height: auto !important; }
        .og-figure .structure { opacity: 0; }
        .og-figure [data-structure='backbone'] { opacity: 1; }`;
      document.head.appendChild(style);
    });
    await page.waitForTimeout(300);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: join(root, 'public', 'og.png'), type: 'png' });
    await page.close();
    console.log('wrote public/og.png');
  }
} finally {
  await browser.close();
  server.close();
}
