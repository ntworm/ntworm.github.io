// Scroll-triggered fade-in for sections
// Respects prefers-reduced-motion

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!reducedMotion) {
  const observer = new IntersectionObserver(
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

  document.querySelectorAll<HTMLElement>('[data-fade-in]').forEach((el) => {
    observer.observe(el);
  });
}