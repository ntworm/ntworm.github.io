import assert from 'node:assert/strict';
import test from 'node:test';
import {
  augmentGaussianVertexShader,
  calculateParticleBounds,
  createGaussianParticleUniformController,
  createGaussianParticleAutopilot,
  createGaussianLightAutopilot,
  createGaussianWorldTransition,
  gaussianParticleProfile,
  installGaussianParticleShaderPatch,
} from '../src/scripts/gaussian-particle-effects.mjs';

test('car scene trades screen-space shift for stronger particle erosion', () => {
  assert.equal(typeof gaussianParticleProfile, 'function');
  const people = gaussianParticleProfile('hero-right');
  const car = gaussianParticleProfile('section-left');

  assert.deepEqual(people, { displacement: 0.13, transitionOpacity: 0.32 });
  assert.ok(car.displacement * 2.5 <= people.displacement * 1.5, 'zoomed car must not travel farther on screen');
  assert.ok(car.transitionOpacity >= people.transitionOpacity * 2, 'car should dissolve instead of shifting');
});

test('lighting autopilot is seeded, smooth, bounded, and visits psychedelic states', () => {
  assert.equal(typeof createGaussianLightAutopilot, 'function');
  const first = createGaussianLightAutopilot(9101);
  const replay = createGaussianLightAutopilot(9101);
  const second = createGaussianLightAutopilot(4223);
  const frames = [];
  const replayFrames = [];
  const secondFrames = [];

  for (let index = 0; index < 6_000; index += 1) {
    frames.push(first.sample(0.1));
    replayFrames.push(replay.sample(0.1));
    secondFrames.push(second.sample(0.1));
  }

  assert.deepEqual(frames, replayFrames);
  assert.notDeepEqual(frames, secondFrames);
  assert.ok(frames.every((frame) => frame.ambient >= 0.06 && frame.ambient <= 1));
  assert.ok(frames.every((frame) => frame.lightRadius >= 0.16 && frame.lightRadius <= 1.4));
  assert.ok(frames.every((frame) => frame.lightIntensity >= 0 && frame.lightIntensity <= 1.8));
  assert.ok(frames.every((frame) => frame.chromatic >= 0 && frame.chromatic <= 1));
  assert.ok(frames.some((frame) => frame.ambient < 0.2), 'some episodes should leave only a light nucleus');
  assert.ok(frames.some((frame) => frame.chromatic > 0.65), 'some episodes should become strongly chromatic');
  assert.ok(new Set(frames.map((frame) => frame.palette)).size >= 4);

  for (let index = 1; index < frames.length; index += 1) {
    assert.ok(Math.abs(frames[index].ambient - frames[index - 1].ambient) < 0.035);
    assert.ok(Math.abs(frames[index].lightIntensity - frames[index - 1].lightIntensity) < 0.06);
    assert.ok(Math.abs(frames[index].chromatic - frames[index - 1].chromatic) < 0.04);
  }
});

test('world transition builds slowly and reverses without jumping', () => {
  assert.equal(typeof createGaussianWorldTransition, 'function');
  const transition = createGaussianWorldTransition({
    expandSeconds: 3.6,
    collapseSeconds: 3.2,
  });

  const rest = transition.sample(0, 0.1);
  assert.deepEqual(rest, { progress: 0, activity: 0, direction: 0, time: 0.1 });

  const opening = [];
  for (let frame = 0; frame < 20; frame += 1) opening.push(transition.sample(1, 0.2));
  assert.ok(opening.every((frame, index) => index === 0 || frame.progress >= opening[index - 1].progress));
  assert.ok(opening[4].progress > 0 && opening[4].progress < 0.4, 'opening must not behave like an instant fade');
  assert.ok(opening.some((frame) => frame.activity > 0.8));
  assert.equal(opening.at(-1).progress, 1);

  const beforeReverse = opening.at(-1).progress;
  const reverse = transition.sample(0, 0.05);
  assert.ok(reverse.progress <= beforeReverse && reverse.progress > 0.95, 'reversal should start from the current world');
  assert.ok(reverse.direction <= 0);

  let closed = reverse;
  for (let frame = 0; frame < 24; frame += 1) closed = transition.sample(0, 0.2);
  assert.equal(closed.progress, 0);
  assert.equal(closed.activity, 0);
});

