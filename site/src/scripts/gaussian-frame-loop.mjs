export function createPausableFrameLoop({
  onFrame,
  now = () => performance.now(),
  requestFrame = (callback) => requestAnimationFrame(callback),
  cancelFrame = (id) => cancelAnimationFrame(id),
  initialActiveSeconds = 0,
}) {
  let active = false;
  let disposed = false;
  let activeSeconds = Number.isFinite(initialActiveSeconds) ? Math.max(0, initialActiveSeconds) : 0;
  let frameCount = 0;
  let frameId = 0;
  let previousTimeMs = 0;

  const frame = (timeMs) => {
    frameId = 0;
    if (!active || disposed) return;

    const deltaSeconds = Math.max(0, Math.min(0.05, (timeMs - previousTimeMs) / 1000));
    previousTimeMs = timeMs;
    activeSeconds += deltaSeconds;
    frameCount += 1;
    onFrame({ deltaSeconds, activeSeconds, frameCount });

    if (active && !disposed) frameId = requestFrame(frame);
  };

  const setActive = (nextActive) => {
    if (disposed || active === nextActive) return;
    active = nextActive;

    if (active) {
      previousTimeMs = now();
      frameId = requestFrame(frame);
    } else if (frameId) {
      cancelFrame(frameId);
      frameId = 0;
    }
  };

  const dispose = () => {
    if (disposed) return;
    setActive(false);
    disposed = true;
  };

  const getState = () => ({ active, disposed, activeSeconds, frameCount });

  return { setActive, dispose, getState };
}
