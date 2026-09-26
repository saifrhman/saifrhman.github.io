/**
 * Controller for the hero figure: structure switcher, slow auto-advance and
 * lazy WebGL enhancement. Works on the static SVG alone; three.js is only
 * fetched on wide screens without reduced motion or data saver.
 */
import { STRUCTURE_IDS, type StructureId } from '@/lib/structure-ids';
import type { HeroScene } from '@/scripts/hero-scene';

const ADVANCE_MS = 9000;

interface NetworkInformationLike {
  saveData?: boolean;
}

function isStructureId(value: string | undefined): value is StructureId {
  return value !== undefined && (STRUCTURE_IDS as readonly string[]).includes(value);
}

export function initHeroFigure(root: HTMLElement): void {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const wide = window.matchMedia('(min-width: 48rem)');
  const stage = root.querySelector<HTMLElement>('.stage');
  const buttons = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-structure-button]'));
  const captions = Array.from(root.querySelectorAll<HTMLElement>('[data-caption]'));

  let active: StructureId = isStructureId(root.dataset.active) ? root.dataset.active : 'backbone';
  let scene: HeroScene | null = null;
  let userChose = false;
  let visible = true;
  let timer: number | undefined;

  const show = (id: StructureId): void => {
    active = id;
    root.dataset.active = id;
    for (const b of buttons) b.setAttribute('aria-pressed', String(b.dataset.structureButton === id));
    for (const c of captions) c.hidden = c.dataset.caption !== id;
    scene?.setStructure(id);
  };

  const schedule = (): void => {
    window.clearTimeout(timer);
    if (userChose || reduceMotion.matches || !visible || document.hidden) return;
    timer = window.setTimeout(() => {
      const next = STRUCTURE_IDS[(STRUCTURE_IDS.indexOf(active) + 1) % STRUCTURE_IDS.length]!;
      show(next);
      schedule();
    }, ADVANCE_MS);
  };

  for (const button of buttons) {
    button.addEventListener('click', () => {
      const id = button.dataset.structureButton;
      if (!isStructureId(id)) return;
      userChose = true;
      window.clearTimeout(timer);
      show(id);
    });
  }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(
      ([entry]) => {
        visible = entry?.isIntersecting ?? true;
        scene?.setRunning(visible && !document.hidden);
        schedule();
      },
      { threshold: 0.15 },
    ).observe(root);
  }
  document.addEventListener('visibilitychange', () => {
    scene?.setRunning(visible && !document.hidden);
    schedule();
  });
  reduceMotion.addEventListener('change', () => {
    if (reduceMotion.matches) {
      scene?.destroy();
      scene = null;
      root.classList.remove('is-webgl');
    }
    schedule();
  });

  schedule();

  const connection = (navigator as Navigator & { connection?: NetworkInformationLike }).connection;
  if (!stage || !wide.matches || reduceMotion.matches || connection?.saveData) return;

  const start = (): void => {
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

  if ('requestIdleCallback' in window) window.requestIdleCallback(start, { timeout: 2500 });
  else setTimeout(start, 1200);
}
