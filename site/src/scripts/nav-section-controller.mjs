const SECTION_IDS = Object.freeze(['about', 'work', 'code', 'contact']);
const STICKY_NAVIGATION_LINE = 80;
const controllers = new WeakMap();
const lifecycleDocuments = new WeakSet();

function isSectionId(value) {
  return SECTION_IDS.includes(value);
}

/**
 * Chooses the visible homepage chapter nearest the sticky navigation line.
 * Invalid observer entries are intentionally ignored so a prior valid chapter
 * stays announced while an Astro swap or partial callback is in progress.
 */
export function selectCurrentSection(entries, previous = 'about') {
  const fallback = isSectionId(previous) ? previous : 'about';
  let selected = null;
  let nearestDistance = Number.POSITIVE_INFINITY;

  for (const entry of entries ?? []) {
    const id = entry?.target?.id;
    const rect = entry?.boundingClientRect;
    if (
      !entry?.isIntersecting
      || !isSectionId(id)
      || !Number.isFinite(rect?.top)
      || !Number.isFinite(rect?.bottom)
    ) continue;

    const distance = Math.abs(rect.top - STICKY_NAVIGATION_LINE);
    if (distance < nearestDistance) {
      selected = id;
      nearestDistance = distance;
    }
  }

  return selected ?? fallback;
}

function sectionForLink(link) {
  const href = link.getAttribute('href');
  const id = href?.match(/#(about|work|code|contact)$/)?.[1];
  return isSectionId(id) ? id : null;
}

function setCurrentLocation(links, section) {
  links.forEach((link) => {
    const active = sectionForLink(link) === section;
    link.classList.toggle('is-active', active);
    if (active) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
}

export function disconnectSectionNavigation(documentRef) {
  const controller = controllers.get(documentRef);
  if (!controller) return;
  controller.dispose();
  controllers.delete(documentRef);
}

/**
 * Binds exactly one observer to the current Astro document. Repeated
 * page-load events reuse the active binding until astro:before-swap cleans it.
 */
export function bindSectionNavigation(documentRef = document) {
  const existing = controllers.get(documentRef);
  if (existing) return existing.cleanup;

  const links = [...documentRef.querySelectorAll('[data-nav-section]')];
  const hosts = SECTION_IDS
    .map((id) => documentRef.getElementById(id))
    .filter((host) => host != null);
  const Observer = documentRef.defaultView?.IntersectionObserver ?? globalThis.IntersectionObserver;
  const view = documentRef.defaultView ?? globalThis;

  // Case-study routes intentionally keep their server-rendered Work `page`
  // state; there are no continuous-document hosts to observe there.
  if (hosts.length === 0 || typeof Observer !== 'function') return () => {};

  let current = 'about';
  let frameId = null;
  let disposed = false;
  const updateCurrentSection = () => {
    if (disposed) return;
    frameId = null;
    const viewportHeight = Number.isFinite(view.innerHeight)
      ? view.innerHeight
      : Number.POSITIVE_INFINITY;
    const snapshots = hosts.map((host) => {
      const boundingClientRect = host.getBoundingClientRect();
      return {
        target: host,
        isIntersecting: boundingClientRect.bottom > 0 && boundingClientRect.top < viewportHeight,
        boundingClientRect,
      };
    });
    current = selectCurrentSection(snapshots, current);
    setCurrentLocation(links, current);
  };
  const scheduleUpdate = () => {
    if (disposed || frameId !== null) return;
    frameId = view.requestAnimationFrame(updateCurrentSection);
  };
  const observer = new Observer(() => {
    if (disposed) return;
    scheduleUpdate();
  }, { threshold: 0 });

  hosts.forEach((host) => observer.observe(host));
  view.addEventListener('scroll', scheduleUpdate, { passive: true });
  scheduleUpdate();
  const cleanup = () => disconnectSectionNavigation(documentRef);
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    view.removeEventListener('scroll', scheduleUpdate);
    if (frameId !== null) view.cancelAnimationFrame(frameId);
    frameId = null;
    observer.disconnect();
  };
  controllers.set(documentRef, { cleanup, dispose });
  return cleanup;
}

export function installSectionNavigation(documentRef = document) {
  if (!lifecycleDocuments.has(documentRef)) {
    documentRef.addEventListener('astro:before-swap', () => disconnectSectionNavigation(documentRef));
    documentRef.addEventListener('astro:page-load', () => bindSectionNavigation(documentRef));
    lifecycleDocuments.add(documentRef);
  }

  return bindSectionNavigation(documentRef);
}
