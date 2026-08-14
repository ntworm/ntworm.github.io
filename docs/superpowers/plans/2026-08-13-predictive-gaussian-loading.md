# Predictive Gaussian Loading Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Defer each full-quality Gaussian until its Code scene is approaching, then pause its WebGL loop outside the active zone without changing any visual rendering parameter.

**Architecture:** A small pure frame-loop module owns idempotent pause, resume, accumulated active time, and disposal. `GaussianBackground.astro` exposes that module to the existing dynamically imported gsplat runtime and adds one predictive controller per semantic Code host. The homepage no longer emits splat preloads; independent observers and `#code` navigation intent start each scene, while Astro swap cleanup disposes outgoing runtime resources.

**Tech Stack:** Astro 7, TypeScript-in-Astro, browser `IntersectionObserver`, `requestAnimationFrame`, gsplat 1.2.9 from esm.sh, Node 24 built-in test runner. The repository has no separate lint command; `astro build`, `node --check` for `.mjs`, and the full `npm test` suite are the compile/integrity gates.

---

## File map

- Create `site/src/scripts/gaussian-frame-loop.mjs`: pure pausable frame scheduler with injected browser timing functions.
- Create `site/tests/gaussian-frame-loop.test.mjs`: behavioral tests for single-loop activation, pause/resume timing, and disposal.
- Modify `site/package.json`: include the new pure test in the main suite.
- Modify `site/src/components/GaussianBackground.astro`: wire the pure loop into the gsplat runtime; add predictive loading, activity observation, navigation acceleration, and Astro cleanup.
- Modify `site/src/pages/index.astro`: remove the homepage splat-preload list and `preload` prop.
- Modify `site/src/layouts/Layout.astro`: remove the now-unused binary-preload API and emitted `<link rel="preload">` tags.
- Modify `site/tests/site-integrity.test.mjs`: replace the eager-loading contract and add runtime wiring/lifecycle contracts.

## Task 1: Pure pausable frame loop

**Files:**
- Create: `site/tests/gaussian-frame-loop.test.mjs`
- Create: `site/src/scripts/gaussian-frame-loop.mjs`
- Modify: `site/package.json`

- [ ] **Step 1: Add the new test file to the package test command**

Insert `tests/gaussian-frame-loop.test.mjs` between the particle and Hydra test files in the existing `test` script:

```json
"test": "node --test tests/continuous-document.test.mjs tests/gaussian-camera-motion.test.mjs tests/gaussian-frame-loop.test.mjs tests/gaussian-particle-effects.test.mjs tests/hydra-adaptive-resolution.test.mjs tests/primary-routing.test.mjs tests/rc-surface-license.test.mjs tests/site-integrity.test.mjs tests/work-presentation.test.mjs"
```

- [ ] **Step 2: Write behavioral tests with an observable manual scheduler**

Create `site/tests/gaussian-frame-loop.test.mjs`:

```js
import assert from 'node:assert/strict';
import test from 'node:test';

import { createPausableFrameLoop } from '../src/scripts/gaussian-frame-loop.mjs';

function createManualScheduler() {
  let clockMs = 0;
  let nextId = 1;
  const pending = new Map();

  return {
    now: () => clockMs,
    requestFrame(callback) {
      const id = nextId;
      nextId += 1;
      pending.set(id, callback);
      return id;
    },
    cancelFrame(id) {
      pending.delete(id);
    },
    step(milliseconds) {
      clockMs += milliseconds;
      const callbacks = [...pending.values()];
      pending.clear();
      callbacks.forEach((callback) => callback(clockMs));
    },
    pendingCount: () => pending.size,
  };
}

test('activation owns exactly one frame chain and pause retains active time', () => {
  const scheduler = createManualScheduler();
  const frames = [];
  const loop = createPausableFrameLoop({
    now: scheduler.now,
    requestFrame: scheduler.requestFrame,
    cancelFrame: scheduler.cancelFrame,
    onFrame: (frame) => frames.push(frame),
  });

  loop.setActive(true);
  loop.setActive(true);
  assert.equal(scheduler.pendingCount(), 1);

  scheduler.step(16);
  assert.equal(frames.length, 1);
  assert.equal(scheduler.pendingCount(), 1);
  assert.ok(Math.abs(frames[0].deltaSeconds - 0.016) < 0.0001);
  assert.ok(Math.abs(frames[0].activeSeconds - 0.016) < 0.0001);

  loop.setActive(false);
  assert.equal(scheduler.pendingCount(), 0);
  scheduler.step(10_000);
  assert.equal(frames.length, 1);

  loop.setActive(true);
  scheduler.step(16);
  assert.equal(frames.length, 2);
  assert.ok(Math.abs(frames[1].deltaSeconds - 0.016) < 0.0001);
  assert.ok(Math.abs(frames[1].activeSeconds - 0.032) < 0.0001);
});

test('dispose is terminal and cancels the scheduled frame', () => {
  const scheduler = createManualScheduler();
  let renderedFrames = 0;
  const loop = createPausableFrameLoop({
    now: scheduler.now,
    requestFrame: scheduler.requestFrame,
    cancelFrame: scheduler.cancelFrame,
    onFrame: () => { renderedFrames += 1; },
  });

  loop.setActive(true);
  loop.dispose();
  loop.setActive(true);
  scheduler.step(16);

  assert.equal(renderedFrames, 0);
  assert.equal(scheduler.pendingCount(), 0);
  assert.deepEqual(loop.getState(), {
    active: false,
    disposed: true,
    activeSeconds: 0,
    frameCount: 0,
  });
});
```

