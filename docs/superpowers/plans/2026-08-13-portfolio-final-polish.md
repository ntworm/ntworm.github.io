# Portfolio Final Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the audited balanced polish release: current verified copy, lower idle and initial work, complete accessibility fixes, stronger discovery metadata, clean CI, and safe merge/push without changing the approved visual identity.

**Architecture:** Keep Astro's static content model and isolate new behavior in small ESM controller modules with injected browser primitives so lifecycle rules are unit-testable. Astro components own DOM attachment and cleanup; pure modules own timing, visibility policy, and state. Metadata remains build-time and derives only from the existing content collection.

**Tech Stack:** Node.js 22.12+, Astro 7.2.x, TypeScript/Astro components, ESM controller modules, Node test runner, GitHub Pages, and real browser acceptance.

**Verification contract:** No separate linter exists. Every behavior change uses RED to GREEN, every task runs focused tests plus `git diff --check`, and final acceptance runs `npm audit --omit=dev`, `npm test`, browser checks, and independent review.

---

## File map

- `site/package.json` and `site/package-lock.json`: audited Astro and direct Sharp dependency.
- Project Markdown, `work-presentation.mjs`, `CodeChapter.astro`, and READMEs: conservative verified copy.
- `spotlight-controller.mjs`: one accessible slide and one timer.
- `nav-section-controller.mjs`: current continuous-page chapter.
- `hydra-frame-controller.mjs` plus Hydra shell: proximity, visibility, and one frame chain.
- `heavy-media-policy.mjs` plus Gaussian component: Save-Data/device-memory delay without lower-quality output.
- `work/[slug].astro`: case motion, focus, accessible media, and CreativeWork metadata.
- `seo.mjs`, Layout, sitemap, robots, manifest, and LegacyRedirect: discovery.
- GitHub workflow: full test gate.

### Task 1: Audit and pin the build toolchain

**Files:**
- Modify: `site/package.json`
- Modify: `site/package-lock.json`
- Test: `site/tests/site-integrity.test.mjs`

- [ ] **Write the failing manifest contract**

```js
test('build dependencies are direct and Astro is on the audited release line', () => {
  const pkg = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf8'));
  assert.match(pkg.dependencies.astro, /^\^7\.2\./);
  assert.ok(pkg.devDependencies?.sharp);
});
```

- [ ] **Verify RED**

Run: `node --test --test-name-pattern="build dependencies are direct" tests/site-integrity.test.mjs`  
Expected: FAIL because Astro is `^7.0.7` and Sharp is undeclared.

- [ ] **Install the exact dependency changes**

```powershell
npm install astro@^7.2.1
npm install --save-dev sharp@^0.34.5
```

Do not hand-edit the lockfile.

- [ ] **Verify GREEN and the production audit**

```powershell
node --test --test-name-pattern="build dependencies are direct" tests/site-integrity.test.mjs
npm audit --omit=dev
```

Expected: focused PASS and zero high-severity production advisory. Diagnose any remaining high advisory before continuing.

- [ ] **Commit**

```powershell
git add site/package.json site/package-lock.json site/tests/site-integrity.test.mjs
git commit -m "build: update audited Astro toolchain"
```

### Task 2: Apply conservative verified editorial corrections

**Files:**
- Modify: `site/src/content/projects/ableton-mcp-server.md`
- Modify: `site/src/content/projects/o-compositor.md`
- Modify: `site/src/content/projects/arvore-seca.md`
- Modify: `site/src/components/portfolio/CodeChapter.astro`
- Modify: `site/src/components/portfolio/WorkChapter.astro`
- Modify: `README.md`
- Modify: `site/public/work/README.md`
- Test: `site/tests/work-presentation.test.mjs`
- Test: `site/tests/site-integrity.test.mjs`

- [ ] **Write failing copy contracts**

Require `75 tools in v0.5.3`, the current GitHub bio beginning `Sound director working between cinema, music, and code`, `Selected work across cinema`, the official MOTELX winners URL, and consistent `ntworm.github.io` links. Explicitly assert stale `65 tools`, `Generalist programmer`, and the public Spotify discovery note are absent. Do not assert edits to user-only facts.

