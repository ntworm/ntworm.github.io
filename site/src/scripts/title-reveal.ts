/**
 * title-reveal — custom H1 reveal animations for the per-page heroes.
 *
 * Two motion modes, selected per element via data attribute:
 *   data-reveal="typewriter"  — types character-by-character (about H1)
 *   data-reveal="word"        — each word fades + slides in (code H1)
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
 * Each page should have its own copy of this script inlined in its
 * frontmatter if it wants a custom reveal; the script is idempotent
 * and exits quietly if no [data-reveal] elements exist.
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
    if (segIdx >= segments.length) {
      // Done. Show static caret (CSS blinks it).
      if (caret) caret.style.opacity = '1';
      return;
    }

    const seg = segments[segIdx];
    const text = originals[segIdx];
    let charIdx = 0;

    const typeChar = () => {
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

function wordReveal(el: HTMLElement): void {
  const segments = Array.from(el.querySelectorAll<HTMLElement>('.reveal-seg'));
  if (!segments.length) return;

  // Stagger via per-segment --reveal-i CSS var. The animation itself
  // lives in the page's stylesheet (e.g. .code.astro .reveal-seg rule)
  // — we only set the index. CSS handles initial state, transition
  // delay, and final state, which avoids the JS batch-timing race
  // where setting opacity:0 then opacity:1 in the same frame cancels
  // out and the transition never fires.
  segments.forEach((s, i) => {
    s.style.setProperty('--reveal-i', String(i));
  });

  // Caret reveal timing: page CSS animates it in after the last word
  // lands (delay = (segments.length * 80) + 300 + 320ms).
  if (reducedMotion) {
    const caret = el.querySelector<HTMLElement>('.reveal-caret');
    if (caret) caret.style.display = 'none';
  }
}

function init() {
  const typewriterEls = document.querySelectorAll<HTMLElement>('[data-reveal="typewriter"]');
  typewriterEls.forEach(typewriter);

  const wordEls = document.querySelectorAll<HTMLElement>('[data-reveal="word"]');
  wordEls.forEach(wordReveal);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}