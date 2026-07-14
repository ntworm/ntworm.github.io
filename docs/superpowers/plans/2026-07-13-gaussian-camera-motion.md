# Gaussian Camera Motion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give both Code-page Gaussians reversible scroll/pointer camera interaction and independent autonomous camera performances while keeping their pivots fixed at the splat origins.

**Architecture:** Add a pure ESM motion sampler for bounded camera targets and frame-rate-independent damping. The existing `GaussianBackground.astro` WebGL loop owns DOM input and camera application; an explicit prop enables the sampler only for the hero instance.

**Tech Stack:** Astro 7, browser JavaScript, gsplat.js, Node `node:test`

---

## Approved visual-review revision

### Autonomous camera revision

Both scenes now create an independent seeded autopilot on mount. Gestures use smooth five-to-fifteen-second attack and return envelopes, always cross the neutral base orbit between actions, and combine bounded speed, orbital phase, roll, and camera-aim changes. Speed remains within `0.62..1.28` of normal and roll within roughly three degrees. Autonomous up/down/left/right movement is applied to the point of attention, not to orbital pitch or radius, so it cannot suddenly pull the capture away. Gesture types run through a shuffled bag and strong horizontal/vertical directions alternate for long-term balance. The live renderer supplies a random per-load seed while unit tests supply fixed seeds, allowing the choreography to remain fresh in production and reproducible in verification. Reduced-motion mode bypasses the autopilot.

The pointer has a second, deliberately subtle channel independent from radial zoom: the full viewport maps to at most `+/-0.045` radians of yaw and `+/-0.035` radians of pitch. These aim offsets are damped inside each scene and never alter orbit speed, phase, scroll position, or autonomous gesture state.

The browser reviews supersede the original axis-mapped pointer snippets later in this execution record. Pointer X/Y must not affect pitch, phase, or speed. The implemented interaction converts distance from the marked focus, initially at `72% × 54%` for the hero and `28% × 54%` for the lower scene, into three overlapping proximity bands and applies them only to radius. The focus Y coordinate is recomputed from the owning section's current `getBoundingClientRect().top` every frame, so it follows each Gaussian during scroll even when the pointer is stationary. The proximity target itself is damped before camera sampling to absorb fast pointer gestures. Influence starts at a perceptible `0.14` at the farthest yellow edge, increases through the light-red band, and holds maximum zoom throughout a core radius equal to `16%` of the shorter viewport dimension.

The entire radius range is divided by a placement-specific zoom scale: `1.5` for the hero and `2.5` for the lower Gaussian. This makes both their ambient and focused states closer while preserving the same proportional pointer gesture. The pure module and integration tests enforce the scale, enlarged maximum area, and whole-page influence.

Scroll is also isolated from the orbit: it produces only a reversible `0..8%` canvas Y offset through `--gs-scroll-y` on both scenes. Radius, pitch, phase, and angular speed remain identical for the same pointer/time inputs regardless of scroll position, preventing reverse scroll from visually cancelling the rotation. The live masks and veils are widened symmetrically so more of each splat can spill into the surrounding page without changing card stacking.

## File map

- Create `site/src/scripts/gaussian-camera-motion.mjs`: pure clamping, smooth curve, camera target sampling, and exponential damping.
- Create `site/tests/gaussian-camera-motion.test.mjs`: direct unit coverage of the pure module.
- Modify `site/src/components/GaussianBackground.astro`: expose the helper to the gsplat Blob module, collect pointer/scroll input, and apply inertial targets.
- Modify `site/src/pages/code.astro`: enable camera motion only on the first Gaussian.
- Modify `site/tests/site-integrity.test.mjs`: guard the one-instance scope and fixed-origin orbit.

### Task 1: Pure camera motion sampler

- [ ] **Step 1: Write the failing unit tests**

Create `site/tests/gaussian-camera-motion.test.mjs` importing `sampleGaussianCamera` and `damp` from the not-yet-created module. Assert deterministic/reversible sampling for identical scroll and time, clamping of pointer input, radius/pitch/speed bounds over a grid, absence of any target/pan field, and monotonic damping without overshoot.

```js
import assert from 'node:assert/strict';
import test from 'node:test';
import { damp, sampleGaussianCamera } from '../src/scripts/gaussian-camera-motion.mjs';

test('camera sampling is deterministic and scroll-reversible', () => {
  const input = { scrollProgress: 0.37, pointerX: 0.25, pointerY: -0.4, timeSeconds: 12 };
  assert.deepEqual(sampleGaussianCamera(input), sampleGaussianCamera(input));
});

test('pointer influence is clamped and never introduces target drift', () => {
  assert.deepEqual(
    sampleGaussianCamera({ pointerX: 999, pointerY: -999, timeSeconds: 4 }),
    sampleGaussianCamera({ pointerX: 1, pointerY: -1, timeSeconds: 4 }),
  );
  assert.deepEqual(Object.keys(sampleGaussianCamera()).sort(), ['angularSpeed', 'phaseOffset', 'pitch', 'radius']);
});

test('camera targets stay inside the cinematic safety bounds', () => {
  for (const scrollProgress of [0, 0.25, 0.5, 0.75, 1]) {
    for (const pointerX of [-1, 0, 1]) {
      for (const pointerY of [-1, 0, 1]) {
        const value = sampleGaussianCamera({ scrollProgress, pointerX, pointerY, timeSeconds: 19 });
        assert.ok(value.radius >= 5.05 && value.radius <= 6.55);
        assert.ok(value.pitch >= -0.27 && value.pitch <= 0.03);
        assert.ok(value.angularSpeed >= 0.075 && value.angularSpeed <= 0.14);
      }
    }
  }
});

test('damping approaches a target monotonically without overshoot', () => {
  let value = 0;
  for (let frame = 0; frame < 120; frame += 1) {
    const next = damp(value, 1, 3.2, 1 / 60);
    assert.ok(next >= value && next <= 1);
    value = next;
  }
  assert.ok(value > 0.99);
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test tests/gaussian-camera-motion.test.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `src/scripts/gaussian-camera-motion.mjs`.

- [ ] **Step 3: Implement the minimal pure module**

Create `site/src/scripts/gaussian-camera-motion.mjs` with this public API:

```js
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const smoothstep = (edge0, edge1, value) => {
  const x = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return x * x * (3 - 2 * x);
};