- [ ] **Verify RED**

Run: `node --test tests/work-presentation.test.mjs tests/site-integrity.test.mjs`  
Expected: new copy assertions FAIL.

- [ ] **Make only verified edits**

Use:

```text
Ableton MCP Server: "75 tools in v0.5.3"
GitHub bio: "Sound director working between cinema, music, and code. Building tools for Ableton Live, real-time systems, and audiovisual work."
Work intro: "Selected work across cinema, television, music, generative art, performance, and tools."
```

Replace the O Compositor nominee URL with the official winners URL. Remove the unresolved Spotify note. Rewrite both READMEs to match the current site origin, chapter anchors, media discovery, cover/trailer rules, split gallery, and asset coverage. Leave Trisal, A Quermesse, Kakofoni, Em Agosto Chove, fxhash counts, and other ambiguous facts unchanged.

- [ ] **Verify GREEN and commit**

```powershell
node --test tests/work-presentation.test.mjs tests/site-integrity.test.mjs
git diff --check
git add README.md site/public/work/README.md site/src/content/projects/ableton-mcp-server.md site/src/content/projects/o-compositor.md site/src/content/projects/arvore-seca.md site/src/components/portfolio/CodeChapter.astro site/src/components/portfolio/WorkChapter.astro site/tests/work-presentation.test.mjs site/tests/site-integrity.test.mjs
git commit -m "fix: refresh verified portfolio facts"
```

### Task 3: Make the spotlight accessible and load one slide at a time

**Files:**
- Create: `site/src/scripts/spotlight-controller.mjs`
- Create: `site/tests/spotlight-controller.test.mjs`
- Modify: `site/package.json`
- Modify: `site/src/components/portfolio/WorkChapter.astro`
- Modify: `site/src/components/portfolio/WorkEntry.astro`
- Modify: `site/src/components/portfolio/WorkArchive.astro`

- [ ] **Write controller tests first**

Test immediate index 0, wraparound, one owned timer, idempotent pause/resume, reduced-motion static state, and terminal dispose with injected `schedule`, `cancel`, and `setActive`.

```js
const controller = createSpotlightController({
  count: 3,
  setActive: (index) => states.push(index),
  schedule: (fn) => { scheduled = fn; return 1; },
  cancel: () => { cancelled += 1; },
});
assert.deepEqual(states, [0]);
scheduled();
assert.deepEqual(states, [0, 1]);
controller.setPaused('focus', true);
assert.equal(cancelled, 1);
```

- [ ] **Verify RED**

Run: `node --test tests/spotlight-controller.test.mjs`  
Expected: module-not-found.

- [ ] **Implement the pure controller**

Export `createSpotlightController({ count, setActive, schedule, cancel, reducedMotion })`. It owns one timer, tracks pause reasons, calls index 0 immediately, and never schedules while paused, reduced, disposed, or count is below two.

- [ ] **Integrate semantic state and controlled image activation**

Inactive slides receive `inert`, `aria-hidden="true"`, and `tabIndex=-1`. The active slide is the only link in the accessibility tree. Load the current image and prewarm only the next image from `data-src`. Pause for pointer hover, focus-within, hidden document, and reduced motion; dispose before Astro swap. Replace CSS keyframe cycling with class state while preserving the current image/caption composition.

Change unconditional featured eager loading to only the true first candidate, reduce later media prewarm from 200% to 100%, add intrinsic dimensions from the existing manifest, and improve archive mobile metadata contrast without changing two columns or removing projects.

- [ ] **Verify and commit**

```powershell
node --test tests/spotlight-controller.test.mjs tests/continuous-document.test.mjs tests/site-integrity.test.mjs
git diff --check
git add site/package.json site/src/scripts/spotlight-controller.mjs site/tests/spotlight-controller.test.mjs site/src/components/portfolio/WorkChapter.astro site/src/components/portfolio/WorkEntry.astro site/src/components/portfolio/WorkArchive.astro
git commit -m "perf: activate one project spotlight at a time"
```

