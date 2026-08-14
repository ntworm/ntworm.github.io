# Gaussian LOD Preview Design

**Date:** 2026-08-14
**Status:** Approved
**Repository:** `C:\Users\Usuario\repos\portfolio`
**Branch:** `perf/gaussian-lod-preview`

## Context

The previous change (`2026-08-13-predictive-gaussian-loading-design.md`) removed
both `.splat` files from the initial homepage payload. The homepage now costs
966 KB and 10 requests instead of 155.6 MB, and each scene starts downloading
about two viewports before its chapter arrives.

Real-world testing on the deployed site exposed the remaining problem. The full
scenes are 84.7 MB (`carro.splat`, 2,774,466 points) and 70.9 MB
(`luzoebreno.splat`, 2,324,805 points). Even with predictive loading, a visitor
on an ordinary connection can reach the Code chapter roughly ten seconds before
the artwork appears. During that window the section shows only the blurred
poster, so a visitor who scrolls at normal speed can pass the artwork entirely
without ever learning it is there. The performance work succeeded; the perceived
result regressed.

The fix is a level-of-detail pair. A tiny preview of each scene loads with the
page and renders in the same position with the same camera, so something is
always present. The full scene loads on approach and cross-fades over the
preview.

Both `.splat` files use the gsplat 32-byte record layout with no header:
position as three `float32` (bytes 0-11), scale as three `float32` (bytes 12-23),
color as four `uint8` (bytes 24-27), and rotation as a packed four-`uint8`
quaternion (bytes 28-31). Both file sizes divide evenly by 32, so a reduced
version is a subset of whole records and needs no format conversion.

## Goals

- Render a recognizable preview of each scene from the moment the page loads,
  in the same position and with the same camera choreography as the full scene.
- Keep each preview at or below 400 KB, targeting 10,000 points per scene.
- Cross-fade the full scene over its preview so arrival reads as densification,
  not as a swap.
- Continue the current loading policy for the full scenes without weakening it.
- Preserve the preview when the full scene fails, instead of falling back to the
  static poster.
- Re-evaluate the mobile breakpoint on resize so a widened window is no longer
  stuck in poster-only mode until reload.

## Non-goals

- No change to the full `.splat` files: no recompression, no re-export, no
  reduction in points, resolution, shaders, or camera choreography.
- No WebGL on mobile. Viewports below the breakpoint keep the poster only, and
  never download either the preview or the full scene.
- No change to the homepage layout, the 25 visible projects, or the Work and
  About chapters.
- No image or video optimization in this change.

## Decisions

These were settled during brainstorming and are not open in implementation.

**Budget: 10,000 points per scene, about 320 KB each.** The homepage initial
payload grows from 966 KB to roughly 1.6 MB. This is the smallest budget that
still loads in under a second on a weak connection, which is what guarantees the
preview is painted before any visitor can arrive.

**Appearance: original scale, sparse points.** Each point keeps the scale
recorded in the source file. The preview reads as a fine, granular dust cloud
rather than a soft blurred volume. Inflating the scale to hide the gaps was
considered and rejected; the granular look suits the site's noir treatment.

**Selection: central crop, then uniform sampling.** Points beyond the 60th
percentile of distance from the centroid are discarded, and 10,000 points are
sampled uniformly from what remains. The crop concentrates a small budget where
the subject is, and discards the floaters and reconstruction noise that splat
captures accumulate at their edges. The full scene fills the periphery back in
during the cross-fade.

**Mobile: unchanged.** Viewports below `mobileBreakpoint` (768 px) keep the
blurred poster and pay zero GPU and zero bytes.

## Considered approaches

### 1. Two renderers, CSS cross-fade (chosen)

The preview mounts its own canvas at attach time. The full scene mounts a second
canvas on approach. When the full scene is ready, CSS raises its opacity while
the preview's falls, and the preview renderer is then disposed.

`__gsBgStart(src, stage)` already returns a controller exposing `setActive`,
`dispose`, and `getState`, so this is the same entry point invoked twice with
different sources. The cross-fade is pure CSS and needs no shader work.

The cost is two live WebGL contexts per scene during the transition, so four on
the homepage for about one second. Browsers permit roughly sixteen.

### 2. One renderer, swapping the object inside a single scene

Load the preview into the scene, then add the full object and remove the preview
object. This uses one context and less memory, but there is no cross-fade: the
swap is instantaneous unless per-object opacity is added to the shader. The
shader is already patched by the digital dust effect, and entangling level of
detail with that patch is the most likely way to damage the artwork. Rejected.

### 3. Pre-rendered video or sprite preview

Cheapest at runtime, but it does not orbit with the real camera, so it breaks the
requirement that the preview occupy the same position and move the same way. In
practice this is the poster that already exists. Rejected.

## Architecture

### Offline generation

`site/scripts/generate-splat-preview.mjs` reads a source `.splat` as 32-byte
records, computes the centroid of all positions, measures each point's distance
from it, discards every point beyond the configured percentile radius, and then
samples the configured budget uniformly from the survivors using a seeded
pseudorandom generator. Scale, color, and rotation bytes are copied verbatim.

The generator is `mulberry32`, chosen because it is eight lines, needs no
dependency, and is deterministic across Node versions. The seed makes output
byte-identical across runs, so regeneration is verifiable and the committed
artifact is stable.

