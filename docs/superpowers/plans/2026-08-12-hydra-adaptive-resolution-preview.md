# Hydra Adaptive Resolution Preview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Serve a visually faithful Lines and Cells preview whose p5 and Hydra buffers follow the About panel's live aspect ratio while staying below a 921,600-pixel budget.

**Architecture:** A same-origin iframe isolates p5/Hydra globals and retains the original fxhash seed and visual program. A pure render-budget module converts the iframe viewport into bounded same-aspect dimensions; the child applies those dimensions to both rendering buffers while the parent only fills the stage and controls whether the iframe is allowed to load.

**Tech Stack:** Astro 7, browser ESM, p5.js, hydra-js, Node.js built-in test runner.

---

## File structure

- Create `site/public/hydra/render-budget.mjs`: pure dimension calculation shared by the browser sketch and Node tests.
- Create `site/public/hydra/lines-and-cells.mjs`: readable adaptive bootstrap containing the original visual program.
- Create `site/public/hydra/lines-and-cells.html`: isolated same-origin shell with the original fxhash seed bootstrap.
- Modify `site/src/components/HydraBackground.astro`: point at the local shell, remove independent X/Y scaling, and gate live loading.
- Modify `site/tests/continuous-document.test.mjs`: replace assertions that freeze the old remote/scaled implementation.
- Create `site/tests/hydra-adaptive-resolution.test.mjs`: verify the pixel-budget math and integration contract.
- Modify `site/package.json`: include the new test in the canonical suite.

### Task 1: Render-budget contract

**Files:**
- Create: `site/public/hydra/render-budget.mjs`
- Create: `site/tests/hydra-adaptive-resolution.test.mjs`
- Modify: `site/package.json`

- [ ] **Step 1: Write failing tests for same-aspect bounded dimensions**

```js
import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateHydraRenderSize } from '../public/hydra/render-budget.mjs';

test('Hydra render size follows a tall panel without exceeding its budget', () => {
  const result = calculateHydraRenderSize({ width: 1280, height: 2028, pixelBudget: 921_600 });
  assert.ok(result.width * result.height <= 921_600);
  assert.ok(Math.abs(result.width / result.height - 1280 / 2028) < 0.003);
  assert.ok(result.width >= 760 && result.width <= 765);
  assert.ok(result.height >= 1205 && result.height <= 1210);
});

test('Hydra render size stays finite for an unmeasured panel', () => {
  assert.deepEqual(calculateHydraRenderSize({ width: 0, height: 0 }), { width: 640, height: 360 });
});
```

- [ ] **Step 2: Add the test file to the package test command and prove it fails**

Run: `npm test -- --test-name-pattern="Hydra render size"`

Expected: FAIL because `render-budget.mjs` does not exist.

- [ ] **Step 3: Implement the pure calculation**

```js
export const HYDRA_PIXEL_BUDGET = 1280 * 720;

export function calculateHydraRenderSize({ width, height, pixelBudget = HYDRA_PIXEL_BUDGET } = {}) {
  if (!(width > 0) || !(height > 0) || !(pixelBudget > 0)) return { width: 640, height: 360 };
  const aspect = width / height;
  const renderWidth = Math.max(1, Math.floor(Math.sqrt(pixelBudget * aspect)));
  const renderHeight = Math.max(1, Math.floor(renderWidth / aspect));
  return { width: renderWidth, height: renderHeight };
}
```

- [ ] **Step 4: Run the focused test**

Run: `node --test --test-name-pattern="Hydra render size" tests/hydra-adaptive-resolution.test.mjs`

Expected: 2 tests pass.

- [ ] **Step 5: Commit**

```powershell
git add site/public/hydra/render-budget.mjs site/tests/hydra-adaptive-resolution.test.mjs site/package.json
git commit -m "test: define adaptive Hydra render budget"
```

### Task 2: Faithful adaptive artwork shell

**Files:**
- Create: `site/public/hydra/lines-and-cells.html`
- Create: `site/public/hydra/lines-and-cells.mjs`
- Modify: `site/tests/hydra-adaptive-resolution.test.mjs`

- [ ] **Step 1: Add failing source-contract tests**

```js
const html = readFileSync(join(process.cwd(), 'public', 'hydra', 'lines-and-cells.html'), 'utf8');
const sketch = readFileSync(join(process.cwd(), 'public', 'hydra', 'lines-and-cells.mjs'), 'utf8');
assert.match(html, /fxhash-snippet/);
assert.match(html, /lines-and-cells\.mjs/);
assert.match(sketch, /calculateHydraRenderSize/);
assert.match(sketch, /pixelDensity\(1\)/);
assert.match(sketch, /hydra\.setResolution\(width, height\)/);
assert.doesNotMatch(sketch, /pixelDensity\(2\.5/);
```

- [ ] **Step 2: Run the source-contract test and prove it fails**

Run: `node --test tests/hydra-adaptive-resolution.test.mjs`

Expected: FAIL because the shell and sketch do not exist.

- [ ] **Step 3: Create the local HTML shell**

Use the exact seed bootstrap from the original IPFS document, keep the existing `fxhash` query contract, load p5 and hydra-js from the original immutable IPFS directory, and load `./lines-and-cells.mjs` as a module. Inline CSS must set `html`, `body`, and both canvases to fill the iframe with no margin and no preserved aspect ratio.

- [ ] **Step 4: Create the adaptive sketch**