test('world transition brakes before the collapsed endpoint', () => {
  const transition = createGaussianWorldTransition();
  let frame;
  for (let index = 0; index < 360 && frame?.progress !== 1; index += 1) {
    frame = transition.sample(1, 1 / 60);
  }

  const closingTail = [];
  for (let index = 0; index < 360; index += 1) {
    frame = transition.sample(0, 1 / 60);
    if (frame.progress < 0.1) closingTail.push(frame);
    if (frame.progress === 0) break;
  }

  const lastMoving = closingTail.findLast((sample) => sample.progress > 0);
  assert.ok(closingTail.length > 8);
  assert.ok(closingTail[0].activity > lastMoving.activity, 'the front should visibly decelerate near the core');
  assert.ok(lastMoving.activity < 0.2, 'the final splats must not stop from full speed');
});

test('particle autopilots alternate slow deep sweeps with regenerative 3D regions', () => {
  const first = createGaussianParticleAutopilot(8117);
  const replay = createGaussianParticleAutopilot(8117);
  const second = createGaussianParticleAutopilot(1469);
  const firstSequence = [];
  const replaySequence = [];
  const secondSequence = [];

  for (let frame = 0; frame < 4_800; frame += 1) {
    firstSequence.push(first.sample(0.1));
    replaySequence.push(replay.sample(0.1));
    secondSequence.push(second.sample(0.1));
  }

  assert.deepEqual(firstSequence, replaySequence);
  assert.notDeepEqual(firstSequence, secondSequence);
  assert.ok(firstSequence.some((frame) => frame.scanStrength === 0), 'passes need quiet intervals');
  assert.ok(firstSequence.some((frame) => frame.scanStrength > 0.8), 'dissolve needs a visible crest');
  assert.ok(firstSequence.some((frame) => frame.scanCenter < -0.8));
  assert.ok(firstSequence.some((frame) => frame.scanCenter > 0.8));
  assert.ok(new Set(firstSequence.map((frame) => frame.scanAxis.join(','))).size >= 3);
  assert.ok(firstSequence.some((frame) => frame.scanWidth >= 0.55), 'some passes should dissolve broad regions');
  const activeFrames = firstSequence.filter((frame) => frame.scanDuration > 0);
  assert.ok(activeFrames.every((frame) => frame.scanDuration >= 9), 'quick glitch passes should be removed');
  assert.ok(activeFrames.some((frame) => frame.scanDuration >= 20), 'deep sweeps should remain long and slow');
  assert.ok(activeFrames.some((frame) => frame.scanShape === 0), 'some events should remain deep sweeps');
  assert.ok(activeFrames.some((frame) => frame.scanShape === 1), 'some events should be regenerative blocks');
  assert.ok(activeFrames.some((frame) => frame.scanShape === 2), 'some events should be radial pings');
  const pings = activeFrames.filter((frame) => frame.scanShape === 2);
  assert.ok(pings.some((frame) => frame.scanDirection === -1), 'pings should sometimes rebuild toward the center');
  assert.ok(pings.some((frame) => frame.scanDirection === 1), 'pings should sometimes rebuild toward the edges');
  const blocks = activeFrames.filter((frame) => frame.scanShape === 1);
  assert.ok(
    blocks.every((frame) => Math.max(...frame.scanExtent) <= 0.6),
    'regenerative blocks should stay concentrated',
  );
  assert.ok(
    activeFrames.some((frame) => frame.scanExtent[0] > frame.scanExtent[1] * 1.5),
    'some regenerated regions should stretch horizontally',
  );
  assert.ok(
    activeFrames.some((frame) => frame.scanExtent[1] > frame.scanExtent[0] * 1.5),
    'some regenerated regions should stretch vertically',
  );
  assert.ok(firstSequence.every((frame) => frame.scanWidth >= 0.18 && frame.scanWidth <= 0.78));
  assert.ok(firstSequence.every((frame) => Math.abs(frame.pulse) <= 0.12));

  let longestQuietRun = 0;
  let quietRun = 0;
  for (const frame of firstSequence) {
    quietRun = frame.scanStrength === 0 ? quietRun + 1 : 0;
    longestQuietRun = Math.max(longestQuietRun, quietRun);
  }
  assert.ok(longestQuietRun <= 80, 'localized regeneration should recur without long dead gaps');
});

test('scan envelopes change smoothly and return fully to rest', () => {
  const autopilot = createGaussianParticleAutopilot(8117);
  let previous = autopilot.sample(0);
  let sawActive = false;
  let sawRestAfterActive = false;
  let heldFrames = 0;
  let longestHold = 0;

  for (let frame = 0; frame < 7_200; frame += 1) {
    const current = autopilot.sample(0.1);
    assert.ok(Math.abs(current.scanStrength - previous.scanStrength) < 0.08);
    assert.ok(current.scanStrength >= 0 && current.scanStrength <= 1);
    if (current.scanStrength > 0) sawActive = true;
    if (sawActive && current.scanStrength === 0) sawRestAfterActive = true;
    heldFrames = current.scanStrength === 1 ? heldFrames + 1 : 0;
    longestHold = Math.max(longestHold, heldFrames);
    previous = current;
  }

  assert.ok(sawActive && sawRestAfterActive);
  assert.ok(longestHold >= 10, 'a dissolved region should linger before rebuilding');
});

