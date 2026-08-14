/**
 * Level-of-detail state machine for one Gaussian background.
 *
 * States: waiting -> preview -> loading -> live, with preview-failed,
 * poster-only, failed, and disposed as the off-ramps. The controller never
 * touches the DOM; the component injects mounting and cross-fade callbacks so
 * this module stays deterministic in Node tests.
 */
export function createGaussianLodController({
  supported,
  mountPreview,
  mountFull,
  crossFade,
  onState = () => {},
}) {
  let state = 'waiting';
  let previewRuntime = null;
  let fullRuntime = null;
  let active = false;
  let disposed = false;
  let fullPromise = null;
  let cancelCrossFade = null;

  const setState = (next) => {
    if (state === next || disposed) return;
    state = next;
    onState(next);
  };

  const disposePreview = () => {
    if (!previewRuntime) return;
    previewRuntime.dispose();
    previewRuntime = null;
  };

  const startPreview = async () => {
    if (disposed || previewRuntime || state === 'live') return;
    try {
      const runtime = await mountPreview();
      if (disposed) {
        runtime?.dispose();
        return;
      }
      if (!runtime) {
        setState('preview-failed');
        return;
      }
      previewRuntime = runtime;
      previewRuntime.setActive(active);
      if (state !== 'live' && state !== 'loading') setState('preview');
    } catch (error) {
      console.warn('[gs-bg] preview unavailable', error);
      if (!disposed) setState('preview-failed');
    }
  };

  // Only a context/WebGL failure is worth sacrificing the preview for. A
  // network or decode failure must leave the preview on screen, because the
  // preview is then the only thing the visitor will ever see.
  const isContextExhaustion = (error) => /context|webgl/i.test(String(error?.message ?? error));

  const attemptFull = async (allowRetry) => {
    // Captured before any disposal: the successor scene starts from exactly
    // where the preview is, so the cross-fade changes opacity and nothing else.
    const initialActiveSeconds = previewRuntime?.getState().activeSeconds ?? 0;
    const cameraState = previewRuntime?.getCameraState?.() ?? null;
    try {
      return await mountFull({ initialActiveSeconds, cameraState });
    } catch (error) {
      if (!allowRetry || !previewRuntime || !isContextExhaustion(error)) throw error;
      // A second WebGL context can exhaust the browser's limit. The full scene
      // is the real artwork, so the preview yields its context and we retry.
      console.warn('[gs-bg] retrying full scene without the preview', error);
      disposePreview();
      return mountFull({ initialActiveSeconds, cameraState });
    }
  };

  return {
    async start() {
      if (disposed) return;
      if (!supported()) {
        setState('poster-only');
        return;
      }
      await startPreview();
    },

    async requestFull() {
      if (disposed || fullPromise || !supported()) return;
      const previousState = state;
      setState('loading');
      fullPromise = attemptFull(true)
        .then((runtime) => {
          if (disposed) {
            runtime?.dispose();
            return;
          }
          if (!runtime) {
            setState(previewRuntime ? 'preview' : 'poster-only');
            return;
          }
          fullRuntime = runtime;
          fullRuntime.setActive(active);
          if (previewRuntime) {
            cancelCrossFade = crossFade(() => {
              cancelCrossFade = null;
              disposePreview();
            });
          }
          setState('live');
        })
        .catch((error) => {
          if (disposed) return;
          console.error('[gs-bg] full scene failed', error);
          fullPromise = null;
          setState(previewRuntime
            ? 'preview'
            : (previousState === 'preview-failed' ? 'failed' : 'poster-only'));
        });
      await fullPromise;
    },

    async setViewportSupported(nextSupported) {
      if (disposed) return;
      if (nextSupported) {
        if (state === 'poster-only') await startPreview();
        return;
      }
      cancelCrossFade?.();
      cancelCrossFade = null;
      disposePreview();
      fullRuntime?.dispose();
      fullRuntime = null;
      fullPromise = null;
      setState('poster-only');
    },

    setActive(nextActive) {
      if (disposed) return;
      active = nextActive;
      previewRuntime?.setActive(nextActive);
      fullRuntime?.setActive(nextActive);
    },

    dispose() {
      if (disposed) return;
      cancelCrossFade?.();
      cancelCrossFade = null;
      disposePreview();
      fullRuntime?.dispose();
      fullRuntime = null;
      state = 'disposed';
      disposed = true;
      onState('disposed');
    },

    getState: () => state,
    getRuntimes: () => ({ preview: previewRuntime, full: fullRuntime }),
  };
}
