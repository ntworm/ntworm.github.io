// Scroll-triggered fade-in for sections
// Respects prefers-reduced-motion

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const observed = new WeakSet<Element>();

const observer = reducedMotion
  ? null
  : new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    // Mobile scroll (touch) often commits before the IntersectionObserver
    // fires if the section is tall. Drop threshold to 0.05 (5%) and trim
    // the bottom rootMargin so the fade-in triggers as soon as the section
    // peeks into the viewport, not after 15% is visible.
    { threshold: 0.05, rootMargin: '0px 0px -10px 0px' }
  );

function initScrollFades() {
  document.querySelectorAll<HTMLElement>('[data-fade-in]').forEach((el) => {
    if (reducedMotion) {
      el.classList.add('is-visible');
      return;
    }

    if (observed.has(el)) return;
    observed.add(el);
    observer?.observe(el);
  });
}

document.addEventListener('astro:page-load', initScrollFades);

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initScrollFades, { once: true });
} else {
  initScrollFades();
}
