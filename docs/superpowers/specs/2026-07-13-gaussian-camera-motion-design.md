# First Gaussian camera motion

## Goal

Replace the first Code-page Gaussian's uniform orbit with a cinematic, reversible camera movement that reacts gently to scroll and uses pointer proximity only to zoom toward the work. The composition must remain centered, calm, and legible.

## Scope

- Apply only to the `hero-right` Gaussian.
- Keep the second Gaussian, masks, canvas placement, card layering, and splat transforms unchanged.
- Keep the orbit pivot fixed at the Gaussian origin.
- Preserve the existing poster and mobile fallback behavior.

## Motion language

The camera always orbits the same central point. Its motion combines three bounded layers:

1. A slow base orbit that never stops abruptly.
2. A reversible scroll curve that changes orbit radius, height, and angular phase as the hero crosses the viewport.
3. A radial pointer-proximity field centered at `72% × 54%` of the viewport that changes only the orbit radius. At the marked Gaussian focus it zooms in; outside the field it returns to the ambient radius.

Two low-frequency oscillations with different periods subtly vary radius, height, and speed. Acceleration and deceleration are damped so input changes cannot create visible jumps. The camera always looks at the fixed origin; no free pan or target drift is allowed.

## Input and lifecycle

- Normalize scroll progress locally across the hero Gaussian's oversized stage, clamped from 0 to 1. Scrolling upward retraces the same curve.
- Convert pointer distance from the Gaussian focus into a smooth `0..1` proximity value. It must never alter pitch, phase, angular speed, or the fixed target.
- Attach listeners once per mounted Gaussian and stop using them when the stage is no longer connected.
- Respect Astro client-side page navigation.
- Under `prefers-reduced-motion`, keep a calm fixed-speed orbit and ignore scroll/proximity modulation.

## Implementation boundary

Camera sampling, proximity mapping, and damping live in a small pure module so their limits and reversibility can be tested independently. `GaussianBackground.astro` supplies stage geometry, proximity, and time to the module, then applies the sampled radius, pitch, and angle inside the existing render loop.

## Verification

- Unit tests prove scroll reversibility, a smooth focus field, zoom-only pointer influence, fixed target semantics, and smooth damping.
- The existing site integrity suite proves the second Gaussian and visual composition remain unchanged.
- Production build must pass.
- Manual review happens at `/code/` with mouse movement, downward/upward scroll, and a stopped pointer.
