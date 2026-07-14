# Continuous Portfolio Loop Roadmap

This roadmap sequences the approved design in `docs/superpowers/specs/2026-07-14-continuous-portfolio-loop-design.md`. Each phase is implemented from its own detailed plan and must leave a working, reviewable site. No phase may rely on an unfinished visual rewrite in a later phase.

## Orchestration model

- The primary agent is the architect and auditor.
- A fresh implementation agent receives one complete task at a time.
- Every task is reviewed first for spec compliance and then for code quality.
- Open review findings return to the same implementer and are re-reviewed.
- Only one implementation agent writes at a time; visual and integration changes are not parallelized.
- Every phase ends with tests, a production build, a manual browser checkpoint, and an intentional commit.

## Prerequisite: freeze the approved baseline

The current `work/gaussian-camera-motion` branch contains the approved Code/Gaussian state as uncommitted changes. Before feature work:

1. Review the dirty diff and exclude unrelated files.
2. Run `npm test` from `site` and retain the 33-test passing result as baseline evidence.
3. Commit the approved Gaussian, copy, test, and design-document changes.
4. Create the feature branch/worktree from that commit, not from the older `322044f` HEAD.
5. Run `npm test` in the new worktree before changing production code.

## Phase 1: presentation model

Detailed plan: `docs/superpowers/plans/2026-07-14-work-presentation-model.md`

Create one tested source of truth for the approved eight highlights, six medium works, discipline labels, and the complete 23-project archive. This phase does not alter layout or routes.

**Gate:** exact approved order is tested; all 23 content entries receive a discipline; selected tiers contain no duplicates; archive is complete and chronologically sorted.

## Phase 2: finite unified document

Build a finite, accessible About -> Work -> Code -> Contact page before adding infinity or a shared visual director.

- Add focused chapter components under `site/src/components/portfolio/`.
- Condense About to the approved identity prologue. Keep portraits editorial and static.
- Render Work through the Phase 1 presentation model at three scales.
- Extract the current Code markup and CSS into a chapter component with visual parity.
- Reuse the current minimal Contact content.
- Keep `/work/[slug]` untouched.
- Add a `continuous` layout mode so project pages retain the existing Layout/Footer behavior.

**Gate:** the page is readable and complete with JavaScript disabled; 8/6/23 counts are verified; Code desktop/mobile screenshots match the approved baseline; project pages remain unchanged.

## Phase 3: Work lighting stage

Add the Work chapter's visual identity using existing covers, frames, and videos as undistorted editorial planes.

- Scroll owns the authored lighting timeline.
- Pointer position contributes a small damped bias only.
- Text and media remain legible with no pointer input.
- Adjacent works overlap light so transitions never fall into an accidental black frame.
- Medium cards receive restrained light; Archive receives hover/focus illumination and an external preview.
- Videos reserve layout space, lazy-load, and pause outside their active range.

**Gate:** deterministic unit tests cover light interpolation and pointer bounds; keyboard focus produces the same information as hover; no existing 2D portrait receives shader deformation.

## Phase 4: shared director and logical loop

Introduce the deterministic chapter director only after the finite document is stable.

- Track normalized progress for About, Work, Code, and Contact.
- Activate the current chapter and stage adjacent assets without keeping all heavy scenes active.
- Implement forward and reverse Contact-to-About seam normalization.
- Preserve focus and avoid duplicating the full accessible DOM.
- Replace finite page progress with chapter-aware state on the continuous page.
- Keep a safe finite-document fallback if initialization fails.

**Gate:** browser tests cover both seam directions, stationary focus, keyboard traversal, initialization failure, and reduced motion.

## Phase 5: navigation, deep links, and return state

- Convert the primary navigation to `#about`, `#work`, `#code`, and `#contact` on the continuous page.
- Use a 1-1.5 second masked transition for distant chapter navigation; reduced motion jumps directly.
- Preserve `/about`, `/code`, and `/contact` as compatibility entry points to the equivalent chapter.
- Keep `/work/[slug]` pages independent.
- Store the originating Work item and restore its position when returning from a detail page.

**Gate:** direct URL load, browser back/forward, old URLs, project return, and no-JavaScript anchors all work.

## Phase 6: Code integration and lifecycle hardening

Code remains visually frozen; this phase changes lifecycle, not art direction.

- Preserve both existing Gaussian compositions and renderers unless a shared renderer proves exact parity.
- Pause inactive render loops and resume without camera discontinuity.
- Make reduced-motion behavior genuinely calm.
- Add WebGL/Gaussian failure-to-poster behavior.
- Keep Kakofoni Orquestra as the conceptual Work-to-Code threshold.

**Gate:** screenshot parity passes before and after lifecycle changes; camera unit tests remain green; inactive scenes stop requesting frames.

## Phase 7: adaptive performance and release

- Apply conservative DPR, media, splat, and update budgets by capability.
- Preserve 3D on capable mobile devices and use static posters on unsupported or persistently slow devices.
- Validate one strong desktop GPU, one integrated-GPU laptop, and one representative phone.
- Run the full test/build suite and complete an accessibility/manual visual audit.
- Redirect the production homepage only after all gates pass.

**Gate:** production build passes, all automated checks pass, project routes are intact, the Code baseline is unchanged, and the loop remains legible on all three device profiles.