### Task 4: Improve hierarchy and live navigation state

**Files:**
- Create: `site/src/scripts/nav-section-controller.mjs`
- Create: `site/tests/nav-section-controller.test.mjs`
- Modify: `site/package.json`
- Modify: `site/src/components/Nav.astro`
- Modify: `site/src/components/portfolio/WorkChapter.astro`
- Modify: `site/src/components/portfolio/CodeChapter.astro`
- Modify: `site/src/layouts/Layout.astro`
- Test: `site/tests/continuous-document.test.mjs`

- [ ] **Write RED tests**

Test a pure `selectCurrentSection(entries, previous)` that returns only about/work/code/contact, choosing the visible host closest to the sticky-nav line. Add source assertions for exactly one homepage H1, Work/Code H2, and a complete stable Code `aria-label`.

- [ ] **Verify RED**

Run: `node --test tests/nav-section-controller.test.mjs tests/continuous-document.test.mjs`  
Expected: missing module and heading-count failures.

- [ ] **Implement controller and DOM binder**

```js
export function selectCurrentSection(entries, previous = 'about') {
  const visible = entries.filter((entry) => entry.isIntersecting);
  return visible.sort((a, b) => Math.abs(a.top - 80) - Math.abs(b.top - 80))[0]?.id ?? previous;
}
```

Bind one IntersectionObserver per Astro document, update `.is-active` plus `aria-current="location"`, and disconnect before swap. Case routes retain Work as `aria-current="page"`.

- [ ] **Apply approved visual polish**

Add a subtle noir gradient pseudo-element behind the sticky nav, keep content above it, set mobile links to 11px with at least 32px vertical alignment space, and remove the immersive rule that forces all backing off. Change Work and Code H1 elements to H2 without changing styles; add the full Code headline as `aria-label`.

- [ ] **Verify and commit**

```powershell
node --test tests/nav-section-controller.test.mjs tests/continuous-document.test.mjs tests/site-integrity.test.mjs
git diff --check
git add site/package.json site/src/scripts/nav-section-controller.mjs site/tests/nav-section-controller.test.mjs site/src/components/Nav.astro site/src/components/portfolio/WorkChapter.astro site/src/components/portfolio/CodeChapter.astro site/src/layouts/Layout.astro site/tests/continuous-document.test.mjs site/tests/site-integrity.test.mjs
git commit -m "fix: strengthen portfolio navigation semantics"
```

### Task 5: Put Hydra on one pausable render loop

**Files:**
- Create: `site/src/scripts/hydra-frame-controller.mjs`
- Create: `site/tests/hydra-frame-controller.test.mjs`
- Modify: `site/package.json`
- Modify: `site/public/hydra/lines-and-cells.mjs`
- Modify: `site/public/hydra/lines-and-cells.html`
- Modify: `site/src/components/HydraBackground.astro`
- Modify: `site/tests/hydra-adaptive-resolution.test.mjs`

- [ ] **Write RED lifecycle tests**

The parent controller active condition is `insideRange && visible && !reducedMotion && !saveData`. Assert it emits only state transitions, resends current state after iframe load, and dispose emits inactive then disconnects.

- [ ] **Verify RED**

Run: `node --test tests/hydra-frame-controller.test.mjs tests/hydra-adaptive-resolution.test.mjs`  
Expected: module-not-found/new contract failures.

- [ ] **Implement one official Hydra loop**

The official hydra-synth API documents `autoLoop: false` and `hydra.tick(dt)`. Instantiate:

```js
const hydra = new Hydra({ detectAudio: false, canvas: hydraCanvas, autoLoop: false });
let lastHydraTick = performance.now();
function draw() {
  const now = performance.now();
  hydra.tick(now - lastHydraTick);
  lastHydraTick = now;
  noStroke();
  plane(WIDTH, HEIGHT);
  p5graphics.drawingContext.drawImage(hydraCanvas, 0, 0);
  texture(p5graphics);
}
```

