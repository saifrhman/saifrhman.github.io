/**
 * Theme toggle. The initial theme is applied by an inline script in the
 * layout head; this module wires up the toggle button and keeps the
 * theme-color meta tags in sync.
 */
type Theme = 'light' | 'dark';

const root = document.documentElement;
const systemDark = window.matchMedia('(prefers-color-scheme: dark)');

function current(): Theme {
  const set = root.dataset.theme;
  if (set === 'light' || set === 'dark') return set;
  return systemDark.matches ? 'dark' : 'light';
}

function sync(button: HTMLButtonElement): void {
  const theme = current();
  button.setAttribute('aria-pressed', String(theme === 'dark'));
  button.dataset.theme = theme;
}

const THEME_COLOR: Record<Theme, string> = { light: '#f4f2ec', dark: '#0e0f11' };

/** Once a theme is chosen explicitly, browser chrome should follow it, not the system. */
function syncMeta(theme: Theme): void {
  for (const meta of document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')) {
    meta.content = THEME_COLOR[theme];
  }
}

function apply(theme: Theme): void {
  root.dataset.theme = theme;
  syncMeta(theme);
  try {
    localStorage.setItem('theme', theme);
  } catch {
    // Storage can be unavailable (private mode); the choice then lasts for this page only.
  }
  window.dispatchEvent(new CustomEvent('themechange', { detail: theme }));
}

const button = document.querySelector<HTMLButtonElement>('[data-theme-toggle]');
if (root.dataset.theme === 'light' || root.dataset.theme === 'dark') syncMeta(root.dataset.theme);

/** Re-read the stored choice, e.g. after a back-forward cache restore or a change in another tab. */
function reapply(): void {
  let saved: string | null;
  try {
    saved = localStorage.getItem('theme');
  } catch {
    // Storage unavailable: keep the current state.
    return;
  }
  if (saved === 'light' || saved === 'dark') {
    root.dataset.theme = saved;
    syncMeta(saved);
  } else {
    delete root.dataset.theme;
  }
  if (button) sync(button);
  window.dispatchEvent(new CustomEvent('themechange', { detail: current() }));
}

window.addEventListener('pageshow', (event) => {
  if (event.persisted) reapply();
});
window.addEventListener('storage', (event) => {
  if (event.key === 'theme') reapply();
});

if (button) {
  button.hidden = false;
  sync(button);
  button.addEventListener('click', () => {
    apply(current() === 'dark' ? 'light' : 'dark');
    sync(button);
  });
  systemDark.addEventListener('change', () => {
    sync(button);
    window.dispatchEvent(new CustomEvent('themechange', { detail: current() }));
  });
}