- [ ] **Step 3: Run the test and verify the RED state**

Run from `site`:

```powershell
node --test tests/gaussian-frame-loop.test.mjs
```

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `src/scripts/gaussian-frame-loop.mjs`. This is the expected missing production unit, not a test typo.

- [ ] **Step 4: Implement the minimal scheduler**

Create `site/src/scripts/gaussian-frame-loop.mjs`:

```js
export function createPausableFrameLoop({
  onFrame,
  now = () => performance.now(),
  requestFrame = (callback) => requestAnimationFrame(callback),
  cancelFrame = (id) => cancelAnimationFrame(id),
}) {
  let active = false;
  let disposed = false;
  let activeSeconds = 0;
  let frameCount = 0;
  let frameId = 0;
  let previousTimeMs = 0;

  const frame = (timeMs) => {
    frameId = 0;
    if (!active || disposed) return;

    const deltaSeconds = Math.max(0, Math.min(0.05, (timeMs - previousTimeMs) / 1000));
    previousTimeMs = timeMs;
    activeSeconds += deltaSeconds;
    frameCount += 1;
    onFrame({ deltaSeconds, activeSeconds, frameCount });

    if (active && !disposed) frameId = requestFrame(frame);
  };

  const setActive = (nextActive) => {
    if (disposed || active === nextActive) return;
    active = nextActive;

    if (active) {
      previousTimeMs = now();
      frameId = requestFrame(frame);
    } else if (frameId) {
      cancelFrame(frameId);
      frameId = 0;
    }
  };

  const dispose = () => {
    if (disposed) return;
    setActive(false);
    disposed = true;
  };

  const getState = () => ({ active, disposed, activeSeconds, frameCount });

  return { setActive, dispose, getState };
}
```

- [ ] **Step 5: Verify syntax and GREEN state**

Run from `site`:

```powershell
node --check src/scripts/gaussian-frame-loop.mjs
node --test tests/gaussian-frame-loop.test.mjs
```

Expected: syntax exit 0 and 2/2 tests pass.

- [ ] **Step 6: Commit the isolated unit**

```powershell
git add site/package.json site/src/scripts/gaussian-frame-loop.mjs site/tests/gaussian-frame-loop.test.mjs
git commit -m "test: define pausable Gaussian frame loop"
```

## Task 2: Make the gsplat runtime controllable and disposable

**Files:**
- Modify: `site/src/components/GaussianBackground.astro:64-348`
- Modify: `site/tests/site-integrity.test.mjs:183-205`

- [ ] **Step 1: Write the failing runtime-wiring contract**

Add this test immediately after `live Gaussian canvas overrides the renderer black surface` in `site/tests/site-integrity.test.mjs`:

