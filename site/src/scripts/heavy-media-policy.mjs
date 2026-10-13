export function shouldDelayHeavyMedia({ saveData, deviceMemory } = {}) {
  return saveData === true || (Number.isFinite(deviceMemory) && deviceMemory <= 2);
}

// Width alone admits phones in landscape or with a desktop-sized viewport.
// Keep their Gaussian backgrounds static even when the screen is wide.
export function shouldUseGaussianWebGL({
  viewportWidth,
  mobileBreakpoint = 768,
  coarsePointer = false,
  hoverNone = false,
} = {}) {
  return Number.isFinite(viewportWidth)
    && viewportWidth >= mobileBreakpoint
    && !coarsePointer
    && !hoverNone;
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