test('particle bounds ignore incomplete vertices and pad flat axes', () => {
  const bounds = calculateParticleBounds(new Float32Array([
    -2, 4, 1,
    6, -3, 9,
    2, 0, 5,
    999,
  ]));

  assert.deepEqual(bounds, { min: [-2, -3, 1], max: [6, 4, 9] });

  const flat = calculateParticleBounds(new Float32Array([1, 2, 3, 1, 2, 3]));
  assert.deepEqual(flat, { min: [0.5, 1.5, 2.5], max: [1.5, 2.5, 3.5] });
});

test('shader augmentation injects reversible digital dust exactly once', () => {
  const source = `#version 300 es
uniform highp usampler2D u_texture;
void main () {
  uint index = uint(gl_VertexID) / 4u;
  uvec4 cen = texelFetch(u_texture, ivec2(0), 0);
  vec4 cam = viewTransform * vec4(uintBitsToFloat(cen.xyz), 1);
  vec4 pos2d = projection * cam;
  vec4 color = vec4(1.0);
  vColor = colorTransform * color;
}`;

  const first = augmentGaussianVertexShader(source);
  assert.equal(first.patched, true);
  assert.match(first.source, /uParticleScanCenter/);
  assert.match(first.source, /uParticleScanShape/);
  assert.match(first.source, /particleVolume/);
  assert.match(first.source, /particleBlockDistance/);
  assert.match(first.source, /particlePing/);
  assert.match(first.source, /particleBlockGain/);
  assert.match(first.source, /uParticleNearStrength/);
  assert.match(first.source, /uParticleWorldReveal/);
  assert.match(first.source, /uParticleTransitionActivity/);
  assert.match(first.source, /uParticleTransitionDirection/);
  assert.match(first.source, /uParticleTransitionOpacity/);
  assert.match(first.source, /uParticleFlowTime/);
  assert.match(first.source, /uParticleLightCenter/);
  assert.match(first.source, /uParticleLightRadius/);
  assert.match(first.source, /uParticleLightIntensity/);
  assert.match(first.source, /uParticleAmbient/);
  assert.match(first.source, /uParticleTintA/);
  assert.match(first.source, /uParticleTintB/);
  assert.match(first.source, /uParticleChromatic/);
  assert.match(first.source, /uParticleEnergyPulse/);
  assert.match(first.source, /particleLightField/);
  assert.match(first.source, /particleEnergyShell/);
  assert.match(first.source, /particleFlowNoise/);
  assert.match(first.source, /particleWorldThreshold/);
  assert.match(first.source, /particleWorldFront/);
  assert.match(first.source, /particleWorldDust/);
  assert.match(first.source, /particleOpening = step\(0\.001, uParticleTransitionDirection\)/);
  assert.match(first.source, /particleWorldDustMask = max\(1\.0 - particleCoreVisible, particleCoreVisible \* particleOpening\)/);
  assert.match(first.source, /particleWorldDust = particleWorldDustMask \* particleWorldFront \* uParticleTransitionActivity/);
  assert.match(first.source, /particleEndpointScatter/);
  assert.match(first.source, /smoothstep\(particleSeed \* 0\.045, min\(0\.075, particleSeed \* 0\.045 \+ 0\.02\), uParticleWorldReveal\)/);
  assert.doesNotMatch(first.source, /uParticlePointerUv|uParticleBurstUv/);
  assert.match(first.source, /particleErode/);
  assert.match(first.source, /vColor\.a \*= 1\.0 - particleErode/);

  const second = augmentGaussianVertexShader(first.source);
  assert.equal(second.patched, false);
  assert.equal(second.source, first.source);
});