```js
test('Gaussian runtime exposes an idempotent pausable and disposable controller', () => {
  const source = readFileSync(join(process.cwd(), 'src', 'components', 'GaussianBackground.astro'), 'utf8');

  assert.match(source, /import \{ createPausableFrameLoop \} from '\.\.\/scripts\/gaussian-frame-loop\.mjs';/);
  assert.match(source, /window\.__gsBgLifecycle = \{ createPausableFrameLoop \}/);
  assert.match(source, /const frameLoop = lifecycle\.createPausableFrameLoop\(\{/);
  assert.match(source, /onFrame: \(\{ deltaSeconds, activeSeconds \}\) => \{/);
  assert.match(source, /timeSeconds: activeSeconds/);
  assert.match(source, /setActive\(active\) \{ frameLoop\.setActive\(active\); \}/);
  assert.match(source, /frameLoop\.dispose\(\)/);
  assert.match(source, /renderer\.dispose\(\)/);
  assert.match(source, /renderer\.canvas\.remove\(\)/);
  assert.match(source, /stage\.dataset\.gsDisposed === '1'/);
  assert.doesNotMatch(source, /requestAnimationFrame\(frame\)/);
});
```

- [ ] **Step 2: Build and verify the expected RED state**

Run from `site`:

```powershell
npm run build
node --test tests/site-integrity.test.mjs --test-name-pattern="Gaussian runtime exposes"
```

Expected: FAIL because the component has no pausable runtime import/controller and still contains the unconditional recursive animation frame.

- [ ] **Step 3: Import and expose the loop factory with exact runtime types**

At the top of the component script, add:

```ts
import { createPausableFrameLoop } from '../scripts/gaussian-frame-loop.mjs';

type GaussianRuntimeController = {
  setActive: (active: boolean) => void;
  dispose: () => void;
  getState: () => {
    active: boolean;
    disposed: boolean;
    activeSeconds: number;
    frameCount: number;
  };
};
```

Change `window.__gsBgStart` to return `Promise<GaussianRuntimeController | null>`, add the factory type, and expose it:

```ts
__gsBgStart?: (src: string, stage: HTMLElement) => Promise<GaussianRuntimeController | null>;
__gsBgLifecycle?: { createPausableFrameLoop: typeof createPausableFrameLoop };
```

```ts
window.__gsBgLifecycle = { createPausableFrameLoop };
```

- [ ] **Step 4: Add lifecycle access and safe cancellation to the generated runtime source**

Immediately after the generated function creates `scene`, `camera`, and `particles`, add:

```js
"  const lifecycle = window.__gsBgLifecycle;",
"  if (!lifecycle) throw new Error('Gaussian lifecycle controller unavailable');",
```

Replace the bare splat await with the following guarded block:

```js
"  try {",
"    await SPLAT.Loader.LoadAsync(src, scene, () => {});",
"  } catch (error) {",
"    window.removeEventListener('resize', forceSize);",
"    window.removeEventListener('pointermove', onPointerMove);",
"    window.removeEventListener('mouseout', onPointerOut);",
"    renderer.dispose();",
"    renderer.canvas.remove();",
"    throw error;",
"  }",
"  if (!stage.isConnected || stage.dataset.gsDisposed === '1') {",
"    window.removeEventListener('resize', forceSize);",
"    window.removeEventListener('pointermove', onPointerMove);",
"    window.removeEventListener('mouseout', onPointerOut);",
"    renderer.dispose();",
"    renderer.canvas.remove();",
"    return null;",
"  }",
```

This check occurs before particle controllers and the click listener are created.

- [ ] **Step 5: Replace the recursive frame ownership with the pure loop**

Replace the current `lastTime`/`frame(now)` prefix with:

```js
"  const renderFrame = ({ deltaSeconds, activeSeconds }) => {",
"    if (!stage.isConnected || stage.dataset.gsDisposed === '1') return;",
```

Within the unchanged camera sample call, replace `timeSeconds: now / 1000` with:

```js
"      timeSeconds: activeSeconds",
```

Replace the current render-loop tail and initial `requestAnimationFrame(frame)` with:

```js
"    renderer.render(scene, camera);",
"  };",
"  const frameLoop = lifecycle.createPausableFrameLoop({ onFrame: ({ deltaSeconds, activeSeconds }) => { renderFrame({ deltaSeconds, activeSeconds }); } });",
"  let disposed = false;",
"  return {",
"    setActive(active) { frameLoop.setActive(active); },",
"    dispose() {",
"      if (disposed) return;",
"      disposed = true;",
"      frameLoop.dispose();",
"      window.removeEventListener('resize', forceSize);",
"      window.removeEventListener('pointermove', onPointerMove);",
"      window.removeEventListener('mouseout', onPointerOut);",
"      window.removeEventListener('click', onWorldToggle);",
"      renderer.dispose();",
"      renderer.canvas.remove();",
"    },",
"    getState() { return frameLoop.getState(); }",
"  };",
"};",
```

