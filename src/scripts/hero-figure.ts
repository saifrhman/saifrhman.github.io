/**
 * Controller for the hero figure: structure switcher and lazy WebGL
 * enhancement. Nothing moves on its own for more than a few seconds: the
 * structure only changes when the visitor picks one. The static SVG is the
 * complete figure; three.js is fetched only on wide screens with a fine
 * pointer, without reduced motion or data saver, and only once the page has
 * loaded or the visitor starts interacting.
 */
import { STRUCTURE_IDS, type StructureId } from '@/lib/structure-ids';
import type { HeroScene } from '@/scripts/hero-scene';

const START_DELAY_MS = 2500;

interface NetworkInformationLike {
  saveData?: boolean;
}

function isStructureId(value: string | undefined): value is StructureId {
  return value !== undefined && (STRUCTURE_IDS as readonly string[]).includes(value);
}

export function initHeroFigure(root: HTMLElement): void {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const capable = window.matchMedia('(min-width: 48rem) and (hover: hover) and (pointer: fine)');
  const stage = root.querySelector<HTMLElement>('.stage');
  const switcher = root.querySelector<HTMLElement>('.switcher');
  const buttons = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-structure-button]'));
  const captions = Array.from(root.querySelectorAll<HTMLElement>('[data-caption]'));

  let active: StructureId = isStructureId(root.dataset.active) ? root.dataset.active : 'backbone';
  let scene: HeroScene | null = null;
  let visible = true;

  const show = (id: StructureId): void => {
    active = id;
    root.dataset.active = id;
    for (const b of buttons) b.setAttribute('aria-pressed', String(b.dataset.structureButton === id));
    for (const c of captions) {
      const current = c.dataset.caption === id;
      c.toggleAttribute('data-current', current);
      if (current) c.removeAttribute('aria-hidden');
      else c.setAttribute('aria-hidden', 'true');
    }
    scene?.setStructure(id);
  };

  // The switcher needs JavaScript, so it is revealed here.
  if (switcher) switcher.hidden = false;
  for (const button of buttons) {
    button.addEventListener('click', () => {
      const id = button.dataset.structureButton;
      if (isStructureId(id)) show(id);
    });
  }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(
      ([entry]) => {
        visible = entry?.isIntersecting ?? true;
        scene?.setRunning(visible && !document.hidden);
      },
      { threshold: 0.15 },
    ).observe(root);
  }
  document.addEventListener('visibilitychange', () => scene?.setRunning(visible && !document.hidden));
  reduceMotion.addEventListener('change', () => {
    if (!reduceMotion.matches) return;
    scene?.destroy();
    scene = null;
    root.classList.remove('is-webgl');
  });

  const connection = (navigator as Navigator & { connection?: NetworkInformationLike }).connection;
  if (!stage || !capable.matches || reduceMotion.matches || connection?.saveData) return;

  let started = false;
  const start = (): void => {
    if (started || reduceMotion.matches) return;
    started = true;
    window.removeEventListener('pointermove', start);
    import('@/scripts/hero-scene')
      .then(({ createHeroScene }) => {
        if (reduceMotion.matches) return;
        scene = createHeroScene(stage, active, {
          onReady: () => root.classList.add('is-webgl'),
          onLost: () => {
            root.classList.remove('is-webgl');
            scene = null;
          },
        });
        scene?.setRunning(visible && !document.hidden);
      })
      .catch(() => {
        // Network or WebGL failure: the static figure stays in place.
      });
  };

  // Once the page has loaded: start on the first pointer movement, or after a
  // short delay, whichever comes first.
  const later = (): void => {
    window.addEventListener('pointermove', start, { passive: true });
    window.setTimeout(start, START_DELAY_MS);
  };
  if (document.readyState === 'complete') later();
  else window.addEventListener('load', later, { once: true });
}
