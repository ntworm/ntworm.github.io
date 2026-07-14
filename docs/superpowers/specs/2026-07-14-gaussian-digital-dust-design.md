# Gaussian Digital Dust — Design

## Goal

Give both Gaussian scenes a reversible, cinematic particle behavior without replacing the existing camera autopilot. Splats that approach the camera dissolve into digital dust, while an autonomous three-dimensional scan band periodically crosses each scene, disrupts a localized block, and reconstructs it. The two scenes run independently.

## Visual behavior

### Near-camera dust

- Camera-space depth controls the effect continuously.
- Splats inside a soft near-field band lose opacity through seeded grain instead of disappearing as a flat plane.
- Affected splats receive a very small outward displacement and a restrained brightness fringe.
- Moving away from the camera reverses the same envelope and fully restores the scene.
- The center of the scan stays readable because only geometry actually entering the near field is affected.

### Autonomous scan disruption

- Each Gaussian owns a seeded scheduler with independent timing.
- A broad scan band travels through object space along varying axes, not only screen Y.
- Inside the band, a noisy subregion dissolves, shifts slightly, and gains a brief chromatic/exposure disturbance.
- The front and tail of the band use wide easing zones, so the scene breaks and rebuilds instead of cutting.
- Passes occur irregularly, with calm intervals, and the two Gaussians never intentionally synchronize.

### Ambient pulse

- A slow low-amplitude exposure pulse keeps the splat surface alive between scan passes.
- It never reaches black or flashes the whole viewport.
- The pulse is secondary to the existing camera motion.

## Architecture

### `gaussian-particle-effects.mjs`

A renderer-independent module owns deterministic schedules and normalized effect envelopes. It exposes pure functions for:

- seeded scan timing and direction;
- near-field dissolve strength;
- scan-band strength;
- pulse strength;
- bounded smoothing values passed to the renderer.

The pure layer is unit tested without WebGL.

### Shader integration

`GaussianBackground.astro` installs a narrowly scoped shader-source patch only while each `gsplat.js` renderer is constructed. The patch adds uniforms and per-splat calculations to the existing vertex and fragment shaders:

- object-space position and camera-space depth;
- seeded per-splat noise;
- soft scan-band distance;
- opacity erosion, minor displacement, brightness, and color offset.

After construction, the global WebGL hook is restored immediately. Uniforms are updated before each render frame; splat buffers are not rewritten on the CPU.

Both placements enable the effect. Each placement receives a stable scene seed, independent schedule, and a small scene-specific intensity multiplier.

## Data flow

1. The `.splat` file and renderer load as they do now.
2. Renderer construction compiles the augmented shader.
3. The existing frame loop samples camera motion and the particle autopilot.
4. Normalized values are damped and uploaded as shader uniforms.
5. The GPU evaluates dissolve and displacement per splat.
6. When every envelope returns to zero, rendering matches the unmodified Gaussian.

## Safety and fallback

- `prefers-reduced-motion` disables displacement, scan passes, and pulsing.
- If the augmented program fails to link, the component disposes it and recreates the original unmodified renderer.
- Effect values are clamped; opacity never becomes negative and displacement has a hard cinematic limit.
- No `.splat` data is mutated, so reconstruction is exact and refreshing always restores the source scene.
- Existing poster, masks, gradients, camera focus, mouse zoom, and scroll behavior remain unchanged.

## Verification

- Unit tests cover deterministic scheduling, soft reversible envelopes, independent seeds, clamping, and reduced-motion output.
- Integration tests assert both Gaussian placements opt into the particle system and that the shader hook restores itself.
- The full Astro test/build suite must pass.
- Manual browser review checks: no shader errors, no scroll hitch, no synchronized scans, no harsh full-screen flash, exact reconstruction, and acceptable frame pacing during fast camera motion.

## Non-goals

- Physically accurate relighting or new cast shadows.
- CPU-side per-frame mutation of hundreds of thousands of splats.
- Explosive particle simulation or permanent destruction.
- Changes to the current camera choreography, layout, masks, or card layering.