The old disconnected-stage listener-removal block and all direct
`requestAnimationFrame(frame)` calls are removed; the returned controller owns
those responsibilities.

- [ ] **Step 6: Verify runtime contract and full source syntax through Astro**

Run from `site`:

```powershell
npm run build
node --test tests/gaussian-frame-loop.test.mjs tests/site-integrity.test.mjs --test-name-pattern="Gaussian runtime exposes|activation owns|dispose is terminal"
```

Expected: build exit 0 and all selected tests pass.

- [ ] **Step 7: Commit the controllable runtime**

```powershell
git add site/src/components/GaussianBackground.astro site/tests/site-integrity.test.mjs
git commit -m "perf: make Gaussian rendering pausable"
```

## Task 3: Predictive per-scene loading and Astro-safe orchestration

**Files:**
- Modify: `site/src/components/GaussianBackground.astro:350-409`
- Modify: `site/src/pages/index.astro:1-32`
- Modify: `site/src/layouts/Layout.astro:5-67`
- Modify: `site/tests/site-integrity.test.mjs:192-205`

- [ ] **Step 1: Replace the eager contract with a failing predictive contract**

Replace the existing `continuous Gaussians begin loading before their chapters enter the viewport` test with:

```js
test('continuous Gaussians load predictively without document-head splat preload', () => {
  const gaussianSource = readFileSync(join(process.cwd(), 'src', 'components', 'GaussianBackground.astro'), 'utf8');
  const homepageSource = readFileSync(homepageSourcePath, 'utf8');
  const layoutSource = readFileSync(join(process.cwd(), 'src', 'layouts', 'Layout.astro'), 'utf8');

  assert.doesNotMatch(homepageSource, /const SPLATS|preload=\{/);
  assert.doesNotMatch(layoutSource, /preload\?: string\[\]|as="fetch" type="application\/octet-stream"/);
  assert.match(gaussianSource, /rootMargin: '200% 0px'/);
  assert.match(gaussianSource, /rootMargin: '75% 0px'/);
  assert.match(gaussianSource, /closest\('\.code__hero, \.code__lower-showcase'\)/);
  assert.match(gaussianSource, /location\.hash === '#code'/);
  assert.match(gaussianSource, /url\.origin === location\.origin && url\.hash === '#code'/);
  assert.match(gaussianSource, /document\.addEventListener\('astro:before-swap', cleanupGaussianBackgrounds\)/);
});
```

Add a second contract immediately after it:

```js
test('predictive Gaussian controllers load once and preserve poster continuity', () => {
  const source = readFileSync(join(process.cwd(), 'src', 'components', 'GaussianBackground.astro'), 'utf8');

  assert.match(source, /let loadPromise: Promise<void> \| null = null/);
  assert.match(source, /if \(loadPromise \|\| disposed\) return loadPromise/);
  assert.match(source, /bg\.style\.setProperty\('--gs-poster'/);
  assert.match(source, /bg\.classList\.add\('gs-bg--poster'\)/);
  assert.match(source, /runtime\?\.setActive\(insideActiveZone && !document\.hidden\)/);
  assert.match(source, /runtime\?\.dispose\(\)/);
  assert.match(source, /bg\.dataset\.gsDisposed = '1'/);
  assert.match(source, /window\.__gsBgDebug = \(\) => \[\.\.\.gaussianControllers\]/);
});
```

- [ ] **Step 2: Build and verify the expected RED state**

Run from `site`:

```powershell
npm run build
node --test tests/site-integrity.test.mjs --test-name-pattern="continuous Gaussians load predictively|predictive Gaussian controllers"
```

Expected: both tests FAIL because eager preload/mount remains and no predictive controller exists.

- [ ] **Step 3: Remove the document-head splat preload path**

In `site/src/pages/index.astro`, delete the `SPLATS` constant and remove the
`preload` prop so the layout opening is exactly:

```astro
<Layout
  title="Sound, Music & Creative Systems"
  image="/portrait/1.jpg"
  mode="continuous"
>
```

In `site/src/layouts/Layout.astro`, remove `preload?: string[]` from `Props`, remove
`preload = []` from destructuring, and remove both conditional head tags:

