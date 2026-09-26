# saifrhman.github.io

Source for [saifrhman.github.io](https://saifrhman.github.io), the research and ML-engineering portfolio of Saif Ur Rehman.

It is a static site built with [Astro](https://astro.build) and TypeScript. Every page is rendered to plain HTML at build time. The only client-side JavaScript is a small theme toggle, a scroll-reveal helper and the hero figure controller (about 3 kB gzipped). three.js loads only when it is actually used.

## Stack

| Concern | Choice | Why |
| --- | --- | --- |
| Framework | Astro 7, static output | Per-page HTML with real titles and metadata, no client framework runtime, simple GitHub Pages hosting |
| Language | TypeScript (strictest preset) | Content is typed data, so a missing field or a wrong status fails the build |
| Styling | Plain CSS with design tokens (`src/styles/tokens.css`) and component-scoped styles | No utility framework needed at this size; one place for colours, type scale, spacing and motion |
| Fonts | Newsreader, IBM Plex Sans, IBM Plex Mono, self-hosted through Astro's fonts API | No third-party font requests; metric-matched fallbacks avoid layout shift |
| 3D | three.js, lazily imported | Used only for the hero figure (see below) |
| Tests | Vitest, ESLint, `astro check` | Content-integrity rules and post-build checks |
| Hosting | GitHub Pages via GitHub Actions | `.github/workflows/deploy.yml` |

## Project layout

```
src/
  data/           All site content: research.ts, projects.ts, publications.ts,
                  experience.ts, site.ts, types.ts (the content model)
  components/     ResearchCard, ResearchRow, ProjectCard, PublicationItem,
                  StatusBadge, TechTag, SocialLink, SectionHeading,
                  ProjectArchitecture, HeroFigure, Navigation, Footer, Seo, ...
  components/figures/  Build-time SVG figures, one per research line or project
  layouts/        BaseLayout.astro (head, navigation, footer)
  lib/            status.ts (status and venue rules), structures.ts (hero geometry),
                  structured-data.ts (JSON-LD), random.ts, text.ts
  pages/          index, research, projects (+ [slug] detail pages), about, cv, 404
  scripts/        Client scripts: theme, reveal, hero-figure, hero-scene (three.js)
  styles/         tokens.css, base.css, figures.css
  assets/         Images that go through Astro's image pipeline (converted to WebP)
public/           favicon, og.png, robots.txt, cv/ (generated CV PDF and résumé PDF)
scripts/          render-assets.mjs (renders og.png and the CV PDF)
tests/            Vitest suites (content, status rules, geometry, built output)
```

## Local development

Requires Node 22.12 or newer (CI uses Node 24, see `.nvmrc`).

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # production build into dist/
npm run preview    # serve dist/
```

Quality checks (the same ones CI runs):

```bash
npm run lint       # ESLint (TypeScript + Astro)
npm run check      # astro check (type checking for .astro and .ts)
npm run build
npm test           # Vitest; the dist/ checks run only after a build
npm run verify     # all of the above in order
```

## Editing content

All content lives in `src/data/`. Components render whatever is there, and optional fields are rendered only when present. Never add placeholder links or empty strings.

### Add a research line

Add an entry to `src/data/research.ts`. The fields are documented in `ResearchEntry` in `src/data/types.ts`:

- `question`: the research question in one or two sentences. The first sentence appears on the home page.
- `summary` and `body`: an abstract-like description.
- `methods`, `concepts`: short lists.
- `role` and `collaborators`: for multi-author work, say plainly what you did.
- `links`: only public URLs (code, preprint, poster). Leave the array empty otherwise.
- `figure`: one of the figure kinds in `src/components/figures/Figure.astro`. To add a new kind, write a component there and register it.

### Publication status rules

Statuses are defined in `src/lib/status.ts` and rendered verbatim:

| `status` | Label shown |
| --- | --- |
| `published` | Published |
| `accepted` | Accepted |
| `under-review` | Under review |
| `submitted` | Submitted |
| `in-preparation` | Manuscript in preparation |
| `in-progress` | Research in progress |
| `dissertation` | MSc dissertation |

A venue always states its relation to the work:

- `{ relation: 'target', name: 'CVPR', year: 2027 }` renders as **Target: CVPR 2027**.
- `{ relation: 'submitted', name: '…' }` renders as **Submitted to …** and needs status `submitted` or `under-review`.
- `accepted` and `published` need a matching status **and** `venue.evidence`, a public URL (proceedings page, DOI, OpenReview decision). Without it the build fails.

These rules are enforced both at build time (`StatusBadge` throws) and in `tests/status.test.ts` and `tests/content.test.ts`.

When a decision arrives, update the entry in `src/data/research.ts` and the matching one in `src/data/publications.ts`. For example, after an acceptance:

```ts
status: 'accepted',
venue: { relation: 'accepted', name: 'Workshop name @ NeurIPS', year: 2026, evidence: 'https://openreview.net/forum?id=…' },
```

### Add a project

Add an entry to `src/data/projects.ts`:

- `problem`, `description`, `highlight`: what problem it solves, what was built, and the single most interesting technical detail.
- `tags`: 3 to 6 labels (tested).
- `repo`: required. `demo`: only if a working deployment exists.
- `featured: true` puts it on the home page.
- `detail`: add this object (problem, system, architecture stages, decisions, evaluation, limitations) to generate a page at `/projects/<slug>/`. Every section must be non-empty.
- `images`: screenshots or plots in `src/assets/…`, with alt text and a caption that says what the image does and does not show.

### Update the CV

The `/cv/` page is generated from the same data files, so it cannot drift from the site. To regenerate the downloadable PDF after editing content:

```bash
npm run assets     # builds, then renders public/cv/saif-ur-rehman-cv.pdf and public/og.png
```

This uses a local Chrome or Chromium; set `CHROME_PATH` if it is not found.

The résumé is a separate, hand-maintained PDF at `public/cv/saif-ur-rehman-resume.pdf`, linked from the About page, the CV page and the contact section. To update it, replace that file (keep the name, or change `site.cv.resume` in `src/data/site.ts`). Set `site.cv.resume` or `site.cv.pdf` to `null` to hide the corresponding link.

### Social preview image

`public/og.png` (1200×630) is rendered by `npm run assets` from the site's own fonts and the hero figure. Edit the layout in `scripts/render-assets.mjs`.

## The hero figure

The home page figure shows three procedural structures (a protein Cα trace, a multi-view scene with cameras, and agent trajectories in space-time), each with an illustrative per-point spread. It ties together the research themes of geometry, protein structure, multiple agents and uncertainty.

- `src/lib/structures.ts` generates all three deterministically, with the same number of points, and defines the camera shared by both renderers.
- `src/components/HeroFigure.astro` renders them as static SVG at build time. This is the complete figure without JavaScript, on phones, with reduced motion and with data saver.
- `src/scripts/hero-figure.ts` handles the switcher and a slow auto-advance (off with reduced motion or after the visitor picks a structure). On screens at least 768 px wide it lazily imports `src/scripts/hero-scene.ts` when the browser is idle.
- `src/scripts/hero-scene.ts` is the three.js version: points with shader halos, gentle pointer parallax (fine pointers only), and morphing between structures. It never rotates continuously, stops rendering when the figure is off screen or the tab is hidden, caps the pixel ratio at 2, and disposes geometry, materials and the renderer on `pagehide` or WebGL context loss. The static SVG stays underneath as the fallback.

three.js is about 130 kB gzipped in its own chunk and is never on the critical path.

## Design system

Tokens are in `src/styles/tokens.css`: type scale (fluid `clamp()` sizes), 4 px spacing scale, layout widths, radii, motion durations and easing, and colour themes. The light theme is the default. The dark theme follows the system preference, and the toggle in the header stores an explicit choice in `localStorage`. All text colours meet WCAG AA contrast on both backgrounds.

Figures in `src/components/figures/` draw only with the classes in `src/styles/figures.css`, so they follow the theme.

## Deployment

`.github/workflows/deploy.yml` lints, type-checks, builds and tests on every push and pull request, and deploys `dist/` to GitHub Pages on pushes to `main`.

One-time setup: in the repository's **Settings → Pages**, set **Source** to **GitHub Actions**. The previous site was published by the legacy branch builder, which would otherwise keep serving the repository root. With the GitHub CLI:

```bash
gh api -X PUT repos/saifrhman/saifrhman.github.io/pages -f build_type=workflow
```

No environment variables or secrets are required.

## Accessibility and performance notes

- Semantic landmarks, one `h1` per page, a skip link, visible focus styles and `aria-current` in navigation.
- Motion respects `prefers-reduced-motion`. Content never depends on animation, and print shows everything.
- Figures carry text alternatives (`role="img"` with a description).
- Images are converted to responsive WebP at build time. The pages have no layout-shifting web fonts, and no third-party requests.
