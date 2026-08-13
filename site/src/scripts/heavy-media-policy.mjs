export function shouldDelayHeavyMedia({ saveData, deviceMemory } = {}) {
  return saveData === true || (Number.isFinite(deviceMemory) && deviceMemory <= 2);
}

export function shouldLoadHeavyMediaForIntent({
  delayHeavyMedia,
  hostTop,
  hostBottom,
  viewportHeight,
} = {}) {
  if (!delayHeavyMedia) return true;

  return Number.isFinite(hostTop)
    && Number.isFinite(hostBottom)
    && Number.isFinite(viewportHeight)
    && hostTop < viewportHeight
    && hostBottom > 0;
}