```astro
{preload.length > 0 && <link rel="preconnect" href="https://esm.sh">}
{preload.map((href) => <link rel="preload" href={href} as="fetch" type="application/octet-stream">)}
```

- [ ] **Step 4: Change mounting to return the runtime instead of activating it**

Change the signature and successful return path of `mountGaussianBackground`:

```ts
async function mountGaussianBackground(
  bg: HTMLElement,
  pick: SplatEntry,
): Promise<GaussianRuntimeController | null> {
  const breakpoint = parseInt(bg.dataset.mobileBreakpoint || '768', 10);
  if (window.innerWidth < breakpoint) return null;
  if (!bg.querySelector<HTMLCanvasElement>('.gs-bg__canvas')) return null;

  await loadSplatEngine();
  if (!pick.src || !window.__gsBgStart) return null;
  return window.__gsBgStart(pick.src, bg);
}
```

Poster assignment moves to controller creation, before any observer waits.

- [ ] **Step 5: Add the per-background predictive controller**

Add these exact types and function before `attachAll`:

```ts
type GaussianMountController = {
  bg: HTMLElement;
  load: () => Promise<void>;
  refreshActivity: () => void;
  dispose: () => void;
  getState: () => {
    placement: string;
    state: string;
    runtime: ReturnType<GaussianRuntimeController['getState']> | null;
  };
};

const gaussianControllers = new Set<GaussianMountController>();

function createGaussianMountController(bg: HTMLElement): GaussianMountController | null {
  const pick = pickRandomSplat(bg);
  if (!pick) return null;

  if (pick.poster) {
    bg.style.setProperty('--gs-poster', `url(${JSON.stringify(pick.poster)})`);
    bg.classList.add('gs-bg--poster');
  }

  const host = bg.closest('.code__hero, .code__lower-showcase') ?? bg.parentElement ?? bg;
  const breakpoint = parseInt(bg.dataset.mobileBreakpoint || '768', 10);
  let disposed = false;
  let insideActiveZone = false;
  let runtime: GaussianRuntimeController | null = null;
  let loadPromise: Promise<void> | null = null;
  let loadObserver: IntersectionObserver | null = null;
  let activityObserver: IntersectionObserver | null = null;

  const refreshActivity = () => {
    runtime?.setActive(insideActiveZone && !document.hidden);
    if (runtime) {
      bg.dataset.gsState = insideActiveZone && !document.hidden ? 'ready-active' : 'ready-paused';
    }
  };

  const load = () => {
    if (loadPromise || disposed) return loadPromise ?? Promise.resolve();
    loadObserver?.unobserve(host);
    bg.dataset.gsState = 'loading';
    loadPromise = mountGaussianBackground(bg, pick)
      .then((mountedRuntime) => {
        if (disposed) {
          mountedRuntime?.dispose();
          return;
        }
        runtime = mountedRuntime;
        if (!runtime) {
          bg.dataset.gsState = 'poster-only';
          return;
        }
        bg.classList.add('gs-bg--live');
        refreshActivity();
      })
      .catch((error) => {
        bg.dataset.gsState = 'failed';
        console.error('[gs-bg] failed', error);
      });
    return loadPromise;
  };

  const dispose = () => {
    if (disposed) return;
    disposed = true;
    bg.dataset.gsDisposed = '1';
    bg.dataset.gsState = 'disposed';
    loadObserver?.disconnect();
    activityObserver?.disconnect();
    runtime?.dispose();
  };

  const getState = () => ({
    placement: bg.dataset.placement ?? '',
    state: bg.dataset.gsState ?? '',
    runtime: runtime?.getState() ?? null,
  });

  const controller = { bg, load, refreshActivity, dispose, getState };
  bg.dataset.gsState = 'waiting';

  if (window.innerWidth < breakpoint) {
    bg.dataset.gsState = 'poster-only';
    return controller;
  }

  if (!('IntersectionObserver' in window)) {
    insideActiveZone = true;
    void load();
    return controller;
  }

  loadObserver = new IntersectionObserver((entries) => {
    if (entries.some((entry) => entry.isIntersecting)) void load();
  }, { rootMargin: '200% 0px' });

  activityObserver = new IntersectionObserver((entries) => {
    const hostEntry = entries.find((entry) => entry.target === host);
    if (!hostEntry) return;
    insideActiveZone = hostEntry.isIntersecting;
    refreshActivity();
  }, { rootMargin: '75% 0px' });

  loadObserver.observe(host);
  activityObserver.observe(host);
  return controller;
}
```

