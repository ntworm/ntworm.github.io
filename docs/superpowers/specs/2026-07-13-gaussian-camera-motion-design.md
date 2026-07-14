# First Gaussian camera motion

## Goal

Replace the Code-page Gaussians' uniform orbits with cinematic, reversible camera movement that reacts gently to scroll, uses pointer proximity to zoom toward each work, lets the pointer subtly bias the camera's aim, and continually creates new autonomous framings. The compositions must remain centered, calm, and legible.

## Scope

- Apply to the `hero-right` and `section-left` Gaussians with mirrored horizontal focus points.
- Keep the card layering and each splat's independent placement intact.
- Keep the orbit pivot fixed at the Gaussian origin.
- Preserve the existing poster and mobile fallback behavior.

## Motion language

The camera always orbits the same central point. Its motion combines three bounded layers:

1. A slow base orbit that never stops abruptly.
2. A reversible scroll curve that changes only the canvas's vertical composition (`0..8%`) as the hero crosses the viewport. Scroll must never alter radius, pitch, angular phase, or orbit speed.
3. A radial pointer-proximity field initially centered at `72% × 54%` for the hero and `28% × 54%` for the lower scene that changes only the orbit radius. Its Y coordinate follows the owning section as that section scrolls, so the zoom remains attached to the visible Gaussian rather than to a fixed strip of the viewport. Three overlapping bands reproduce the yellow → light red → dark red progression: the farthest corner retains a perceptible `0.14` influence, and a core covering `16%` of the shorter viewport dimension holds maximum zoom rather than requiring a pixel-perfect target.

The complete radius range is scaled per scene rather than changing only the close-up endpoint. The hero uses `1.5×` proximity (ambient radius near `4`, focused minimum `2.3`); the lower Gaussian uses `2.5×` proximity (ambient radius near `2.4`, focused minimum `1.38`). Rotation, pitch, target, and scroll response remain unchanged.

Two low-frequency oscillations with different periods subtly vary radius, height, and speed. Acceleration and deceleration are damped so input changes cannot create visible jumps. The camera always looks at the fixed origin; no free pan or target drift is allowed.

On top of that ambient orbit, each Gaussian runs its own seeded autopilot. A fresh seed is generated per scene and per page load, so the two captures do not synchronize and a reload produces another choreography. Each autonomous gesture combines a dominant action with smaller companion changes: restrained acceleration/deceleration, an orbital phase shift, camera roll, and a displaced point of attention. The orbital latitude remains on its base curve; looking up, down, left, or right changes the camera's aim rather than moving it along the orbit or changing its distance. Five-to-fifteen-second smootherstep envelopes carry the camera away from the base movement and back to it, followed by a short neutral interval. Bounds keep speed at `0.62..1.28` of the ambient orbit, phase within `+/-0.10`, roll within `+/-0.05`, autonomous yaw within `+/-0.11`, and autonomous look pitch within `+/-0.095` radians. Gesture types are shuffled in balanced groups and strong horizontal/vertical directions alternate, preventing long sequences from becoming biased to one side while retaining random order. The pointer and scroll layers do not control this autopilot.

## Input and lifecycle

- Normalize scroll progress locally across the hero Gaussian's oversized stage, clamped from 0 to 1. Scrolling upward retraces the same curve.
- Store the pointer's client coordinates, then recompute its distance from the section-anchored Gaussian focus every animation frame. Damp the resulting proximity target before it reaches the radius sampler so fast gestures remain fluid. This keeps both axes correct when the page scrolls beneath a stationary pointer. Convert that distance into a smooth `0.14..1` proximity value while the pointer is inside the viewport. Proximity itself never alters pitch, phase, or angular speed. Separately, normalized full-viewport pointer coordinates bias camera yaw by at most `+/-0.045` radians and camera pitch by at most `+/-0.035` radians; this aim offset is damped and does not move the orbit path. Leaving the viewport eases both proximity and aim back to neutral.
- Attach listeners once per mounted Gaussian and stop using them when the stage is no longer connected.
- Respect Astro client-side page navigation.
- Under `prefers-reduced-motion`, keep a calm fixed-speed orbit and ignore scroll/proximity modulation.
- Under `prefers-reduced-motion`, disable autonomous gestures and camera roll as well.

## Implementation boundary

Camera sampling, proximity mapping, and damping live in a small pure module so their limits and reversibility can be tested independently. `GaussianBackground.astro` supplies stage geometry, proximity, and time to the module, applies radius/pitch/angle inside the existing render loop, and writes the independently damped scroll value to `--gs-scroll-y`.

## Verification

- Unit tests prove scroll changes only vertical composition, a smooth focus field, zoom-only pointer influence, fixed target semantics, and smooth damping.
- The existing site integrity suite proves both placement-specific focus points, expanded masks, and visual composition.
- Production build must pass.
- Manual review happens at `/code/` with mouse movement, downward/upward scroll, and a stopped pointer.