test('blackout retains a small moving object-space ember at the core', () => {
  const source = `#version 300 es
uniform highp usampler2D u_texture;
void main () {
  uint index = 0u;
  uvec4 cen = uvec4(0u);
  vec4 cam = viewTransform * vec4(uintBitsToFloat(cen.xyz), 1);
  vec4 pos2d = projection * cam;
  vec4 color = vec4(1.0);
  vColor = colorTransform * color;
}`;
  const result = augmentGaussianVertexShader(source);

  assert.match(result.source, /particleBlackout = 1\.0 - smoothstep\(0\.06, 0\.22, uParticleAmbient\)/);
  assert.match(result.source, /particleEmberRadius = min\(0\.68, max\(0\.56, uParticleCoreRadius \* 0\.4\)\)/);
  assert.match(result.source, /particleEmberCenter = vec3/);
  assert.match(result.source, /particleEmberField/);
  assert.match(result.source, /particleEmberDiffuse/);
  assert.match(result.source, /particleEmberFog/);
  assert.match(result.source, /exp\(-pow\(particleEmberDistance \/ particleEmberRadius/);
  assert.match(result.source, /particleEmberFog \* particleBlackout/);
  assert.match(result.source, /particleLocalPos - particleEmberCenter/);
  assert.match(result.source, /particleEmberField \* particleBlackout/);
  assert.match(result.source, /vec3\(1\.0, 0\.24, 0\.025\)/);
});

test('default particle state uses a hard core boundary and nothing outside it', () => {
  const source = `#version 300 es
uniform highp usampler2D u_texture;
void main () {
  uint index = 0u;
  uvec4 cen = uvec4(0u);
  vec4 cam = viewTransform * vec4(uintBitsToFloat(cen.xyz), 1);
  vec4 pos2d = projection * cam;
  vec4 color = vec4(1.0);
  vColor = colorTransform * color;
}`;
  const result = augmentGaussianVertexShader(source);

  assert.match(result.source, /uParticleCoreRadius/);
  assert.match(result.source, /particleCoreVisible/);
  assert.match(result.source, /particleScanReveal/);
  assert.match(result.source, /particleOuterVisible/);
  assert.match(result.source, /particleHiddenErode/);
  assert.match(result.source, /1\.0 - step\(uParticleCoreRadius, particleCoreDistance\)/);
  assert.match(result.source, /particleWorldVisible/);
  assert.match(result.source, /particleRevealMode/);
  assert.match(result.source, /particleOuterVisible = mix\(particleRevealOuter, particleErodeOuter, particleRevealMode\)/);
  assert.match(result.source, /particleHiddenErode = \(1\.0 - particleCoreVisible\) \* \(1\.0 - particleOuterVisible\)/);
  assert.doesNotMatch(result.source, /particleFullErode|particlePointer|particleBurst/);
});

test('particle controller does not depend on uniforms optimized out of the shader', () => {
  const source = `#version 300 es
uniform highp usampler2D u_texture;
void main () {
  uint index = 0u;
  uvec4 cen = uvec4(0u);
  vec4 cam = viewTransform * vec4(uintBitsToFloat(cen.xyz), 1);
  vec4 pos2d = projection * cam;
  vec4 color = vec4(1.0);
  vColor = colorTransform * color;
}`;
  const augmented = augmentGaussianVertexShader(source);
  const requested = [];
  const gl = {
    getUniformLocation(_program, name) {
      requested.push(name);
      return name === 'uParticleTime' ? null : name;
    },
    useProgram() {},
    uniform3fv() {},
    uniform1f() {},
  };

  const controller = createGaussianParticleUniformController(
    { gl, renderProgram: { program: 'render-program' } },
    { min: [-1, -1, -1], max: [1, 1, 1] },
  );

  assert.match(augmented.source, /uParticleFlowTime/);
  assert.ok(requested.includes('uParticleFlowTime'));
  assert.equal(controller.active, true);
});

test('shader augmentation leaves unrelated shaders untouched', () => {
  const source = '#version 300 es\nvoid main(){ gl_Position = vec4(0.0); }';
  assert.deepEqual(augmentGaussianVertexShader(source), { source, patched: false });
});

test('temporary shader hook augments only matching sources and restores the prototype', () => {
  const calls = [];
  class FakeWebGL2Context {
    shaderSource(shader, source) {
      calls.push({ shader, source });
    }
  }
  const original = FakeWebGL2Context.prototype.shaderSource;
  const hook = installGaussianParticleShaderPatch(FakeWebGL2Context);
  const gl = new FakeWebGL2Context();
  const source = `#version 300 es
uniform highp usampler2D u_texture;
void main () {
  uint index = 0u;
  uvec4 cen = uvec4(0u);
  vec4 cam = viewTransform * vec4(uintBitsToFloat(cen.xyz), 1);
  vec4 pos2d = projection * cam;
  vec4 color = vec4(1.0);
  vColor = colorTransform * color;
}`;

  gl.shaderSource('vertex', source);
  assert.equal(hook.wasApplied(), true);
  assert.match(calls[0].source, /uParticleScanCenter/);
  hook.restore();
  assert.equal(FakeWebGL2Context.prototype.shaderSource, original);

  gl.shaderSource('plain', source);
  assert.equal(calls[1].source, source);
});

test('uniform controller writes bounded particle values to the active program', () => {
  const calls = [];
  const gl = {
    getUniformLocation(_program, name) { return name; },
    useProgram(program) { calls.push(['useProgram', program]); },
    uniform3fv(location, value) { calls.push(['uniform3fv', location, [...value]]); },
    uniform2fv(location, value) { calls.push(['uniform2fv', location, [...value]]); },
    uniform1f(location, value) { calls.push(['uniform1f', location, value]); },
  };
  const renderer = { gl, renderProgram: { program: 'render-program' } };
  const controller = createGaussianParticleUniformController(renderer, {
    min: [-2, -3, -4],
    max: [5, 6, 7],
  });

  assert.equal(controller.active, true);
  controller.update({
    scanAxis: [0, 1, 0],
    scanCenter: 9,
    scanWidth: 0.01,
    scanStrength: 4,
    scanShape: 3,
    scanOrigin: [-3, 0.25, 5],
    scanExtent: [0.01, 0.4, 2],
    coreRadius: 30,
    worldReveal: 3,
    transitionActivity: 4,
    transitionDirection: -4,
    transitionOpacity: 4,
    flowTime: 12.5,
    lightCenter: [3, -2, 0.25],
    lightRadius: 5,
    lightIntensity: 4,
    ambient: -2,
    tintA: [2, -1, 0.5],
    tintB: [0.1, 0.4, 3],
    chromatic: 4,
    energyPulse: -2,
    pulse: 3,
    nearDistance: 2.4,
    nearStrength: 2,
    displacement: 0.15,
  });

  assert.deepEqual(calls[0], ['useProgram', 'render-program']);
  assert.ok(calls.some((call) => call[1] === 'uParticleBoundsMin' && call[2].join(',') === '-2,-3,-4'));
  assert.ok(calls.some((call) => call[1] === 'uParticleScanCenter' && call[2] === 1.5));
  assert.ok(calls.some((call) => call[1] === 'uParticleScanWidth' && call[2] === 0.12));
  assert.ok(calls.some((call) => call[1] === 'uParticleScanStrength' && call[2] === 1));
  assert.ok(calls.some((call) => call[1] === 'uParticleScanShape' && call[2] === 2));
  assert.ok(calls.some((call) => call[1] === 'uParticleScanOrigin' && call[2].join(',') === '-1,0.25,1'));
  assert.ok(calls.some((call) => call[1] === 'uParticleScanExtent' && call[2].join(',') === '0.07999999821186066,0.4000000059604645,1'));
  assert.ok(calls.some((call) => call[1] === 'uParticleCoreRadius' && call[2] === 12));
  assert.ok(calls.some((call) => call[1] === 'uParticleWorldReveal' && call[2] === 1));
  assert.ok(calls.some((call) => call[1] === 'uParticleTransitionActivity' && call[2] === 1));
  assert.ok(calls.some((call) => call[1] === 'uParticleTransitionDirection' && call[2] === -1));
  assert.ok(calls.some((call) => call[1] === 'uParticleTransitionOpacity' && call[2] === 1));
  assert.ok(calls.some((call) => call[1] === 'uParticleFlowTime' && call[2] === 12.5));
  assert.ok(calls.some((call) => call[1] === 'uParticleLightCenter' && call[2].join(',') === '1,-1,0.25'));
  assert.ok(calls.some((call) => call[1] === 'uParticleLightRadius' && call[2] === 1.4));
  assert.ok(calls.some((call) => call[1] === 'uParticleLightIntensity' && call[2] === 1.8));
  assert.ok(calls.some((call) => call[1] === 'uParticleAmbient' && call[2] === 0.06));
  assert.ok(calls.some((call) => call[1] === 'uParticleTintA' && call[2].join(',') === '1,0,0.5'));
  assert.ok(calls.some((call) => call[1] === 'uParticleTintB' && call[2].join(',') === '0.10000000149011612,0.4000000059604645,1'));
  assert.ok(calls.some((call) => call[1] === 'uParticleChromatic' && call[2] === 1));
  assert.ok(calls.some((call) => call[1] === 'uParticleEnergyPulse' && call[2] === 0));
  assert.ok(calls.some((call) => call[1] === 'uParticlePulse' && call[2] === 0.12));
  assert.ok(calls.some((call) => call[1] === 'uParticleNearStrength' && call[2] === 1));
});
