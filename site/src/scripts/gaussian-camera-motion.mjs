const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const smoothstep = (edge0, edge1, value) => {
  const x = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return x * x * (3 - 2 * x);
};

const smootherstep = (value) => {
  const x = clamp(value, 0, 1);
  return x * x * x * (x * (x * 6 - 15) + 10);
};

const createRandom = (seed) => {
  let state = (Number(seed) >>> 0) || 0x6d2b79f5;

  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
};

const neutralAutopilotFrame = () => ({
  speedScale: 1,
  phaseOffset: 0,
  roll: 0,
  lookYaw: 0,
  lookPitch: 0,
});

/**
 * Creates a self-directed camera performer. Each gesture grows from the base
 * orbit, changes several parameters as one coherent move, and dissolves fully
 * back to neutral before the next gesture. Supplying a seed makes the motion
 * deterministic for tests; the renderer uses a fresh seed on every page load.
 */
export function createGaussianAutopilot(seed = 1) {
  const random = createRandom(seed);
  const between = (min, max) => min + (max - min) * random();
  const signed = (min, max) => (random() < 0.5 ? -1 : 1) * between(min, max);
  let phase = 'rest';
  let elapsed = 0;
  let duration = between(1.5, 3.5);
  let previousKind = -1;
  let kindBag = [];
  let horizontalDirection = random() < 0.5 ? -1 : 1;
  let verticalDirection = random() < 0.5 ? -1 : 1;
  let gesture = neutralAutopilotFrame();

  const chooseGesture = () => {
    if (kindBag.length === 0) {
      kindBag = [0, 1, 2, 3, 4];
      for (let index = kindBag.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(random() * (index + 1));
        [kindBag[index], kindBag[swapIndex]] = [kindBag[swapIndex], kindBag[index]];
      }
      if (kindBag[kindBag.length - 1] === previousKind) {
        [kindBag[0], kindBag[kindBag.length - 1]] = [kindBag[kindBag.length - 1], kindBag[0]];
      }
    }

    const kind = kindBag.pop();
    previousKind = kind;

    if (kind === 0) {
      // A restrained surge with a small change in the point of attention.
      gesture = {
        speedScale: 1 + between(0.12, 0.28),
        phaseOffset: signed(0.02, 0.05),
        roll: signed(0.008, 0.018),
        lookYaw: signed(0.018, 0.035),
        lookPitch: signed(0.012, 0.025),
      };
    } else if (kind === 1) {
      // A slow breath that remains visibly in motion instead of feeling paused.
      gesture = {
        speedScale: between(0.62, 0.78),
        phaseOffset: signed(0.03, 0.065),
        roll: signed(0.012, 0.025),
        lookYaw: signed(0.03, 0.055),
        lookPitch: signed(0.02, 0.04),
      };
    } else if (kind === 2) {
      // A sober bank: roll leads, but the orbit stays close to its composition.
      gesture = {
        speedScale: 1 + signed(0.06, 0.12),
        phaseOffset: signed(0.04, 0.08),
        roll: signed(0.032, 0.05),
        lookYaw: signed(0.045, 0.075),
        lookPitch: signed(0.025, 0.05),
      };
    } else if (kind === 3) {
      // Look clearly to either side without moving the orbital latitude.
      gesture = {
        speedScale: 1 + signed(0.05, 0.1),
        phaseOffset: signed(0.05, 0.1),
        roll: signed(0.015, 0.032),
        lookYaw: horizontalDirection * between(0.075, 0.11),
        lookPitch: signed(0.02, 0.05),
      };
      horizontalDirection *= -1;
    } else {
      // Look above or below the origin by changing aim, not camera distance.
      gesture = {
        speedScale: 1 + signed(0.04, 0.1),
        phaseOffset: signed(0.04, 0.085),
        roll: signed(0.012, 0.03),
        lookYaw: signed(0.025, 0.055),
        lookPitch: verticalDirection * between(0.065, 0.095),
      };
      verticalDirection *= -1;
    }
  };

  const advancePhase = () => {
    elapsed = 0;

    if (phase === 'rest') {
      chooseGesture();
      phase = 'attack';
      duration = between(5, 15);
    } else if (phase === 'attack') {
      phase = 'return';
      duration = between(5, 15);
    } else {
      phase = 'rest';
      duration = between(2.5, 6);
      gesture = neutralAutopilotFrame();
    }
  };

  return {
    sample(deltaSeconds = 0) {
      let remaining = Math.max(0, Number(deltaSeconds) || 0);

      // Consume across boundaries so hidden tabs or low frame rates never skip
      // a return-to-base phase or introduce a discontinuity.
      while (remaining > 0) {
        const available = Math.max(0, duration - elapsed);
        if (available <= 1e-9) {
          advancePhase();
          continue;
        }
        const consumed = Math.min(remaining, available);
        elapsed += consumed;
        remaining -= consumed;

        if (elapsed >= duration - 1e-9) advancePhase();
      }

      if (phase === 'rest') return neutralAutopilotFrame();

      const progress = smootherstep(elapsed / Math.max(0.001, duration));
      const envelope = phase === 'attack' ? progress : 1 - progress;

      return {
        speedScale: 1 + (gesture.speedScale - 1) * envelope,
        phaseOffset: gesture.phaseOffset * envelope,
        roll: gesture.roll * envelope,
        lookYaw: gesture.lookYaw * envelope,
        lookPitch: gesture.lookPitch * envelope,
      };
    },
  };
}