Listen only to same-origin parent messages. Inactive calls `noLoop()`; active resets the clock then calls `loop()`. Local document visibility applies the same transition.

- [ ] **Bind parent proximity and accessibility**

Add `tabindex="-1"` to the decorative iframe. Observe the About host, combine proximity/visibility/reduced-motion/Save-Data, send the state after iframe load, and terminate observer/listeners before swaps. Add a shell CSP allowing self, the two immutable IPFS scripts, required inline seed/style, data/blob images, and no network connections beyond those scripts.

- [ ] **Verify and commit**

```powershell
node --test tests/hydra-frame-controller.test.mjs tests/hydra-adaptive-resolution.test.mjs tests/site-integrity.test.mjs
git diff --check
git add site/package.json site/src/scripts/hydra-frame-controller.mjs site/tests/hydra-frame-controller.test.mjs site/public/hydra/lines-and-cells.mjs site/public/hydra/lines-and-cells.html site/src/components/HydraBackground.astro site/tests/hydra-adaptive-resolution.test.mjs site/tests/site-integrity.test.mjs
git commit -m "perf: pause Hydra outside the About chapter"
```

### Task 6: Adapt heavy Gaussian loading without lowering quality

**Files:**
- Create: `site/src/scripts/heavy-media-policy.mjs`
- Create: `site/tests/heavy-media-policy.test.mjs`
- Modify: `site/package.json`
- Modify: `site/src/components/GaussianBackground.astro`
- Delete: `site/src/components/GaussianViewer.astro`
- Delete: `site/public/work/code/splats/carro/carro.compressed.ply`
- Modify: `site/tests/site-integrity.test.mjs`

- [ ] **Write RED policy/reference tests**

```js
assert.equal(shouldDelayHeavyMedia({ saveData: true, deviceMemory: 8 }), true);
assert.equal(shouldDelayHeavyMedia({ saveData: false, deviceMemory: 2 }), true);
assert.equal(shouldDelayHeavyMedia({ saveData: false, deviceMemory: 4 }), false);
assert.equal(shouldDelayHeavyMedia({}), false);
```

Add repository assertions proving no source consumes GaussianViewer or the PLY and requiring no published PLY.

- [ ] **Verify RED**

Run: `node --test tests/heavy-media-policy.test.mjs tests/site-integrity.test.mjs`  
Expected: module-not-found and PLY-presence failure.

- [ ] **Implement the minimal policy**

Return true only for explicit Save-Data or finite deviceMemory at or below 2 GB. Keep the current 200% load margin normally and use a direct 0px margin for constrained devices. Do not modify splat sources, renderer size, shaders, particles, cameras, canvas CSS, or posters.

- [ ] **Delete proven-unused artifacts, verify, and commit**

```powershell
node --test tests/heavy-media-policy.test.mjs tests/gaussian-frame-loop.test.mjs tests/site-integrity.test.mjs
git diff --check
git add site/package.json site/src/scripts/heavy-media-policy.mjs site/tests/heavy-media-policy.test.mjs site/src/components/GaussianBackground.astro site/tests/site-integrity.test.mjs
git add -u site/src/components/GaussianViewer.astro site/public/work/code/splats/carro/carro.compressed.ply
git commit -m "perf: adapt heavy media to constrained devices"
```

### Task 7: Fix case-study motion, media, and interactive focus

**Files:**
- Modify: `site/src/pages/work/[slug].astro`
- Modify: `site/src/components/portfolio/CodeChapter.astro`
- Modify: `site/tests/site-integrity.test.mjs`

- [ ] **Write failing accessibility contracts**

Require video controls, reduced-motion pause/no-loop behavior, a live loading status for interactive art, focus transfer after user activation, tested iframe sandbox/referrer attributes, non-empty project-scoped gallery labels, and no duplicate tool-card destination in the tab order.

- [ ] **Verify RED**

Run: `node --test --test-name-pattern="case|interactive|motion|gallery|tool" tests/site-integrity.test.mjs`  
Expected: new assertions FAIL.

