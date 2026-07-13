/**
 * scroll-progress — drives the 1px amber bar at the top of the page
 * that grows from 0% to 100% as you scroll. Sets the --scroll-progress
 * CSS var on :root, which body::after reads for its width.
 *
 * Uses passive scroll listener + requestAnimationFrame coalescing so
 * it stays cheap on long pages. Skipped when prefers-reduced-motion
 * is on (the CSS transition is also killed in global.css).
 */

const root = document.documentElement;
let ticking = false;

function update() {
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const rawProgress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
  const progress = Math.min(100, Math.max(0, rawProgress));
  root.style.setProperty('--scroll-progress', `${progress}%`);
  ticking = false;
}

function onScroll() {
  if (!ticking) {
    requestAnimationFrame(update);
    ticking = true;
  }
}

function updateAfterNavigation() {
  // Astro restores scroll after swapping the document. Waiting two frames
  // prevents the previous page's progress width from lingering at the top.
  requestAnimationFrame(() => requestAnimationFrame(update));
}

// Skip the bar entirely if the user prefers reduced motion.
// (CSS-side the transition is also off; here we just skip the JS work.)
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!reducedMotion) {
  update();
  document.addEventListener('astro:page-load', updateAfterNavigation);
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
}
