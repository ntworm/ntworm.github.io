/**
 * Small, DOM-free state machine for the project spotlight. The host owns all
 * timing and rendering so this module remains deterministic in browser and
 * Node tests.
 */
export function createSpotlightController({
  count,
  setActive,
  schedule,
  cancel,
  reducedMotion,
}) {
  let activeIndex = 0;
  let disposed = false;
  let timer = null;
  let generation = 0;
  const pauseReasons = new Set();

  const canCycle = count > 1;

  if (reducedMotion) pauseReasons.add('reduced-motion');

  function clearTimer() {
    if (timer === null) return;
    cancel(timer);
    timer = null;
    generation += 1;
  }

  function scheduleNext() {
    if (!canCycle || disposed || pauseReasons.size > 0 || timer !== null) return;

    const scheduledGeneration = ++generation;
    timer = schedule(() => {
      if (disposed || scheduledGeneration !== generation) return;
      timer = null;
      activeIndex = (activeIndex + 1) % count;
      setActive(activeIndex);
      scheduleNext();
    });
  }

  setActive(activeIndex);
  scheduleNext();

  return {
    setPaused(reason, paused) {
      if (disposed) return;
      const isPaused = pauseReasons.has(reason);
      if (paused) {
        if (isPaused) return;
        pauseReasons.add(reason);
        clearTimer();
        return;
      }
      if (!isPaused) return;
      pauseReasons.delete(reason);
      if (pauseReasons.size === 0) scheduleNext();
    },

    pause(reason) {
      this.setPaused(reason, true);
    },

    resume(reason) {
      this.setPaused(reason, false);
    },

    dispose() {
      if (disposed) return;
      disposed = true;
      clearTimer();
      pauseReasons.clear();
    },
  };
}
