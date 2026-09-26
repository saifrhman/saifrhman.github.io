/**
 * Subtle entrance for elements marked with [data-reveal]. Content is visible
 * by default; the hidden starting state only applies once this script has run
 * (it adds `can-reveal` to <html>) and only without reduced motion.
 */
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

function init(): void {
  if (reduce.matches || !('IntersectionObserver' in window)) return;
  const targets = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
  if (targets.length === 0) return;

  const viewportBottom = window.innerHeight;
  // Anything already on screen stays put; only content below the fold animates.
  const pending = targets.filter((el) => el.getBoundingClientRect().top > viewportBottom * 0.92);
  if (pending.length === 0) return;
  document.documentElement.classList.add('can-reveal');
  for (const el of targets) if (!pending.includes(el)) el.classList.add('is-revealed');

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-revealed');
        observer.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.05 },
  );
  for (const el of pending) observer.observe(el);
}

init();
