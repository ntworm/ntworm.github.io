# Portfolio Final Polish Design

**Date:** 2026-08-13  
**Status:** Approved for autopilot implementation  
**Repository:** `portfolio`  
**Feature branch:** `perf/hydra-adaptive-preview`

## Goal

Finish the portfolio as a polished, current, accessible, secure, and efficient public site without redesigning its editorial noir identity or reducing the visual quality of Hydra, Gaussian scenes, project imagery, particles, camera motion, or typography.

## Approved product decisions

- Use a conservative factual policy: change only claims supported by current primary sources or internally authoritative repository evidence.
- Keep all 25 projects visible on the continuous homepage.
- Add a subtle noir gradient behind the sticky navigation rather than an opaque bar.
- Remove the unused `carro.compressed.ply` from the repository and deployment.
- Use the balanced improvement package, not the minimal or aggressive alternative.
- Keep all local CV, profile, job-search, and prospecting material out of commits and pushes.

## Non-goals

- No redesign of the palette, type system, chapter composition, Gaussian look, Hydra seed, shaders, particle profiles, camera choreography, or project ordering.
- No lossy replacement of approved portfolio artwork.
- No removal or collapse of the complete homepage archive.
- No edits to ambiguous personal credits, cities, museum acquisitions, project histories, or token counts without user confirmation.
- No migration away from Astro or GitHub Pages.

## 1. Factual and editorial consistency

The implementation will update facts that were verified during the audit:

- Ableton MCP Server will state `75 tools in v0.5.3`, matching the project's current primary README.
- The GitHub profile summary will match the current public GitHub API profile rather than the stale programmer bio.
- The Work introduction will say `Selected work`, because the portfolio includes an in-progress production.
- The O Compositor award reference will point to the official MOTELX winners page rather than the nominee announcement.
- The root README will consistently identify the deployed `ntworm.github.io` site and the continuous homepage chapter URLs.
- `site/public/work/README.md` will describe the actual current media discovery, cover, trailer, gallery, and file state.
- Published internal editorial notes such as an unresolved Spotify URL note will be removed when they do not belong in the case-study copy.

Ambiguous claims found by the audit remain unchanged. The implementation may add tests that make duplicated verified facts agree, but it will not create new public claims.

## 2. Runtime performance and adaptive behavior

### Hydra

Hydra keeps its current render resolution, seed, aspect behavior, and visual output. A parent-owned proximity observer will activate the local iframe only near the About chapter. The local Hydra shell will accept explicit pause/resume messages and stop its p5/Hydra draw work when the chapter is far away, the document is hidden, reduced motion is requested, or Save-Data is active. It resumes without recreating or visually resetting the approved artwork when practical. Astro page swaps terminate observers and messaging.

The decorative iframe is removed from the keyboard order. Remote runtime URLs remain content-addressed/pinned; the shell receives a restrictive referrer policy and an explicit content policy compatible with the verified sketch. Sandboxing will be tightened only to the point demonstrated not to break the local sketch.

### Gaussian scenes

The already approved predictive controller remains the normal path. The two full-resolution `.splat` files, renderer, particles, shader, camera, and CSS composition remain unchanged. The controller will additionally respect Save-Data and very low device-memory signals by delaying the full scene until the relevant Code host reaches the direct active zone. It will not substitute a lower-quality scene. Unsupported capability signals retain the current normal behavior.

The unused 66.9 MB `carro.compressed.ply` is deleted. The unused `GaussianViewer.astro` runtime is removed after a reference test proves it has no consumer.

### Homepage media

Only above-the-fold/LCP media is eager. Spotlight media is controlled by one idempotent controller: the current slide loads first, the next slide may prewarm, and distant slides do not all download on initial page load. Project-card images keep native lazy loading and predictive prewarming closer to their chapter. Intrinsic dimensions and responsive `sizes` are emitted from the existing asset manifest so layout remains stable.

No original image is recompressed or replaced. Case pages continue to use the original high-quality media.

## 3. Visual polish and navigation

The sticky navigation gains a subtle top-to-bottom noir gradient and a small text-contrast lift while remaining visually transparent. Mobile links gain slightly larger type and vertical hit areas. An idempotent section observer marks About, Work, Code, or Contact as the current location while scrolling; project case pages continue to mark Work.

The complete archive remains visible. On narrow screens, archive typography and spacing improve readability without changing the two-column layout or removing projects.

The site's current typography, amber accents, hairlines, grain, masks, overscan, and section proportions remain the visual source of truth.

## 4. Accessibility and motion