The module imports `calculateHydraRenderSize`, creates the original Hydra chain unchanged, sets `pixelDensity(1)`, and centralizes buffer creation in:

```js
function applyRenderSize() {
  const { width, height } = calculateHydraRenderSize({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  hydra.setResolution(width, height);
  if (mainCanvas) resizeCanvas(width, height);
  else mainCanvas = createCanvas(width, height, WEBGL);
  p5graphics?.remove();
  p5graphics = createGraphics(Math.max(1, width - 2), height);
  p5graphics.pixelDensity(1);
  return { width, height };
}
```

Expose `setup`, `draw`, `windowResized`, and `keyPressed` on `window`. Debounce resize through one 180 ms timer and keep the original `fxrand` calls, Hydra chain, speed, frame rate, and texture copy.

- [ ] **Step 5: Run the focused tests**

Run: `node --test tests/hydra-adaptive-resolution.test.mjs`

Expected: all Hydra preview tests pass.

- [ ] **Step 6: Commit**

```powershell
git add site/public/hydra/lines-and-cells.html site/public/hydra/lines-and-cells.mjs site/tests/hydra-adaptive-resolution.test.mjs
git commit -m "feat: add adaptive Lines and Cells shell"
```

### Task 3: Parent integration and low-power gate

**Files:**
- Modify: `site/src/components/HydraBackground.astro`
- Modify: `site/tests/continuous-document.test.mjs`
- Modify: `site/tests/hydra-adaptive-resolution.test.mjs`

- [ ] **Step 1: Replace old integration assertions with failing adaptive assertions**

Assert that the component points to `/hydra/lines-and-cells.html` with the approved seed, does not define `--hydra-scale-x` or `--hydra-scale-y`, styles the iframe at `width:100%; height:100%`, and checks both reduced motion and `navigator.connection?.saveData` before assigning `src`.

- [ ] **Step 2: Run integration tests and prove they fail**

Run: `node --test tests/hydra-adaptive-resolution.test.mjs tests/continuous-document.test.mjs`

Expected: FAIL against the current remote URL and scale variables.

- [ ] **Step 3: Simplify the parent component**

Change the source to the local shell with the exact seed, remove scale variables and the ResizeObserver, and make the iframe fill its stage directly. `loadHydra()` must leave `about:blank` when reduced motion or Save-Data is active; otherwise it assigns the source only after the stage has measurable dimensions. Existing cleanup must run before the early return when the new page has no Hydra surface.

- [ ] **Step 4: Run focused integration tests**

Run: `node --test tests/hydra-adaptive-resolution.test.mjs tests/continuous-document.test.mjs`

Expected: all focused tests pass.

- [ ] **Step 5: Commit**

```powershell
git add site/src/components/HydraBackground.astro site/tests/continuous-document.test.mjs site/tests/hydra-adaptive-resolution.test.mjs
git commit -m "perf: bound Hydra resolution to its panel"
```

### Task 4: Verification and live preview

**Files:**
- No source changes expected.

- [ ] **Step 1: Run the full suite**

Run: `npm test`

Expected: 31 pages build and all tests pass.

- [ ] **Step 2: Start the preview server**

Run: `npm run dev -- --host 127.0.0.1 --port 4321`

Expected: Astro reports `http://127.0.0.1:4321/` ready.

- [ ] **Step 3: Verify in the browser**

At `/`, verify the artwork is visible. Inspect the iframe and assert that the
visible p5 canvas and hidden Hydra canvas each contain no more than 921,600
pixels and that each buffer ratio is within 0.003 of the iframe viewport ratio.
Confirm the parent no longer has `--hydra-scale-x` or `--hydra-scale-y`.

- [ ] **Step 4: Keep the server running and hand the URL to the user**

The URL is desktop loopback only: `http://127.0.0.1:4321/`. The user can judge
visual parity before the branch is merged or the wider performance plan begins.

## Self-Review

Spec coverage:
- Tasks 1-3 cover bounded same-aspect buffers, faithful local shell, resize behavior, low-power gating, and parent integration.
- Task 4 covers automated and visual acceptance plus the requested live URL.

Execution Consistency Audit evidence:
- PASS Test/implementation trace: Task 1 assertions map to `calculateHydraRenderSize`; Task 2 source assertions map to the shell/bootstrap; Task 3 assertions map to the parent gate and CSS.
- PASS Per-task command executability: every command uses Node/npm and files created by that task or earlier.
- PASS File usage audit: the parent loads the local HTML; HTML loads both local modules; package.json invokes the new test.
- PASS Spec lifecycle audit: iframe starts blank, loads once after measurable layout, and remains blank under reduced motion/Save-Data; resize state belongs to the child timer.
- N/A Time source audit: no persisted timestamps or cross-clock comparisons are introduced.
- PASS State scope audit: render state and the resize timer are owned by one iframe lifetime; parent cleanup remains window-scoped through its existing singleton.
- PASS Environment audit: the delivered URL is explicitly desktop-only loopback; no LAN/mobile claim is made.
- N/A Browser event audit: verification reads rendered state and does not claim gesture coverage.
- PASS Lint/import audit: browser files are ESM under the existing `type: module`; tests use installed Node built-ins only.
- PASS Non-obvious API audit: `resizeCanvas`, `createGraphics.pixelDensity`, and `hydra.setResolution` are already exercised by the original primary-source sketch; browser verification observes final buffer dimensions.
