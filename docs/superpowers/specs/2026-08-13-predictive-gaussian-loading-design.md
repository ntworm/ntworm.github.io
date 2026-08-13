# Predictive Gaussian Loading Design

**Date:** 2026-08-13  
**Status:** Approved direction; awaiting written-spec review  
**Repository:** `C:\Users\Usuario\repos\portfolio\.worktrees\hydra-adaptive-preview`

## Context

The continuous homepage currently preloads both Gaussian splats in the document
head and mounts both WebGL scenes as soon as the page loads. The files are about
71 MiB and 85 MiB, so a visitor pays roughly 156 MiB of splat transfer before
reaching the Code chapter. Both `requestAnimationFrame` loops then keep rendering
while their sections are far outside the viewport.

The artwork itself is approved. This change must preserve the exact splat files,
renderer resolution, camera choreography, particle shaders, lighting, placement,
masks, and transitions. Optimization is limited to loading and runtime lifecycle.

## Goals

- Do not request either `.splat` during the initial About and Work experience.
- Predictively start the first scene before the Code chapter becomes visible.
- Start the second scene only when its lower showcase is approaching.
- Start the first scene immediately when the visitor clicks a `#code` navigation
  link or opens the page directly at `/#code`.
- Keep a lightweight matching poster visible until the live renderer is ready.
- Load each scene at most once per document lifetime.
- Pause a loaded scene when it is far from the viewport or the tab is hidden.
- Resume a paused scene immediately without re-fetching or rebuilding it.
- Clean up observers, animation frames, listeners, renderers, and canvases during
  Astro document swaps.

## Non-goals

- No lower-resolution splats, reduced particle counts, lower canvas resolution,
  lower frame-rate target, or simplified shader tier.
- No permanent poster-only mode for normal desktop visitors.
- No unloading a successfully loaded scene merely because it moved offscreen.
- No splat recompression or asset replacement in this change.
- No unrelated Work image or media optimization in this change.

## Considered approaches

### 1. Load only after a scene becomes visible

This minimizes speculative network work but makes a 71–85 MiB download begin too
late. Fast scrolling or a Code navigation click can expose the poster for a long
time. It is rejected because it risks degrading the portfolio experience.

### 2. Predictive proximity loading — selected

Each scene has an independent observer on its semantic section host rather than
the overscanned `.gs-bg` element. A generous forward margin starts the download
before the artwork is visible, while navigation intent can bypass the wait. Once
loaded, a second visibility observer controls only rendering. This preserves the
finished image and avoids paying for Code when a visitor never approaches it.

### 3. Load both scenes during browser idle time

This usually hides loading latency, but still transfers 156 MiB for visitors who
never reach Code. It is rejected because it keeps the largest initial-load cost.

## Architecture

### Predictive load controller

`GaussianBackground.astro` will attach one lifecycle controller per `.gs-bg`.
The controller owns the scene's load observer, activity observer, current state,
and cleanup callback. Dataset flags remain for idempotence across repeated
`astro:page-load` events.

Loading observes the semantic host (`.code__hero` or
`.code__lower-showcase`) rather than `.gs-bg`, whose large negative top and bottom
overscan would make intersection timing misleading.

The default load margin is `200% 0px`, matching the repository's existing image
prewarm convention. It means the scene may begin preparing up to about two
viewport heights before its host. The observer unobserves the host as soon as
loading begins because a scene loads at most once.

If `IntersectionObserver` is unavailable, the controller safely starts the scene
instead of leaving an empty artwork. Mobile behavior below the existing breakpoint
continues to use the matching poster and does not initialize WebGL.

### Navigation-intent acceleration

The first Gaussian begins loading immediately when any link targeting `#code` is
activated. Direct entry with `location.hash === '#code'` also begins immediately.
The proximity observer remains the normal path for scroll navigation. These
triggers call the same idempotent `load()` method and therefore cannot duplicate
fetches or renderers.

### Poster continuity

The matching poster is assigned before waiting for the load observer, so the
section always has a coherent visual surface. The existing live-canvas opacity
transition remains unchanged and fades the exact WebGL scene over the poster only
after `LoadAsync` completes.