If the crop leaves fewer survivors than the budget, every survivor is written and
the real count is recorded in the manifest. At the 60th percentile both scenes
leave over 1.6 million survivors, so this is a guard, not an expected path.

Outputs, committed to the repository:

- `site/public/work/code/splats/carro/carro.preview.splat`
- `site/public/work/code/splats/luzoebreno/luzoebreno.preview.splat`
- `site/public/work/code/splats/previews.manifest.json`

The manifest records, per scene: the source path, the source file's SHA-256, the
source point count, the budget, the percentile, the seed, the resulting point
count, the resulting radius bound, and the output's SHA-256. Its purpose is drift
detection — if someone replaces a source `.splat` and forgets to regenerate, the
recorded source hash no longer matches.

Generation is not a build step. Reading 155 MB on every CI run would be slow and
pointless, because the sources only change when the artwork changes.

### Runtime

Each `.gs-bg` mount controller gains a stage in its state machine:

```
waiting -> preview -> loading -> live
```

with the existing terminal states `poster-only`, `failed`, and `disposed`, plus a
new non-terminal `preview-failed`.

The preview mounts at attach, with no observer involved. The full scene keeps
today's policy exactly: an `IntersectionObserver` with `200%` root margin on
normal hardware, and `0px` under `Save-Data` or `deviceMemory <= 2`. The preview
loads under `Save-Data` as well; at 320 KB it costs less than a single homepage
card image.

The preview renders with camera motion enabled and the particle shader disabled.
The digital dust is expensive and was designed for the full point cloud, so it
arrives together with the cross-fade.

### Camera continuity

The camera is sampled with `timeSeconds: activeSeconds`, a clock that only
accumulates while a scene is active. If the preview has been running for thirty
seconds and the full scene starts its own clock at zero, the orbit jumps at the
exact moment of the cross-fade, which is when the visitor is most likely to be
looking.

`__gsBgStart` therefore accepts an initial time offset, and the full scene
inherits the preview's accumulated `activeSeconds` at start. `createPausableFrameLoop`
gains a matching `initialActiveSeconds` option.

## Behavior

### Cross-fade

On full-scene readiness the full canvas transitions from 0 to 0.92 opacity over
900 ms while the preview canvas transitions to 0 over the same window. The
preview renderer is disposed on `transitionend`, guarded by a 1200 ms timeout,
because `transitionend` does not fire when a transition is interrupted or its
element is hidden, and without the guard the preview's WebGL context would leak.

Under `prefers-reduced-motion: reduce` the exchange is immediate, with no
transition, matching the existing posture elsewhere in the site.

### Failure handling

- Preview fails to load or mount: state becomes `preview-failed`, the poster
  stays visible, and the full scene is still attempted. The preview never blocks
  the primary path.
- Full scene fails: the preview stays live indefinitely. This is strictly better
  than the current behavior, which falls back to the static poster.
- Both fail: poster only, exactly as today.
- Second WebGL context creation fails because the browser's context limit was
  reached: dispose the preview and retry the full scene once. The real artwork
  wins any contest for a context.

### Breakpoint re-evaluation

A single debounced `resize` listener at module scope re-evaluates
`window.innerWidth < mobileBreakpoint` for every registered controller. Crossing
upward mounts the preview and arms the load observer; crossing downward disposes
both renderers and returns to poster-only.

This corrects existing behavior. The breakpoint is currently read once at attach,
so a visitor who loads the page in a narrow window and then maximizes it stays in
poster-only mode until a reload. The symptom was reproduced on the deployed site.

### Astro lifecycle

`astro:before-swap` disposes both the preview and the full renderer for every
`.gs-bg`, extending what already happens for the full renderer alone.

## Testing

The generator's pure functions — centroid, percentile radius, and seeded uniform
sampling — are tested against small synthetic buffers built in the test file. No
test reads an 84 MB source; the suite currently runs in under a second and must
stay that way.

The committed preview artifacts get a cheap integrity test: size divisible by 32,
a point count equal to the count recorded in the manifest, every point within the
radius recorded in the manifest, and a SHA-256 matching the manifest entry. The
manifest's own recorded count is separately asserted to equal the 10,000 budget,
so a silently shrunken preview cannot pass by rewriting the manifest alone. A byte ceiling of 400 KB per preview
is asserted as the guard against the regression this change most risks.

The mount controller is tested for: the `waiting -> preview -> loading -> live`
progression; preview disposal after the cross-fade, including the timeout guard
path; a full-scene failure preserving the preview; viewports below the breakpoint
staying in `poster-only` and requesting nothing; `Save-Data` gating only the full
scene while the preview still loads; and `activeSeconds` inheritance from preview
to full scene. The resize re-evaluation is tested in both directions.

## Acceptance criteria

- The homepage requests both preview files and neither full `.splat` at load.
- Homepage initial transfer stays at or below 1.7 MB.
- Both previews are visible and orbiting before the Code chapter is reached.
- Reaching the Code chapter cross-fades to the full scene with no camera jump.
- Killing the full-scene request leaves the preview rendering, not the poster.
- Below 768 px, neither preview nor full scene is requested.
- Widening the window past 768 px mounts the preview without a reload.
- The full suite passes and the production audit reports zero high advisories.