- [ ] **Step 6: Add idempotent attach, navigation acceleration, visibility refresh, and cleanup**

Replace `attachAll` and the event wiring with:

```ts
function firstCodeGaussian(): GaussianMountController | undefined {
  return [...gaussianControllers].find(({ bg }) => bg.dataset.placement === 'hero-right');
}

function attachAll(): void {
  document.querySelectorAll<HTMLElement>('.gs-bg').forEach((bg) => {
    if (bg.dataset.gsAttached === '1') return;
    bg.dataset.gsAttached = '1';
    bg.dataset.gsDisposed = '0';
    const controller = createGaussianMountController(bg);
    if (controller) gaussianControllers.add(controller);
  });

  if (location.hash === '#code') void firstCodeGaussian()?.load();
}

function handleCodeNavigation(event: MouseEvent): void {
  const target = event.target;
  if (!(target instanceof Element)) return;
  const anchor = target.closest<HTMLAnchorElement>('a[href]');
  if (!anchor) return;
  const url = new URL(anchor.href, location.href);
  if (url.origin === location.origin && url.hash === '#code') {
    void firstCodeGaussian()?.load();
  }
}

function refreshGaussianVisibility(): void {
  gaussianControllers.forEach((controller) => controller.refreshActivity());
}

function cleanupGaussianBackgrounds(): void {
  gaussianControllers.forEach((controller) => controller.dispose());
  gaussianControllers.clear();
}

window.__gsBgDebug = () => [...gaussianControllers].map((controller) => controller.getState());

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', attachAll, { once: true });
} else {
  attachAll();
}
document.addEventListener('click', handleCodeNavigation);
document.addEventListener('visibilitychange', refreshGaussianVisibility);
document.addEventListener('astro:page-load', attachAll);
document.addEventListener('astro:before-swap', cleanupGaussianBackgrounds);
```

Add this debug reader to the existing global `Window` declaration. It is read-only
and exists solely to make lifecycle acceptance observable without touching visual
rendering state:

```ts
__gsBgDebug?: () => Array<{
  placement: string;
  state: string;
  runtime: ReturnType<GaussianRuntimeController['getState']> | null;
}>;
```

- [ ] **Step 7: Verify focused contracts and complete test suite**

Run from `site`:

```powershell
npm run build
node --test tests/gaussian-frame-loop.test.mjs tests/site-integrity.test.mjs
npm test
```

Expected: build succeeds, focused tests pass, and the full suite reports zero failures.

- [ ] **Step 8: Commit predictive orchestration**

```powershell
git add site/src/components/GaussianBackground.astro site/src/pages/index.astro site/src/layouts/Layout.astro site/tests/site-integrity.test.mjs
git commit -m "perf: load Gaussian scenes near the Code chapter"
```

## Task 4: Browser evidence and performance acceptance

**Files:**
- Modify only if verification finds a regression: the smallest owning file from Tasks 1–3, with a new failing regression test first.

- [ ] **Step 1: Run fresh static verification**

From `site`:

```powershell
git diff --check 64622d1..HEAD
npm test
```

Expected: no whitespace errors; build succeeds; all tests pass with zero failures.

- [ ] **Step 2: Start the local desktop-only preview and poll readiness**

```powershell
npm run dev -- --host 127.0.0.1 --port 4321
```

Use `npx astro dev status` and an HTTP request to
`http://127.0.0.1:4321/` until it returns 200. This URL is desktop loopback only;
it is not a phone/LAN deliverable.

- [ ] **Step 3: Verify cold initial network behavior**

Use the documented in-app Browser development surface to open a fresh tab at
`http://127.0.0.1:4321/`. Before scrolling, inspect observed requests and the two
`.gs-bg` elements.

Expected:

```text
.splat requests: 0
hero state: waiting
lower state: waiting
live Gaussian canvases: 0
```

- [ ] **Step 4: Verify predictive and independent loading**

Scroll until the Code hero is within two viewport heights but not yet visible.
Poll the first background's `data-gs-state` with a bounded timeout until it becomes
`loading`, `ready-paused`, or `ready-active`.

Expected:

```text
luzoebreno.splat requests: 1
carro.splat requests: 0
```