### Runtime pause and resume

The dynamically created Gaussian runtime will return a controller with
`setActive(active)` and `dispose()` methods instead of returning only after setup.
It tracks a single animation-frame identifier and a `running` flag.

- `setActive(true)` schedules one frame only when no loop is running and resets
  the delta-time origin so a long pause cannot jump the animation.
- `setActive(false)` cancels the pending frame and leaves scene, camera, renderer,
  particle state, and canvas intact.
- The activity observer uses the semantic host with `rootMargin: '75% 0px'`, so a
  loaded scene is active shortly before and after its visible interval.
- `document.visibilitychange` pauses every scene while the tab is hidden and
  resumes only scenes whose host is still in the active zone.

No rendering parameter changes between active and paused states. Animation time is
accumulated only while active and is passed to time-based camera sampling instead
of raw `performance.now()`, preventing a phase jump after a long pause. Resume
continues the retained artwork without another network request.

### Astro lifecycle and cleanup

The module keeps one page-level cleanup registry. Before a new attach cycle and
on `astro:before-swap`, it disconnects observers and disposes controllers belonging
to the outgoing document.

`dispose()` cancels the frame, removes resize/pointer/click listeners, calls the
renderer disposal API, removes the appended canvas, and makes later callbacks no-op.
After every awaited engine or splat load boundary, code checks that the host remains
connected and the controller has not been disposed before attaching or starting a
renderer. This prevents an in-flight download from reviving an orphaned scene.

## State model

Each background moves forward through these load states:

1. `waiting`: poster assigned; predictive observer armed.
2. `loading`: engine and selected splat loading; repeat triggers ignored.
3. `ready-paused`: renderer built, retained, and not scheduling frames.
4. `ready-active`: exactly one animation loop is scheduling frames.
5. `disposed`: all runtime resources and callbacks inactive.

`loading` never returns to `waiting`, and a successfully loaded scene alternates
only between `ready-paused` and `ready-active` until disposal.

## Error handling

- Engine or splat failure leaves the matching poster visible and logs one scoped
  error; the rest of the page remains functional.
- A failed scene does not enter an animation loop.
- Duplicate proximity, hash, click, and Astro events are absorbed by the same
  idempotent state machine.
- If navigation removes a host during loading, completion performs cleanup rather
  than appending a canvas to the detached node.

## Testing and verification

### Automated tests

- Replace the existing eager-loading contract test with a predictive-loading
  contract that rejects homepage splat preloads and requires independent
  `IntersectionObserver` setup.
- Assert that navigation intent and direct `#code` entry call the idempotent first
  scene loader.
- Add pure lifecycle tests for single-loop pause/resume behavior, hidden-tab
  gating, duplicate activation, and disposal.
- Preserve all existing structural, camera-motion, particle-effect, placement,
  mask, and build-integrity tests.

### Browser verification

- At the top of a cold page, network inspection shows zero `.splat` requests.
- Approaching Code starts only `luzoebreno.splat` before its artwork is visible.
- Approaching the lower showcase starts `carro.splat` independently.
- Navigating through a `#code` link starts the first load immediately.
- A ready offscreen scene reports paused and its rendered frame count stops.
- Returning to the scene resumes without a new `.splat` request.
- Hiding the tab pauses both scenes and showing it resumes only the nearby scene.
- The live Gaussian screenshots match the approved composition with no resolution,
  shader, particle, mask, or placement changes.

## Acceptance criteria

- Initial `.splat` transfer is 0 bytes before the predictive Code boundary.
- No two `.splat` files begin merely because the homepage loaded.
- Each scene performs at most one splat load and owns at most one animation loop.
- Offscreen and hidden-tab scenes perform no WebGL rendering.
- Returning to a loaded scene is immediate and performs no new splat request.
- The final live artwork has identical source assets and rendering parameters to
  the current approved version.
- The full build and test suite pass, with browser evidence for network timing,
  pause/resume, navigation, and visual continuity.
