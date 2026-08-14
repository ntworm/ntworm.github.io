# Hydra Adaptive Resolution Preview

## Goal

Preserve the approved Lines and Cells artwork while proving that its internal
rendering resolution can follow the panel's current proportions under a fixed
pixel budget. The preview must remain visually recognizable before this
technique is folded into the wider portfolio performance work.

## Verified problem

The current remote sketch receives a 1280 x 720 iframe viewport, then calls
`pixelDensity(2.5)`. Browser inspection measured a visible p5 buffer of
3200 x 1800 plus a hidden Hydra buffer of approximately the same size. The
portfolio then stretches that iframe independently to fill a 1280 x 2028
background stage. This renders roughly 5.76 megapixels per buffer even though
the abstract background does not need that density.

## Preview approach

Keep the original fxhash seed and visual program, but serve a small same-origin
iframe shell from `site/public/hydra/`. The shell continues loading the original
immutable p5 and Hydra runtimes from the artwork's IPFS directory. Only the
resolution controller and sketch bootstrap become local and readable.

The iframe itself fills the panel at `100%` width and height. Inside it, the
sketch calculates a render size with the same aspect ratio as the live iframe
viewport and a maximum budget of 921,600 pixels:

```text
aspect = panelWidth / panelHeight
renderWidth = sqrt(pixelBudget * aspect)
renderHeight = renderWidth / aspect
```

For the measured 1280 x 2028 stage this produces approximately 763 x 1208.
The artwork therefore recomposes for the tall panel instead of preserving a
16:9 frame or stretching an already-rendered image. Both p5 and Hydra receive
the same dimensions, with pixel density fixed at 1.

## Resize behavior

The child sketch owns resolution changes. A debounced `windowResized()` samples
the iframe's new viewport, recalculates the bounded dimensions, resizes the p5
canvas, calls `hydra.setResolution()`, and recreates the matching p5 graphics
buffer. CSS makes the resulting canvas fill the iframe; because the internal
and panel aspect ratios match, no `cover`, crop, or independent X/Y scale is
required.

## Safety and fallback

- The original IPFS artwork and seed remain unchanged and available as the
  comparison reference.
- If the local shell or its dependencies fail, the About HTML remains readable
  and the background remains transparent/noir.
- Reduced-motion and Save-Data visitors do not load the live iframe in this
  preview.
- The work is isolated on `perf/hydra-adaptive-preview`; unrelated changes in
  the main worktree remain untouched.

## Acceptance criteria

- The normal desktop preview visibly retains the Lines and Cells composition.
- The live p5 and Hydra buffers stay at or below 921,600 pixels each.
- Their aspect ratio follows the iframe panel after resize.
- The iframe fills the About background without parent `scaleX`/`scaleY`.
- Reduced-motion and Save-Data leave the iframe at `about:blank`.
- The production build and existing automated suite pass.

## Non-goals

- This preview does not yet optimize Gaussian scenes, Work images, or the full
  adaptive-performance policy.
- This preview does not vendor the p5 or Hydra libraries.
- This preview does not redefine the artwork, seed, palettes, oscillators, or
  animation speed.
