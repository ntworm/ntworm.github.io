# Continuous portfolio loop

## Goal

Turn the portfolio's main surface into one continuous, vertically looping experience. About, Work, Code, and Contact become legible chapters of a single authored world, while individual project pages remain independent. The current Code page is the visual quality baseline: the redesign must bring the rest of the portfolio up to that level without weakening or restyling Code.

## Experience principles

- The main page reads as one narrative, not four pages stitched together.
- The sequence is **About -> Work -> Code -> Contact -> About**.
- The loop is continuous in both directions, but every chapter remains easy to identify and address directly.
- HTML content remains the readable, responsive foreground. A persistent visual stage supplies depth, light, motion, and transitions behind and around it.
- Each chapter has a distinct material language. Shared camera damping, typography, grain, color discipline, and transition timing make them feel like the same work.
- Interaction influences the composition but never takes control away from the art direction.
- Existing project detail routes remain unchanged.

## Narrative architecture

### About: identity

About becomes a compact prologue of roughly one to two viewports. It keeps the essential positioning statement, a short biography, location, and the minimum context needed to understand the practice. Work-related material currently in About moves to Work: disciplines, professional scope, recognition, clients, and credits belong beside the work that proves them.

The current portrait photographs remain editorial images. They must not be converted into particles, fake depth, displacement, or pseudo-Gaussian effects. A future animated About scene depends on a genuine new Gaussian scan. When that asset exists, the intended language is a true splat that dissolves and reconstructs through artistic shader modulation. Until then, About is structurally complete but visually restrained.

### Work: illumination and results

Work contains finished outcomes across film sound, music, generative art, performance, and tools. Its visual language is illumination: existing covers, frames, and videos are presented as spatial editorial surfaces revealed by a controlled light system. They are not distorted into fake 3D objects.

Scroll controls the primary lighting composition. Pointer position adds only a small, damped bias to light direction, intensity, and reflections. The pointer must never behave like a literal flashlight, and text must remain legible without hunting for the correct cursor position. Light from one work leaks into the next so transitions never fall to an accidental black frame.

Work uses three scales:

1. **Selected Work**: eight authored highlights with individual pacing, media treatment, light temperature, and composition.
2. **More Work**: six medium cards in a denser two- or three-column rhythm.
3. **Archive**: a compact chronological index containing all 23 current main project entries, including projects already shown above. Repetition here is intentional: the first appearances are editorial experiences, while Archive is a complete navigation and career index. Discipline markers distinguish Cinema, Music, Generative, and Live/Tools.

The eight highlights, in approved order, are:

1. O Compositor — the Work opener, explicitly foregrounding the 2026 Premio Curtas Best Composition nomination.
2. Unveiling New Futures.
3. O Clube — seasons 6 and 7.
4. This Feminine Side.
5. EP Rinoceronte.
6. Trisal.
7. El Tono del Mar.
8. Kakofoni Orquestra.

The six approved medium works are:

1. A Quermesse.
2. Feel the Magic - Ticha Penicheiro.
3. Em Agosto Chove.
4. Eletronik Fields.
5. RC Surface.
6. fxhash.

The fxhash entry may additionally expose its seven currently catalogued sub-pieces as a micro-index and state the larger body of roughly 30 published generative tokens. This communicates real volume without inflating the number of main project pages.

Results belong in Work. Code may refer back to them, but does not repeat their complete portfolio presentation.

### Code: process and systems

Code remains approximately its current length and preserves its current visual hierarchy, live Gaussians, camera behavior, masks, gradients, layering, and content density. It is the approved baseline and must not be redesigned or condensed as part of this project.

Within the unified page, Code owns process: source code, GitHub, tools, RC Surface internals, open-source work, generative systems, Gaussian experiments, and technical practice. Work owns the corresponding finished outcomes.

Kakofoni Orquestra creates the conceptual threshold into Code. Work's controlled illumination can lose its planar form and become the volumetric light/noise already present in the Code environment. The transition may change context around Code, but the arrived-at Code composition must match the current approved page.

### Contact: invitation and seam

Contact is one minimal viewport. It contains a short collaboration invitation, email, and relevant profiles; it does not contain a form or an extended professional biography.