/**
 * Frame-rate-independent exponential damping.
 * A short delta cap prevents a hidden tab from causing a camera jump.
 */
export function damp(current, target, response, deltaSeconds) {
  const dt = Math.max(0, Math.min(0.05, deltaSeconds));
  return current + (target - current) * (1 - Math.exp(-response * dt));
}

/**
 * Maps the full viewport to a tiny camera-aim bias. Unlike proximity, this
 * never changes radius or orbit speed; it only lets the scene acknowledge the
 * pointer by a few degrees while damping in the renderer absorbs quick moves.
 */
export function gaussianPointerLook({
  clientX = 0,
  clientY = 0,
  viewportWidth = 1,
  viewportHeight = 1,
} = {}) {
  const width = Math.max(1, viewportWidth);
  const height = Math.max(1, viewportHeight);
  const horizontal = clamp((clientX / width - 0.5) * 2, -1, 1);
  const vertical = clamp((clientY / height - 0.5) * 2, -1, 1);

  return {
    yaw: horizontal * 0.045,
    pitch: (-vertical * 0.035) || 0,
  };
}

/**
 * Keeps the on-screen zoom focus attached to the hero as that section moves
 * through the viewport. Values are normalized for gaussianFocusProximity.
 */
export function gaussianFocusPoint({
  viewportHeight = 1,
  hostTop = 0,
  focusX = 0.72,
  focusY = 0.54,
} = {}) {
  const height = Math.max(1, viewportHeight);

  return {
    focusX,
    focusY: focusY + hostTop / height,
  };
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
  const middle = 1 - smoothstep(unit * 0.18, unit * 0.82, distance);
  const core = 1 - smoothstep(unit * 0.16, unit * 0.48, distance);
  const maximumArea = 1 - smoothstep(unit * 0.16, unit * 0.2, distance);
  const field = 0.14 + 0.28 * broad + 0.28 * middle + 0.3 * core;

  return clamp(Math.max(field, maximumArea), 0, 1);
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
  zoomScale = 1,
  timeSeconds = 0,
} = {}) {
  const progress = clamp(scrollProgress, 0, 1);
  const focus = clamp(focusProximity, 0, 1);
  const scale = clamp(zoomScale, 1, 3);

  // 20s and 37s periods never settle into an obvious short loop.
  const slowA = Math.sin(timeSeconds * 0.31);
  const slowB = Math.sin(timeSeconds * 0.17 + 1.3);

  return {
    radius: clamp(
      6 + 0.09 * slowA + 0.04 * slowB - 2.65 * focus,
      3.45,
      6.55,
    ) / scale,
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