export function damp(current, target, response, deltaSeconds) {
  const dt = Math.max(0, Math.min(0.05, deltaSeconds));
  return current + (target - current) * (1 - Math.exp(-response * dt));
}

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
  const slowA = Math.sin(timeSeconds * 0.31);
  const slowB = Math.sin(timeSeconds * 0.17 + 1.3);

  return {
    radius: clamp(6 - 0.72 * approach + 0.3 * exit + 0.09 * slowA + 0.04 * slowB - 0.06 * py, 5.05, 6.55),
    pitch: clamp(-0.15 + 0.07 * approach + 0.065 * py + 0.022 * slowB, -0.27, 0.03),
    phaseOffset: 0.28 * smoothstep(0, 1, progress) + 0.12 * px + 0.03 * slowA,
    angularSpeed: clamp(0.108 * (1 + 0.13 * slowB + 0.09 * approach + 0.06 * px), 0.075, 0.14),
  };
}
```

Use a base radius of `6`, base pitch of `-0.15`, and base angular speed of `0.108` radians/second. Keep the resulting radius within `5.05..6.55`, pitch within `-0.27..0.03`, pointer phase contribution within `±0.12`, and angular speed within `0.075..0.14`.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `node --test tests/gaussian-camera-motion.test.mjs`

Expected: all camera-motion tests pass.

### Task 2: First-Gaussian integration

- [ ] **Step 1: Write failing integration assertions**

Extend `site/tests/site-integrity.test.mjs` to require:

```js
assert.match(hero, /data-camera-motion="1"/);
assert.doesNotMatch(lower, /data-camera-motion="1"/);
assert.match(gaussianSource, /sampleGaussianCamera/);
assert.match(gaussianSource, /new SPLAT\.Vector3\(0, 0, 0\)/);
```

- [ ] **Step 2: Run the focused integrity test and verify RED**

Run:

```powershell
npm run build
node --test --test-name-pattern="camera motion" tests/site-integrity.test.mjs
```

Expected: FAIL because the hero has no camera-motion marker and the component does not use the sampler.

- [ ] **Step 3: Add the explicit opt-in and render-loop integration**

In `GaussianBackground.astro`, add `cameraMotion?: boolean`, emit `data-camera-motion="1"` only when enabled, import the pure helpers, and expose them on `window.__gsBgMotion` before loading the Blob module. Inside `window.__gsBgStart`:

```js
const hasCameraMotion = stage.dataset.cameraMotion === '1';
const target = new SPLAT.Vector3(0, 0, 0);
let pointerX = 0;
let pointerY = 0;
let angle = 0;
let radius = 6;
let pitch = -0.15;
let phaseOffset = 0;
let angularSpeed = 0.108;
```

Listen for `pointermove` on `window`, normalize around the viewport center, and sample local scroll as `clamp(-host.getBoundingClientRect().top / host.getBoundingClientRect().height, 0, 1)`. Each frame, damp radius, pitch, phase, and speed toward the pure sampler's outputs; integrate `angle += angularSpeed * deltaSeconds`; call the existing fixed-origin look-at math with `angle + phaseOffset`. Under reduced motion or when opt-in is false, retain a calm constant orbit. Stop the frame and remove listeners when the stage disconnects.

In `code.astro`, set `cameraMotion={true}` only on the `hero-right` `GaussianBackground`; leave `section-left` unchanged.

- [ ] **Step 4: Run focused and full verification**

Run:

```powershell
node --test tests/gaussian-camera-motion.test.mjs
npm test
```

Expected: camera tests pass, Astro builds all pages, and the complete integrity suite passes.

- [ ] **Step 5: Verify the live server**

Open `http://localhost:4321/code/`. Confirm the first camera accelerates/decelerates smoothly, scroll retraces its curve upward, pointer position biases rather than controls the orbit, the origin stays centered, and the second Gaussian remains unchanged.

## Self-Review

Spec coverage: the fixed pivot, first-only scope, reversible scroll, pointer bias, slow oscillation, damping, reduced motion, and verification requirements all map to Tasks 1–2. No placeholders or unrelated refactors remain.

Execution Consistency Audit evidence:

- PASS Test/implementation trace: every unit assertion maps to an exported sampler/damping behavior; integration assertions map to explicit markup and component source.
- PASS Per-task command executability: `node --test` and `npm test` already exist in the repository workflow.
- PASS File usage audit: Astro imports the new module and Node tests import the same production file.
- PASS Spec lifecycle audit: the component stops animation and listeners when its stage disconnects; Astro remount uses the existing attach lifecycle.
- PASS Time source audit: animation time and delta both use monotonic `performance.now()` in seconds.
- PASS State scope audit: camera and pointer state live inside one `__gsBgStart` scene closure.
- N/A Environment audit: the feature introduces no network endpoint; manual review is desktop loopback only.
- PASS Browser event audit: production listens to real `pointermove` and scroll geometry; automated unit tests cover the resulting pure mapping, with manual gesture verification stated separately.
- PASS Lint/import audit: the ESM exports are imported by Astro and Node without extra dependencies or unused symbols.
- PASS Non-obvious API audit: the plan keeps the already-working gsplat camera APIs and uses standard DOM/performance APIs only.
