# Hero and Navigation Motion System

## Objective

Give Work, About, and Code distinct hero identities while keeping the portfolio legible, coherent, and reliable during Astro client-side navigation. The Gaussian positions, masks, fades, camera orbit, and card layers remain unchanged.

## Navigation

The primary labels remain `Work`, `About`, `Code`, and `Contact`.

Each label receives a soft, borderless backdrop halo that only separates the letters from complex imagery behind them. The current opaque rectangular backgrounds and box shadows are removed. The halo has no visible edge, pill shape, or hard boundary; it uses a lightly tinted backdrop blur with a feathered mask. The active page keeps the existing amber underline.

## Work Hero

- Eyebrow: `Sound editor · Artist`
- H1: `Sound direction, music production, and creative tooling.`
- Supporting line: `For cinema, performance, and live instruments.`
- Signature: `Gabriel Worm · Palmas, Tocantins, Brazil`

The portrait and existing hero layout remain. The H1 replaces `Gabriel Worm` as the dominant statement; the name becomes the quieter signature.

Motion: the H1 enters in three editorial cuts—`Sound direction`, `music production`, and `creative tooling`—using clipped vertical movement and a short stagger. The motion should feel like montage or contact-sheet editing, not typing or random scrambling.

## About Hero

- Eyebrow: `About`
- H1: `A practice shaped by listening, systems, and collaboration.`
- Existing introductory paragraph remains beneath it.

Motion: phrase segments emerge from soft blur into sharp focus with a restrained horizontal drift. This is slower and more cinematic than Work, with no cursor. The amber emphasis remains part of the composition.

## Code Hero

- Eyebrow: `Code`
- H1 remains: `Tools and instruments for music and audiovisual performance.`
- Existing introductory paragraph remains.

Motion: Code inherits the previous About typewriter behavior. Text types character by character with the amber terminal cursor. This effect is applied only to the Code hero.

## Animation Architecture

The title animator is loaded once from the shared layout, rather than separately from individual pages. It listens for `astro:page-load`, initializes only the newly swapped hero, and marks initialized elements to prevent duplicate runs.

Three declarative modes are supported:

- `data-reveal="cut"` for Work.
- `data-reveal="focus"` for About.
- `data-reveal="typewriter"` for Code.

Each mode preserves readable semantic text before JavaScript enhancement. Timers stop operating on elements removed during navigation. With `prefers-reduced-motion: reduce`, every hero appears immediately in its final state and cursors are hidden.

## Verification

Regression tests cover:

- The navigation halo has no opaque rectangular background or box shadow.
- Work, About, and Code use the intended copy and reveal mode.
- The shared layout owns the animator lifecycle.
- `astro:page-load` reinitializes animations after internal navigation.
- Reduced-motion users receive the final readable state.

Manual browser verification follows this route without refreshing: Work → About → Code → Work. Each hero must animate exactly once per visit, all text must finish readable, and the Gaussian composition must remain unchanged.
