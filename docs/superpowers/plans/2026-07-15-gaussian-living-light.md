# Gaussian Living Light Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the car reconstruction shift and add smooth procedural lighting, psychedelic palettes, energy pulses, and chromatic transition accents to both Gaussian scenes.

**Architecture:** Keep camera, reconstruction geometry, and lighting independent. A pure seeded light autopilot outputs smoothly interpolated values; the existing shader consumes those values in object space, while scene profiles compensate for each scene's zoom and density.

**Tech Stack:** Astro, browser JavaScript modules, WebGL2 GLSL vertex shader patch, Node test runner.

---

### Task 1: Scene profile and lighting autopilot

**Files:**
- Modify: `site/src/scripts/gaussian-particle-effects.mjs`
- Modify: `site/tests/gaussian-particle-effects.test.mjs`

- [x] **Step 1: Write failing profile and autopilot tests**

Import `gaussianParticleProfile` and `createGaussianLightAutopilot`; assert the people profile remains `{ displacement: 0.13, transitionOpacity: 0.32 }`, the car's zoomed displacement never exceeds the people's screen-space displacement, and the car erosion is at least twice as strong. Sample two identical seeds and one different seed for 600 seconds; assert repeatability, divergence, bounded ambient/intensity/chromatic values, palette variety, and per-frame continuity.

- [x] **Step 2: Run tests and confirm RED**

Run: `node --test --test-name-pattern="car scene trades|lighting autopilot" tests/gaussian-particle-effects.test.mjs`

Expected: failure because the exports do not exist.

- [x] **Step 3: Implement pure controllers**

Add:

```js
export function gaussianParticleProfile(placement = 'hero-right') {
  return placement === 'section-left'
    ? { displacement: 0.075, transitionOpacity: 0.68 }
    : { displacement: 0.13, transitionOpacity: 0.32 };
}

export function createGaussianLightAutopilot(seed = 1) {
  // Seeded 6–16 second states interpolated with damped smoothstep curves.
  // Returns lightCenter, lightRadius, lightIntensity, ambient,
  // tintA, tintB, chromatic, and energyPulse.
}
```

- [x] **Step 4: Run targeted tests and confirm GREEN**

Run the Step 2 command. Expected: all matching tests pass.

### Task 2: Shader lighting and color

**Files:**
- Modify: `site/src/scripts/gaussian-particle-effects.mjs`
- Modify: `site/tests/gaussian-particle-effects.test.mjs`

- [x] **Step 1: Extend failing shader/controller tests**

Assert the shader contains transition opacity plus object-space light center/radius/intensity/ambient, two tint colors, chromatic strength, and energy pulse uniforms. Pass out-of-range controller values and assert scalar/vector clamps.

- [x] **Step 2: Run tests and confirm RED**

Run: `node --test --test-name-pattern="shader augmentation|uniform controller" tests/gaussian-particle-effects.test.mjs`

Expected: missing lighting uniforms.

- [x] **Step 3: Implement GLSL lighting**

Calculate a soft spherical light from `particleNormalized`, preserve readable minimum exposure, blend palette tints inside the light, add a travelling energy shell, and apply chromatic color only at reconstruction/scan fronts. Replace the fixed `0.32` transition alpha with the clamped profile uniform.

- [x] **Step 4: Run targeted tests and confirm GREEN**

Run the Step 2 command. Expected: all matching tests pass.

### Task 3: Runtime integration

**Files:**
- Modify: `site/src/components/GaussianBackground.astro`
- Modify: `site/tests/site-integrity.test.mjs`

- [x] **Step 1: Write failing integration assertions**

Assert the component creates one scene profile and one seeded light autopilot, samples lighting each frame, and forwards `transitionOpacity`, `displacement`, and every lighting field to the particle controller.

- [x] **Step 2: Run tests and confirm RED**

Run: `node --test --test-name-pattern="both Gaussians opt" tests/site-integrity.test.mjs`

Expected: missing profile/light wiring.

- [x] **Step 3: Wire runtime values**

Export/import both helpers through `window.__gsBgParticles`; create the controllers after splat load; sample lighting in the render loop and merge it into `particleController.update`. Use the existing placement seed so the two worlds remain asynchronous.

- [x] **Step 4: Run targeted and full verification**

Run: `npm test`

Expected: all tests pass. Then verify `Invoke-WebRequest http://localhost:4322/code` returns HTTP 200.

### Task 4: Blackout ember

**Files:**
- Modify: `site/src/scripts/gaussian-particle-effects.mjs`
- Modify: `site/tests/gaussian-particle-effects.test.mjs`

- [x] **Step 1: Write a failing shader assertion**

Assert that blackout is derived from ambient level, an object-space ember center moves subtly around the origin, its radius is capped near 0.40 m, and its warm energy is added after ambient exposure.

- [x] **Step 2: Run the assertion and confirm RED**

Run: `node --test --test-name-pattern="blackout retains" tests/gaussian-particle-effects.test.mjs`

Expected: failure because the ember shader field does not exist.

- [x] **Step 3: Implement the localized ember**

Use `particleLocalPos`, `uParticleCoreRadius`, and `uParticleFlowTime` to create a small moving sphere. Fade it in only below ambient `0.22`, keep the radius between 0.35 and 0.40 m, and add intense amber light without raising global ambient exposure.

- [x] **Step 4: Run targeted and full tests**

Run the Step 2 command, then `npm test`. Expected: all tests pass.

## Self-Review

Execution Consistency Audit evidence:
- PASS Test/implementation trace: every new assertion maps to the profile, light autopilot, shader uniform, controller clamp, or component wiring described in its task.
- PASS Per-task command executability: Node tests and npm scripts already exist in the current site worktree.
- PASS File usage audit: the component imports the script helpers and site-integrity tests read the component source.
- PASS Spec lifecycle audit: scene state is created after splat load, sampled per frame, and discarded with the disconnected stage.
- PASS Time source audit: light transitions use render-loop monotonic delta seconds only.
- PASS State scope audit: each Gaussian owns its own autopilot closure and seeded state.
- PASS Environment audit: verification targets the existing desktop-only localhost development server.
- PASS Browser event audit: no new browser event path is introduced; the existing click toggle remains unchanged.
- PASS Lint/import audit: ESM named exports are added before their Astro imports; no new dependency is introduced.
- PASS Non-obvious API audit: existing shader interception is unchanged; new behavior uses uniforms already controlled through the verified WebGL program.
