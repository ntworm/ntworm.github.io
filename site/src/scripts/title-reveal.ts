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

function typewriter(el: HTMLElement): void {
  const segments = Array.from(el.querySelectorAll<HTMLElement>('.reveal-seg'));
  const caret = el.querySelector<HTMLElement>('.reveal-caret');
  if (!segments.length) return;

  const originals = segments.map(s => s.textContent ?? '');
  segments.forEach(s => (s.textContent = ''));

  // Restore final state under reduced motion.
  if (reducedMotion) {
    segments.forEach((s, i) => (s.textContent = originals[i]));
    if (caret) caret.style.display = 'none';
    return;
  }

  let segIdx = 0;

  const tick = () => {
    if (!el.isConnected) return;

    if (segIdx >= segments.length) {
      // Done. Show static caret (CSS blinks it).
      if (caret) caret.dataset.visible = 'true';
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

  // 300ms start delay so the page paints first.
  setTimeout(tick, 300);
}

function prepareSegments(el: HTMLElement): void {
  const segments = Array.from(el.querySelectorAll<HTMLElement>('.reveal-seg'));
  if (!segments.length) return;

  segments.forEach((s, i) => {
    s.style.setProperty('--reveal-i', String(i));
  });

  if (reducedMotion) {
    el.dataset.revealReady = 'true';
    return;
  }

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

function init() {
  const revealEls = document.querySelectorAll<HTMLElement>('[data-reveal]');
  revealEls.forEach((el) => {
    if (el.dataset.revealInitialized === 'true') return;
    el.dataset.revealInitialized = 'true';

    if (el.dataset.reveal === 'typewriter') typewriter(el);
    if (el.dataset.reveal === 'cut') cutReveal(el);
    if (el.dataset.reveal === 'focus') focusReveal(el);
  });
}

document.addEventListener('astro:page-load', init);

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}