- [ ] **Implement conservative accessible media**

Trailers expose controls. A binder on DOMContentLoaded/Astro page load applies:

```js
if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
  video.autoplay = false;
  video.loop = false;
  video.pause();
}
```

Use `Title — project visual N` only where no authoritative description exists; duplicate blurred backdrops remain empty-alt. Keep the launch button while loading, expose `role="status" aria-live="polite"`, focus the iframe only after a real button click and load, and retain retry/poster state on error or timeout. Make the duplicate tool media destination a non-anchor while preserving styling.

- [ ] **Verify and commit**

```powershell
node --test tests/site-integrity.test.mjs tests/continuous-document.test.mjs
git diff --check
git add site/src/pages/work/[slug].astro site/src/components/portfolio/CodeChapter.astro site/tests/site-integrity.test.mjs site/tests/continuous-document.test.mjs
git commit -m "fix: make portfolio media accessible and motion-safe"
```

### Task 8: Add discovery metadata and immediate legacy redirects

**Files:**
- Create: `site/src/utils/seo.mjs`
- Create: `site/tests/seo.test.mjs`
- Create: `site/src/pages/sitemap.xml.ts`
- Create: `site/public/robots.txt`
- Create: `site/public/site.webmanifest`
- Create: `site/src/components/LegacyRedirect.astro`
- Modify: `site/package.json`
- Modify: `site/src/layouts/Layout.astro`
- Modify: `site/src/pages/index.astro`
- Modify: `site/src/pages/work/[slug].astro`
- Modify: legacy route pages
- Modify: `site/tests/primary-routing.test.mjs`

- [ ] **Write SEO tests first**

Test canonical query stripping, first-paragraph Markdown excerpts, sitemap content collection use, robots sitemap URL, Layout JSON-LD/theme/manifest, and LegacyRedirect use.

```js
assert.equal(buildCanonical('https://ntworm.github.io', '/work/x?utm_source=a'), 'https://ntworm.github.io/work/x');
assert.equal(excerptMarkdown('First **useful** paragraph.\n\nSecond.', 160), 'First useful paragraph.');
```

- [ ] **Verify RED**

Run: `node --test tests/seo.test.mjs tests/primary-routing.test.mjs tests/site-integrity.test.mjs`  
Expected: missing modules/files and old redirect contracts fail.

- [ ] **Implement pure helpers and metadata**

`buildCanonical` uses origin plus pathname only. `excerptMarkdown` picks the first non-heading paragraph, removes markup/HTML, collapses whitespace, and truncates at a word boundary. Layout accepts structured data and serializes JSON with `<` escaped. Homepage emits Person JSON-LD from existing Contact facts; cases emit CreativeWork from title, role, year, cover, canonical, and excerpt only.

- [ ] **Add discovery files and redirect component**

The static sitemap includes home, work index, and all 25 case URLs. Robots allows all and points to the sitemap. The manifest uses current portfolio name, dark colors, start URL, and SVG icon. LegacyRedirect renders canonical/noindex, a zero-second meta fallback, an inline `location.replace(destination)`, and a visible Continue link; all four legacy routes pass exact anchors.

- [ ] **Verify and commit**

```powershell
node --test tests/seo.test.mjs tests/primary-routing.test.mjs tests/site-integrity.test.mjs
git diff --check
git add site/package.json site/src/utils/seo.mjs site/tests/seo.test.mjs site/src/pages/sitemap.xml.ts site/public/robots.txt site/public/site.webmanifest site/src/components/LegacyRedirect.astro site/src/layouts/Layout.astro site/src/pages/index.astro site/src/pages/work/[slug].astro site/src/pages/about.astro site/src/pages/code.astro site/src/pages/contact.astro site/src/pages/work/index.astro site/tests/primary-routing.test.mjs site/tests/site-integrity.test.mjs
git commit -m "feat: add portfolio discovery metadata"
```

### Task 9: Gate deployment, accept, review, merge, and push

**Files:**
- Modify: `.github/workflows/deploy.yml`
- Modify: `site/tests/site-integrity.test.mjs`
- Modify only tested regressions discovered during acceptance.

