const HYDRA_ACTIVITY_MESSAGE = 'portfolio:hydra-active';

export function createHydraFrameController({
  host,
  iframe,
  documentRef = document,
  windowRef = window,
  motionQuery = windowRef.matchMedia?.('(prefers-reduced-motion: reduce)'),
  connection = windowRef.navigator?.connection,
  source = iframe?.dataset?.hydraSrc,
  rootMargin = '75% 0px',
} = {}) {
  if (!host || !iframe) throw new TypeError('Hydra host and iframe are required');

  const Observer = windowRef.IntersectionObserver ?? globalThis.IntersectionObserver;
  let disposed = false;
  let insideRange = typeof Observer !== 'function';
  let active = null;

  const isActive = () => (
    insideRange
    && !documentRef.hidden
    && !motionQuery?.matches
    && connection?.saveData !== true
  );
  const send = (nextActive) => {
    iframe.contentWindow?.postMessage(
      { type: HYDRA_ACTIVITY_MESSAGE, active: nextActive },
      windowRef.location.origin,
    );
  };
  const load = () => {
    if (!source || iframe.dataset.hydraLoaded === 'true') return;
    iframe.dataset.hydraLoaded = 'true';
    iframe.src = source;
  };
  const refresh = () => {
    if (disposed) return;
    const nextActive = isActive();
    if (active === nextActive) return;
    active = nextActive;
    if (active) load();
    send(active);
  };
  const onVisibilityChange = () => refresh();
  const onMotionChange = () => refresh();
  const onConnectionChange = () => refresh();
  const onIframeLoad = () => {
    if (disposed) return;
    send(active ?? isActive());
  };
  const observer = typeof Observer === 'function'
    ? new Observer((entries) => {
      if (disposed) return;
      const entry = entries.find((candidate) => candidate.target === host);
      if (!entry) return;
      insideRange = entry.isIntersecting;
      refresh();
    }, { rootMargin })
    : null;

  observer?.observe(host);
  documentRef.addEventListener('visibilitychange', onVisibilityChange);
  motionQuery?.addEventListener?.('change', onMotionChange);
  connection?.addEventListener?.('change', onConnectionChange);
  iframe.addEventListener('load', onIframeLoad);
  refresh();

  const dispose = () => {
    if (disposed) return;
    disposed = true;
    documentRef.removeEventListener('visibilitychange', onVisibilityChange);
    motionQuery?.removeEventListener?.('change', onMotionChange);
    connection?.removeEventListener?.('change', onConnectionChange);
    iframe.removeEventListener('load', onIframeLoad);
    observer?.disconnect();
    active = false;
    send(false);
  };

  return {
    dispose,
    getState: () => ({ active: active ?? isActive(), disposed, insideRange }),
  };
}
