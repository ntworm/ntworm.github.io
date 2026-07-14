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
 * Samples the hero camera's cinematic target values.
 *
 * This function deliberately returns orbit parameters only. The look-at
 * target remains owned by the renderer and fixed at the Gaussian origin.
 */
export function sampleGaussianCamera({
  scrollProgress = 0,
  pointerX = 0,
  pointerY = 0,
  timeSeconds = 0,
} = {}) {
  const progress = clamp(scrollProgress, 0, 1);
  const px = clamp(pointerX, -1, 1);
  const py = clamp(pointerY, -1, 1);
  const approach = Math.sin(Math.PI * progress);
  const exit = smoothstep(0.62, 1, progress);

  // 20s and 37s periods never settle into an obvious short loop.
  const slowA = Math.sin(timeSeconds * 0.31);
  const slowB = Math.sin(timeSeconds * 0.17 + 1.3);

  return {
    radius: clamp(
      6 - 0.72 * approach + 0.3 * exit + 0.09 * slowA + 0.04 * slowB - 0.06 * py,
      5.05,
      6.55,
    ),
    pitch: clamp(
      -0.15 + 0.07 * approach + 0.065 * py + 0.022 * slowB,
      -0.27,
      0.03,
    ),
    phaseOffset: 0.28 * smoothstep(0, 1, progress) + 0.12 * px + 0.03 * slowA,
    angularSpeed: clamp(
      0.108 * (1 + 0.13 * slowB + 0.09 * approach + 0.06 * px),
      0.075,
      0.14,
    ),
  };
}