- [ ] **Add RED deployment contract**

Assert workflow uses `npm ci` then `npm test` before upload and does not run a redundant separate build afterward.

- [ ] **Verify RED, update workflow, and verify GREEN**

Replace the build step with:

```yaml
- name: Test and build Astro site
  working-directory: site
  run: npm test
```

Run: `node --test --test-name-pattern="deployment" tests/site-integrity.test.mjs`  
Expected after change: PASS.

- [ ] **Commit the CI gate**

```powershell
git add .github/workflows/deploy.yml site/tests/site-integrity.test.mjs
git commit -m "ci: test portfolio before deployment"
```

- [ ] **Run the complete feature-branch gate**

```powershell
npm audit --omit=dev
npm test
git diff --check
git status --short --branch
```

Expected: zero high production advisories, all static routes and tests pass, clean diff check, clean feature worktree.

- [ ] **Run real browser acceptance**

Restart the Astro server from the feature worktree. Verify 1280×720, 390×844, 320×700, and reduced motion: no overflow; 25 archive projects; one accessible spotlight link; reduced-motion video paused; Hydra iframe not focusable; live nav state; Hydra frames stop outside About/hidden and resume inside; zero splat transfers at top; independent full-quality Gaussians; no query-navigation duplication; no console errors. Inspect homepage plus O Compositor, Kakofoni, and a gallery-only case.

- [ ] **Get independent read-only review**

Review `0c8efd2..HEAD` and final status. Every Critical/Important finding requires its own RED to GREEN fix followed by the full gate.

- [ ] **Integrate without touching local private artifacts**

Fetch and inspect main/remote. Do not stage, stash, move, delete, or commit `profile/`, `job_text.txt`, `latest_jobs.txt`, `soundlister.txt`, or the user's main `.gitignore` edit. If remote diverged, use a temporary integration worktree rather than modifying private local state.

If main has only the known local commit and remote has not diverged:

```powershell
git merge --no-ff perf/hydra-adaptive-preview -m "merge: finalize portfolio performance and polish"
cd site
npm test
cd ..
git push origin main
git ls-remote origin refs/heads/main
git rev-parse HEAD
```

Expected: merged tests pass and remote SHA equals local HEAD. Never force-push. Preserve the feature worktree until remote verification succeeds.

## Self-Review

Spec coverage: Tasks 1–9 cover every approved factual, visual, accessibility, performance, discovery, CI, review, merge, and push requirement. Aggressive artwork conversion and homepage restructuring remain excluded.

Placeholder scan: no TBD, TODO, deferred implementation, or undefined “similar to” step remains.

Type consistency: controller names, arguments, lifecycle states, selectors, and paths are consistent between tests and implementation.

Execution Consistency Audit evidence:

- PASS Test/implementation trace: every new controller behavior has a RED test and matching implementation step; source contracts trace to exact components.
- PASS Per-task command executability: commands use existing Node/npm/Git or files created earlier in the same task.
- PASS File usage audit: every new module is imported by its owner/test; discovery assets are served or linked; all legacy routes consume LegacyRedirect.
- PASS Spec lifecycle audit: spotlight, nav, Hydra, Gaussian, video, and iframe flows define attach, pause, resume, visibility, error, swap, and terminal dispose.
- PASS Time source audit: spotlight owns scheduler delays; Hydra uses performance.now milliseconds and resets on resume.
- PASS State scope audit: controllers own per-document state; no new cross-page global cache exists.
- PASS Environment audit: acceptance uses desktop loopback or the configured GitHub Pages origin; no LAN URL is introduced.
- PASS Browser event audit: acceptance triggers real focus, pointer, visibility, scroll, and button-click paths used by production.
- PASS Lint/import audit: ESM imports exist before use, Sharp is direct, and build/test is the configured syntax/type gate.
- PASS Non-obvious API audit: Hydra autoLoop false plus tick(dt) is verified by the official hydra-synth README; readiness uses observable load/state with bounded waits.
