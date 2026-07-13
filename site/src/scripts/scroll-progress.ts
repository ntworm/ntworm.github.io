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
  const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
  root.style.setProperty('--scroll-progress', `${progress}%`);
  ticking = false;
}

function onScroll() {
  if (!ticking) {
    requestAnimationFrame(update);
    ticking = true;
  }
}

// Skip the bar entirely if the user prefers reduced motion.
// (CSS-side the transition is also off; here we just skip the JS work.)
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!reducedMotion) {
  update();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
}