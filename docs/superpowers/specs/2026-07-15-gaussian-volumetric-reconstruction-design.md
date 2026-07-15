# Gaussian Volumetric Reconstruction

## Objective

Replace the current nearly uniform world-reveal interpolation with a vivid but controlled materialization effect. A click inside the Gaussian focus area still toggles between the 1.5 m core and the complete capture, but construction and destruction must read as moving splats in 3D rather than as a global fade.

## Visual Language

The transition is 80% organic and 20% digital. Its primary gesture is a radial front that travels between the core and the outer bounds over roughly three to four seconds. The front is warped by stable object-space noise so it develops fluid lobes and irregular timing without flickering between frames.

At the moving boundary, splats separate into digital dust: alpha becomes stochastic, positions drift along deterministic per-splat directions, and color receives a restrained fringe and pulse. Behind a construction front, the capture settles to its normal appearance. Behind a destruction front, it disappears completely. The central core remains fully legible throughout.

Existing autonomous blocks, pings, and scan gestures continue as secondary details. During a collapsed state they briefly reconstruct hidden regions; during a complete state they erode the corresponding regions. They must not overpower the click transition.

## Shader Model

The renderer receives a transition progress uniform in the 0..1 range and a transition direction. Each splat derives:

- normalized radial distance from the capture origin;
- low-frequency object-space procedural noise from its position;
- a deterministic per-splat seed;
- distance to the moving reconstruction front;
- settled visibility on either side of that front;
- dust intensity concentrated only around the front.

Visibility is determined per splat rather than by mixing two complete masks. Noise shifts each splat's reveal threshold, creating a volumetric, non-uniform front. Dust displacement and chromatic fringe are strongest at the boundary and decay to zero after the splat settles.

The reverse transition reuses the same spatial field in the opposite direction. This makes destruction visually correspond to reconstruction and prevents a sudden switch to an unrelated animation.

## Runtime Behaviour

- Initial state: hard 1.5 m core, outer map absent except for autonomous regenerative gestures.
- First valid click: reconstruct the complete capture over about 3.6 seconds.
- Second valid click: destruct the outer capture back toward the core over about 3.2 seconds.
- Rapid repeated clicks: reverse smoothly from the current progress without jumping.
- Links, controls, and clicks outside the editorial focus ellipse remain ignored.
- Both Gaussian instances use independent noise phases and autonomous seeds.
- Reduced-motion mode preserves the core/full toggle with a slower, displacement-free reveal.

## Boundaries and Failure Handling

The implementation extends the existing particle shader and uniform controller; it does not replace the renderer or add another canvas. If the custom shader cannot compile or required uniforms are unavailable, the existing stock-renderer fallback remains active.

## Verification

Automated tests will cover uniform clamping, deterministic transition fields, smooth reversal, injected shader expressions, unchanged click hit-testing, and both Gaussian instances. The full Astro build and test suite must pass while the development server stays available for visual review.
