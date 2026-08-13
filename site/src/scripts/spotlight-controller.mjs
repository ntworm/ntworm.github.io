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

  const canCycle = count > 1 && !reducedMotion;

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
    pause(reason) {
      if (disposed || reducedMotion) return;
      const sizeBefore = pauseReasons.size;
      pauseReasons.add(reason);
      if (pauseReasons.size !== sizeBefore) clearTimer();
    },

    resume(reason) {
      if (disposed || reducedMotion) return;
      if (!pauseReasons.delete(reason) || pauseReasons.size > 0) return;
      scheduleNext();
    },

    dispose() {
      if (disposed) return;
      disposed = true;
      clearTimer();
      pauseReasons.clear();
    },
  };
}
