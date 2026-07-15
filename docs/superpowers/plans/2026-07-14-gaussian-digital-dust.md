# Gaussian Digital Dust Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add reversible digital-dust, 3D scanline, and restrained pulse effects to both Gaussian splats without changing their established camera composition.

**Architecture:** Extend gsplat.js's vertex shader during synchronous renderer construction, then restore the library hook immediately. Drive per-scene uniforms from deterministic, independent autopilots; disable the effect for reduced motion and fall back to the stock renderer if shader linking fails.

**Tech Stack:** Astro, JavaScript, WebGL2, gsplat.js 1.2.9, node:test

---

## Task 1: Particle math and shader augmentation

- [ ] Add failing unit tests for deterministic independent autopilots, bounds, and idempotent shader augmentation.
- [ ] Implement `site/src/scripts/gaussian-particle-effects.mjs` with seeded scan passes, particle bounds, shader augmentation, and uniform updates.
- [ ] Run the focused test and confirm it passes.

## Task 2: Integrate both Gaussian scenes

- [ ] Add failing integration assertions for the component opt-in, pinned gsplat version, reduced-motion guard, and hook restoration.
- [ ] Add the `particleEffects` prop and renderer patch/fallback lifecycle to `GaussianBackground.astro`.
- [ ] Enable particle effects on both Gaussian instances in `CodeChapter.astro`.
- [ ] Run focused integration tests and confirm they pass.

## Task 3: Verify the live result

- [ ] Run the complete test suite and production build.
- [ ] Verify the local server stays available at `http://localhost:4322/`.
- [ ] Inspect the browser console for shader/WebGL errors and keep the page ready for manual F5 review.
