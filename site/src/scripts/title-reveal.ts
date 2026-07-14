/**
 * title-reveal — custom H1 reveal animations for the per-page heroes.
 *
 * Three motion modes, selected per element via data attribute:
 *   data-reveal="cut"         — clipped editorial cuts (Work H1)
 *   data-reveal="focus"       — cinematic blur-to-focus phrases (About H1)
 *   data-reveal="typewriter"  — types character-by-character (Code H1)
 *
 * The HTML must be split into <span> segments beforehand:
 *   <h1 data-reveal="typewriter">
 *     <span class="reveal-seg">A </span>
 *     <span class="reveal-seg reveal-amber">sound director</span>
 *     <span class="reveal-seg"> working between cinema...</span>
 *     <span class="reveal-caret" aria-hidden="true"></span>
 *   </h1>
 *
 * Respects prefers-reduced-motion: final state is shown immediately,
 * no animation, caret removed.
 *
 * Loaded once by Layout.astro; the script is idempotent and exits
 * quietly if no [data-reveal] elements exist.
 */

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const typewriterText = new WeakMap<HTMLElement, string[]>();

const revealObserver = reducedMotion || !('IntersectionObserver' in window)
  ? null
  : new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        revealObserver?.unobserve(entry.target);
        startReveal(entry.target as HTMLElement);
      });
    },
    { threshold: 0.18, rootMargin: '0px 0px -8% 0px' },
  );

function typewriter(el: HTMLElement): void {
  const segments = Array.from(el.querySelectorAll<HTMLElement>('.reveal-seg'));
  const caret = el.querySelector<HTMLElement>('.reveal-caret');
  if (!segments.length) return;

  const originals = typewriterText.get(el) ?? segments.map(s => s.textContent ?? '');

  // Restore final state under reduced motion.
  if (reducedMotion) {
    segments.forEach((s, i) => (s.textContent = originals[i]));
    if (caret) caret.style.display = 'none';
    return;
  }

  // Freeze the complete headline's footprint before clearing it, so entering
  // the chapter never causes the Gaussian or following cards to jump.
  el.style.minHeight = `${Math.ceil(el.getBoundingClientRect().height)}px`;
  segments.forEach(s => (s.textContent = ''));
  if (caret) delete caret.dataset.visible;

  let segIdx = 0;

  const tick = () => {
    if (!el.isConnected) return;

    if (segIdx >= segments.length) {
      // Done. Show static caret (CSS blinks it).
      if (caret) caret.dataset.visible = 'true';
      el.style.removeProperty('min-height');
      return;
    }

    const seg = segments[segIdx];
    const text = originals[segIdx];
    let charIdx = 0;

    const typeChar = () => {
      if (!el.isConnected) return;

      if (charIdx >= text.length) {
        segIdx++;
        setTimeout(tick, 120); // small pause between segments
        return;
      }
      seg.textContent = text.slice(0, charIdx + 1);
      charIdx++;
      // Slight variance per char (24–32ms) keeps it feeling human.
      const jitter = Math.random() * 8;
      setTimeout(typeChar, 24 + jitter);
    };

    typeChar();
  };

  // A short pause after the title enters the viewport makes the start legible.
  setTimeout(tick, 140);
}

function prepareSegments(el: HTMLElement): void {
  const segments = Array.from(el.querySelectorAll<HTMLElement>('.reveal-seg'));
  if (!segments.length) return;

  segments.forEach((s, i) => {
    s.style.setProperty('--reveal-i', String(i));
  });

  requestAnimationFrame(() => {
    if (el.isConnected) el.dataset.revealReady = 'true';
  });
}

function cutReveal(el: HTMLElement): void {
  prepareSegments(el);
}

function focusReveal(el: HTMLElement): void {
  prepareSegments(el);
}

function startReveal(el: HTMLElement): void {
  if (el.dataset.revealStarted === 'true') return;
  el.dataset.revealStarted = 'true';

  if (el.dataset.reveal === 'typewriter') typewriter(el);
  if (el.dataset.reveal === 'cut') cutReveal(el);
  if (el.dataset.reveal === 'focus') focusReveal(el);
}

function init() {
  const revealEls = document.querySelectorAll<HTMLElement>('[data-reveal]');
  revealEls.forEach((el) => {
    if (el.dataset.revealInitialized === 'true') return;
    el.dataset.revealInitialized = 'true';

    const segments = Array.from(el.querySelectorAll<HTMLElement>('.reveal-seg'));
    segments.forEach((segment, index) => {
      segment.style.setProperty('--reveal-i', String(index));
    });
    if (el.dataset.reveal === 'typewriter') {
      typewriterText.set(el, segments.map(segment => segment.textContent ?? ''));
    }

    if (reducedMotion || !revealObserver) {
      startReveal(el);
      return;
    }

    revealObserver?.observe(el);
  });
}

document.addEventListener('astro:page-load', init);

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}
