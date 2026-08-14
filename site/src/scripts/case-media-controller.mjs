const originalMotionStates = new WeakMap();

function getOriginalMotionState(video) {
  const existingState = originalMotionStates.get(video);
  if (existingState) return existingState;

  const originalState = {
    autoplay: video.autoplay,
    loop: video.loop,
    autoplayAttribute: video.hasAttribute('autoplay'),
    loopAttribute: video.hasAttribute('loop'),
    shouldPlay: video.autoplay,
  };
  originalMotionStates.set(video, originalState);
  return originalState;
}

export function createCaseMediaMotionController({ documentRef, motionQuery }) {
  const motionVideos = [...documentRef.querySelectorAll('[data-case-motion-video]')];
  motionVideos.forEach(getOriginalMotionState);
  let disposed = false;

  const syncReducedMotion = () => {
    if (disposed) return;

    if (motionQuery.matches) {
      motionVideos.forEach((video) => {
        video.autoplay = false;
        video.loop = false;
        video.pause();
      });
      return;
    }

    motionVideos.forEach((video) => {
      const state = getOriginalMotionState(video);
      video.toggleAttribute('autoplay', state.autoplayAttribute);
      video.toggleAttribute('loop', state.loopAttribute);
      video.autoplay = state.autoplay;
      video.loop = state.loop;
      if (state.shouldPlay && !documentRef.hidden) {
        void video.play().catch(() => {});
      }
    });
  };

  syncReducedMotion();
  motionQuery.addEventListener('change', syncReducedMotion);

  return {
    dispose() {
      if (disposed) return;
      disposed = true;
      motionQuery.removeEventListener('change', syncReducedMotion);
    },
  };
}