After Code's visual density, camera motion and light slow down, leaving a quiet field. Residual light at the end anticipates the opening About state. Continuing to scroll crosses a deliberately composed Contact-to-About transition and restarts the narrative without an exposed jump.

## Continuous stage and chapter ownership

The main page owns one persistent visual-stage shell. Each chapter registers its visual state and scroll range with a shared director rather than creating unrelated page-level effects. The director is responsible for:

- normalized chapter progress;
- camera and lighting transitions between chapters;
- pointer damping and input ownership;
- activating only the assets needed for the current and adjacent chapters;
- reduced-motion and low-power modes;
- hiding the logical loop reset inside the Contact-to-About seam.

The first release does not need to duplicate the entire DOM to simulate infinity. The experience is a logical loop: after the closing transition has visually become the About opening, scroll position can be normalized to the corresponding beginning position. The same process works in reverse. Focus, URL state, and assistive-technology order must remain stable across normalization.

## Navigation and routes

The fixed navigation remains visually simple. About, Work, Code, and Contact are addressable with URL fragments. Clicking a distant chapter must not accelerate through every intervening viewport. Instead, a short transition of roughly 1 to 1.5 seconds masks scroll normalization and arrives at the target chapter. Reduced-motion users navigate directly.

The proposed compatibility behavior is:

- `/` hosts the continuous experience;
- `/#about`, `/#work`, `/#code`, and `/#contact` deep-link to chapters;
- existing `/about` and `/code` entry points redirect to their fragments or load the unified page at the equivalent chapter;
- `/work/[slug]` project pages remain independent and unchanged.

Returning from a project page should restore the Work chapter and, when possible, the originating project position.

## Responsive and adaptive behavior

The mobile experience keeps the same content and narrative but adapts rendering cost:

- one-column featured work and a two- or three-column Archive as space permits;
- native scroll remains authoritative;
- pointer-only interactions disappear without removing information;
- conservative device-pixel ratio, splat budget, post-processing, and update frequency;
- optional device orientation only after explicit permission and only as a very small influence;
- automatic poster/static fallback for unsupported or persistently slow devices;
- `prefers-reduced-motion` preserves all content and direct navigation while removing procedural camera movement, dissolves, and long transitions.

## Performance and loading

The continuous page must not keep every heavy scene, video, and Gaussian active simultaneously. Assets are staged by chapter proximity: current chapter first, adjacent chapter opportunistically, distant chapters dormant. Posters occupy layout space before interactive media is ready. Videos remain paused outside their active range.

The current Code scenes require a visual-regression baseline before integration. Any shared-canvas refactor must demonstrate parity before the original page structure is retired. If parity requires keeping Code's renderer isolated inside the shared shell, visual correctness wins over architectural purity.

## Error handling

- A missing image or video falls back to the project's existing cover and metadata rather than leaving an empty illuminated frame.
- WebGL or Gaussian failure falls back to the approved poster treatment while the HTML chapter remains complete.
- Navigation and project links work without the visual director.
- The loop degrades to a finite About -> Work -> Code -> Contact document if scroll normalization cannot initialize safely.

## Non-goals for the first release

- No particle, displacement, depth-map, or pseudo-Gaussian animation made from the existing portrait photographs.
- No new About Gaussian until a genuine scan is produced.
- No physically accurate Gaussian relighting pipeline or proxy mesh in the first release.
- No redesign, condensation, or aesthetic reinterpretation of Code.
- No redesign of individual project pages.
- No requirement to produce new 3D assets before the unified structure ships.

## Verification and success criteria

- About, Work, Code, and Contact form one readable forward and reverse loop without an exposed visual jump.
- Direct navigation reaches each chapter without racing through the full page.
- All 23 main projects are represented in Archive; the approved eight and six appear at their intended scales.
- Work lighting remains composed by scroll and only subtly influenced by pointer input.
- Code matches the approved current composition at representative desktop and mobile viewports.
- Project detail routes and back-navigation continue to work.
- Keyboard navigation, focus order, deep links, reduced motion, WebGL fallback, and low-power fallback remain usable.
- Production build and content integrity tests pass.
- Manual performance review covers a strong desktop GPU, an integrated-GPU laptop, and at least one representative mobile device.