- The spotlight moves from a CSS-only stack of seven keyboard links to one accessible active link at a time. Inactive slides are inert and hidden from the accessibility tree. Cycling pauses for hover, focus-within, hidden documents, and reduced motion.
- The homepage has one document H1. Work and Code chapter hero headings become H2 elements with identical styling. The Code typewriter retains a stable accessible name throughout animation.
- The decorative Hydra iframe uses `tabindex="-1"`.
- Case-study trailers expose controls. Under reduced motion they do not autoplay or loop.
- Interactive case loading announces its state, keeps a usable failure fallback, and transfers focus to the loaded frame only after a user activation.
- Gallery media receives conservative project-scoped accessible labels where a specific visual description is not authoritatively available; decorative duplicate backdrops remain empty-alt.
- Duplicate tool-card destinations are removed from the tab sequence while preserving the visual image/title composition.

## 5. Metadata, discovery, and deployment

- Generate a static sitemap for the homepage, archive route, and all 25 case pages.
- Publish `robots.txt` referencing that sitemap.
- Add Person/portfolio JSON-LD to the homepage and CreativeWork JSON-LD to cases using existing canonical metadata only.
- Case descriptions use a concise, stable excerpt derived from current project metadata/body rather than only `title — role (year)`.
- Canonical URLs strip transient query strings and always use the configured production origin.
- Add theme color and a small web manifest suitable for a portfolio bookmark; retain the SVG favicon.
- Legacy chapter routes perform immediate client replacement with a no-script fallback and canonical/noindex metadata instead of waiting two seconds.
- The GitHub Pages workflow runs the complete `npm test` gate before uploading `dist`.

## 6. Dependencies and security

- Upgrade Astro from 7.0.7 to the current compatible audited 7.2.x release and refresh the lockfile.
- Declare `sharp` directly as a build dependency because the asset script imports it.
- Require a fresh production audit with no known high-severity runtime advisories before merge.
- Pin external Gaussian runtime versions. Existing content-addressed Hydra assets remain immutable.
- Add the strictest iframe sandbox/referrer/CSP behavior that passes the real interactive-art and Hydra acceptance tests; do not ship a security attribute that silently breaks the art.

GitHub Pages header limitations are documented rather than represented as application-controlled guarantees.

## 7. Error handling and lifecycle

All browser controllers are idempotent and terminally disposable. They must tolerate missing IntersectionObserver, unsupported connection/device-memory hints, failed image or iframe loads, and Astro page swaps. Failures preserve poster/static content, visible retry affordances where interaction was user-triggered, and readable case content. No rejected runtime Promise may remove a loading/error fallback without a working replacement.

No observer, timeout, interval, event listener, animation frame, WebGL renderer, or iframe messaging handler may survive its owning document/chapter lifecycle unintentionally.

## 8. Verification and acceptance

TDD is required for each behavior change. The final acceptance gate is:

1. Fresh `npm audit --omit=dev` with zero high-severity runtime advisories.
2. Fresh `npm test`: static build of all 31 current routes plus the expanded test suite, zero failures.
3. `git diff --check` and a clean feature worktree.
4. Browser checks at desktop, 390 px mobile, and 320 px narrow mobile:
   - no horizontal overflow;
   - 25 archive projects remain reachable;
   - exactly one accessible spotlight link;
   - reduced-motion video does not autoplay;
   - decorative Hydra iframe is not focusable;
   - current nav section updates;
   - Hydra frame activity stops outside About/hidden and resumes inside;
   - zero `.splat` transfers at the page top;
   - first and second Gaussian scenes still load independently and retain their approved look;
   - query-string navigation does not duplicate `.splat` requests.
5. Inspect homepage and at least three representative cases (video, interactive, image gallery) for visual fidelity and console errors.
6. Independent review of the complete feature diff with no Critical or Important findings.

## 9. Integration policy

Implementation stays on `perf/hydra-adaptive-preview` with focused commits. Before integration, fetch current remote state and classify the dirty main worktree. Merge only tracked site/technical history; never stage `profile/`, `job_text.txt`, `latest_jobs.txt`, `soundlister.txt`, or unrelated `.gitignore` changes from main. After the merged result passes the full gate, push `main` normally without force.

## Self-review

- No placeholders or deferred requirements remain.
- Product decisions match the user's conservative factual policy and approved visual/performance choices.
- Scope is one coherent final-polish release; aggressive artwork conversion and homepage restructuring are explicitly excluded.
- Runtime ownership, fallbacks, teardown, testing, merge safety, and user-local exclusions are explicit.
