const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const smoothstep = (edge0, edge1, value) => {
  const x = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return x * x * (3 - 2 * x);
};

/**
 * Frame-rate-independent exponential damping.
 * A short delta cap prevents a hidden tab from causing a camera jump.
 */
export function damp(current, target, response, deltaSeconds) {
  const dt = Math.max(0, Math.min(0.05, deltaSeconds));
  return current + (target - current) * (1 - Math.exp(-response * dt));
}

/**
 * Converts pointer distance from the visible Gaussian focus into a soft
 * 0..1 zoom field. The focus matches the hero's right-hand composition.
 */
export function gaussianFocusProximity({
  clientX = 0,
  clientY = 0,
  viewportWidth = 1,
  viewportHeight = 1,
  focusX = 0.72,
  focusY = 0.54,
} = {}) {
  const width = Math.max(1, viewportWidth);
  const height = Math.max(1, viewportHeight);
  const unit = Math.min(width, height);
  const focusPx = width * focusX;
  const focusPy = height * focusY;
  const distance = Math.hypot(clientX - focusPx, clientY - focusPy);
  const farthestCorner = Math.hypot(
    Math.max(focusPx, width - focusPx),
    Math.max(focusPy, height - focusPy),
  );

  // Three overlapping fields create the yellow → light red → dark red
  // progression from the visual review, without a dead zone or hard step.
  const broad = 1 - smoothstep(0, farthestCorner, distance);
  const middle = 1 - smoothstep(unit * 0.18, unit * 0.72, distance);
  const core = 1 - smoothstep(unit * 0.055, unit * 0.28, distance);

  return clamp(0.06 + 0.2 * broad + 0.3 * middle + 0.44 * core, 0, 1);
}

/**
 * Samples the hero camera's cinematic target values.
 *
 * This function deliberately returns orbit parameters only. The look-at
 * target remains owned by the renderer and fixed at the Gaussian origin.
 */
export function sampleGaussianCamera({
  scrollProgress = 0,
  focusProximity = 0,
  timeSeconds = 0,
} = {}) {
  const progress = clamp(scrollProgress, 0, 1);
  const focus = clamp(focusProximity, 0, 1);

  // 20s and 37s periods never settle into an obvious short loop.
  const slowA = Math.sin(timeSeconds * 0.31);
  const slowB = Math.sin(timeSeconds * 0.17 + 1.3);

  return {
    radius: clamp(
      6 + 0.09 * slowA + 0.04 * slowB - 2.65 * focus,
      3.45,
      6.55,
    ),
    pitch: clamp(
      -0.15 + 0.022 * slowB,
      -0.27,
      0.03,
    ),
    phaseOffset: 0.03 * slowA,
    angularSpeed: clamp(
      0.108 * (1 + 0.13 * slowB),
      0.075,
      0.14,
    ),
    verticalOffset: 8 * smoothstep(0, 1, progress),
  };
}