Continue toward the lower showcase and poll its state with the same bounded
timeout. Expected: `carro.splat` starts once and only near its own host.

- [ ] **Step 5: Verify pause, resume, and no refetch**

For each loaded scene, record `window.__gsBgDebug()` during browser inspection,
move the host outside the 75% activity margin, and poll until its state is
`ready-paused`. Read `frameCount`, poll again after at least two ordinary animation
intervals, and confirm the value remains stable. Return to the host and poll for
`ready-active`; confirm `frameCount` increases and the network log still contains
exactly one request for that splat.

- [ ] **Step 6: Verify navigation intent and Astro cleanup**

Reload at the top, activate the real Code navigation link with a browser `click`
event, and verify the first state leaves `waiting` immediately. Navigate to a case
study through an actual link and return through Astro navigation. Expected: the
outgoing canvases are removed, no orphan loop logs errors, and the new homepage
creates at most two fresh controllers.

- [ ] **Step 7: Verify visual fidelity**

At both Code scenes, compare the live canvas dimensions, splat source, placement,
CSS transforms, masks, particle flags, and screenshots with the approved preview.
Expected: no changes to canvas resolution or any visual parameter; only loading
timing and inactive-loop scheduling differ.

- [ ] **Step 8: Request final code review and address findings**

Request a read-only review of the implementation diff from `64622d1` to `HEAD`.
Fix every Critical or Important finding with a failing regression test before the
fix, then rerun Steps 1 and 3–7 for affected behavior.

## Self-Review

Spec coverage:

- Task 1 implements single-chain pause/resume, retained active time, and terminal disposal.
- Task 2 preserves the full renderer while adding controllable runtime cleanup and cancellation after async boundaries.
- Task 3 removes initial splat transfer, adds per-host predictive loading, poster continuity, navigation intent, visibility gating, idempotence, and Astro cleanup.
- Task 4 verifies initial network cost, independent scenes, no refetch, pause/resume, navigation, cleanup, and visual fidelity.
- Non-goals remain untouched: no asset, resolution, shader, particle, frame-rate target, mask, or placement edits are planned.

Placeholder scan: the plan contains exact paths, commands, test bodies, production snippets, state names, margins, and expected evidence; no incomplete implementation marker is present.

Type consistency: `GaussianRuntimeController` and `GaussianMountController` names and method signatures are identical across Tasks 2–4. Dataset states are consistently `waiting`, `loading`, `poster-only`, `ready-paused`, `ready-active`, `failed`, and `disposed`.

Execution Consistency Audit evidence:

- PASS Test/implementation trace: Task 1 assertions map to scheduler state and injected timing; Task 2 assertions map to runtime wiring/cleanup; Task 3 assertions map to the exact observer and controller snippets.
- PASS Per-task command executability: Node 24, npm scripts, Astro build, and every referenced test file exist by the step that invokes them.
- PASS File usage audit: the Astro component imports the new frame-loop module, `package.json` runs its test, the homepage consumes `Layout`, source/build integrity tests read every modified integration file, and browser verification reads the declared `window.__gsBgDebug()` API.
- PASS Spec lifecycle audit: waiting → loading is one-way; ready states alternate via `setActive`; `dispose` is terminal; offscreen pause retains renderer/scene/camera/particles/canvas; Astro swap disposes them.
- PASS Time source audit: the loop uses monotonic `performance.now()`-compatible milliseconds, converts each active delta to seconds, clamps it to 0.05 seconds, and accumulates only active seconds for camera sampling.
- PASS State scope audit: frame state is per runtime closure; predictive state is per background controller; the controller set is per current Astro document lifecycle and is cleared before swap.
- PASS Environment audit: `127.0.0.1:4321` is explicitly desktop-only; no LAN, phone, external API, account, or deployment behavior is introduced.
- PASS Browser event audit: navigation verification clicks the real anchor handled by the production `click` listener; scroll verification changes actual viewport intersection; no simulated mouse event is claimed as another gesture path.
- PASS Lint/import audit: the new `.mjs` import is used by the Astro script and tests, all named exports exist from Task 1 onward, and `node --check`, `astro build`, and `npm test` are explicit gates.
- PASS Non-obvious API audit: Astro lifecycle events already exist in the repository's ClientRouter usage; observer behavior is tested through visible state/network polling with timeouts; local server readiness is HTTP/status polling rather than a fixed sleep.
