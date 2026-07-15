const AXES = Object.freeze([
  Object.freeze([1, 0, 0]),
  Object.freeze([0, 1, 0]),
  Object.freeze([0, 0, 1]),
  Object.freeze([0.7071, 0.7071, 0]),
  Object.freeze([-0.5774, 0.5774, 0.5774]),
  Object.freeze([0.4082, -0.4082, 0.8165]),
]);

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const ease = (value) => value * value * (3 - 2 * value);

function createRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function gaussianParticleProfile(placement = 'hero-right') {
  return placement === 'section-left'
    ? { displacement: 0.075, transitionOpacity: 0.68 }
    : { displacement: 0.13, transitionOpacity: 0.32 };
}

const LIGHT_PALETTES = Object.freeze([
  Object.freeze({ name: 'natural', tintA: [1, 0.96, 0.88], tintB: [0.72, 0.9, 1] }),
  Object.freeze({ name: 'red-blue', tintA: [1, 0.08, 0.025], tintB: [0.025, 0.16, 1] }),
  Object.freeze({ name: 'violet', tintA: [0.5, 0.025, 1], tintB: [1, 0.08, 0.58] }),
  Object.freeze({ name: 'amber', tintA: [1, 0.27, 0.015], tintB: [1, 0.82, 0.1] }),
  Object.freeze({ name: 'acid', tintA: [0.12, 1, 0.34], tintB: [0.78, 0.025, 1] }),
]);

const mixValue = (from, to, amount) => from + (to - from) * amount;
const mixVector = (from, to, amount) => from.map((value, index) => mixValue(value, to[index], amount));

/**
 * Slow, seeded volumetric lighting episodes. Visual parameters interpolate
 * for the full episode, so even extreme palettes arrive as light rather than
 * as a hard color correction.
 */
export function createGaussianLightAutopilot(seed = 1) {
  const random = createRandom(seed);
  let time = 0;
  let elapsed = 0;
  let duration = 8;
  let paletteIndex = 0;
  let from = {
    lightCenter: [0, 0, 0], lightRadius: 1.05, lightIntensity: 0.28,
    ambient: 0.92, tintA: [...LIGHT_PALETTES[0].tintA], tintB: [...LIGHT_PALETTES[0].tintB],
    chromatic: 0.08, pulseAmount: 0.16,
  };
  let current = { ...from, lightCenter: [...from.lightCenter], tintA: [...from.tintA], tintB: [...from.tintB] };
  let target = current;

  const chooseTarget = () => {
    duration = 6 + random() * 10;
    paletteIndex = (paletteIndex + 1 + Math.floor(random() * (LIGHT_PALETTES.length - 1))) % LIGHT_PALETTES.length;
    const palette = LIGHT_PALETTES[paletteIndex];
    const profile = random();
    let ambient;
    let lightRadius;
    let lightIntensity;
    let chromatic;
    if (profile < 0.3) {
      ambient = 0.06 + random() * 0.1;
      lightRadius = 0.16 + random() * 0.2;
      lightIntensity = 1.2 + random() * 0.6;
      chromatic = 0.58 + random() * 0.42;
    } else if (profile < 0.72) {
      ambient = 0.3 + random() * 0.34;
      lightRadius = 0.38 + random() * 0.46;
      lightIntensity = 0.72 + random() * 0.68;
      chromatic = 0.5 + random() * 0.48;
    } else {
      ambient = 0.68 + random() * 0.3;
      lightRadius = 0.72 + random() * 0.58;
      lightIntensity = 0.16 + random() * 0.62;
      chromatic = 0.08 + random() * 0.42;
    }
    target = {
      lightCenter: [-0.48 + random() * 0.96, -0.42 + random() * 0.84, -0.38 + random() * 0.76],
      lightRadius,
      lightIntensity,
      ambient,
      tintA: [...palette.tintA],
      tintB: [...palette.tintB],
      chromatic,
      pulseAmount: 0.14 + random() * 0.72,
    };
  };

  chooseTarget();

  return {
    sample(deltaSeconds = 0) {
      const delta = clamp(Number.isFinite(deltaSeconds) ? deltaSeconds : 0, 0, 0.25);
      time += delta;
      elapsed += delta;
      const progress = ease(clamp(elapsed / duration, 0, 1));
      current = {
        lightCenter: mixVector(from.lightCenter, target.lightCenter, progress),
        lightRadius: mixValue(from.lightRadius, target.lightRadius, progress),
        lightIntensity: mixValue(from.lightIntensity, target.lightIntensity, progress),
        ambient: mixValue(from.ambient, target.ambient, progress),
        tintA: mixVector(from.tintA, target.tintA, progress),
        tintB: mixVector(from.tintB, target.tintB, progress),
        chromatic: mixValue(from.chromatic, target.chromatic, progress),
        pulseAmount: mixValue(from.pulseAmount, target.pulseAmount, progress),
      };

      if (elapsed >= duration) {
        from = { ...current, lightCenter: [...current.lightCenter], tintA: [...current.tintA], tintB: [...current.tintB] };
        elapsed = 0;
        chooseTarget();
      }

      const wave = 0.5 + 0.5 * Math.sin(time * 0.46 + seed * 0.013)
        * Math.sin(time * 0.19 + seed * 0.007);
      return {
        ...current,
        lightCenter: [...current.lightCenter],
        tintA: [...current.tintA],
        tintB: [...current.tintB],
        energyPulse: clamp(wave * current.pulseAmount, 0, 1),
        palette: LIGHT_PALETTES[paletteIndex].name,
      };
    },
  };
}

/**
 * Slow, seeded scan gestures. Every instance owns its own clock and random
 * stream, so the two scenes never repeat the same event at the same moment.
 */
export function createGaussianParticleAutopilot(seed = 1) {
  const random = createRandom(seed);
  let time = 0;
  let elapsed = 0;
  let mode = 'idle';
  let duration = 2 + random() * 4;
  let axis = AXES[Math.floor(random() * AXES.length)];
  let width = 0.28 + random() * 0.2;
  let direction = random() < 0.5 ? -1 : 1;
  let shape = 0;
  let origin = [0, 0, 0];
  let extent = [0.42, 0.42, 0.42];
  let volumePattern = Math.floor(random() * 3);
  let pingDirection = random() < 0.5 ? -1 : 1;
  const pulsePhase = random() * Math.PI * 2;

  const beginPass = () => {
    mode = 'active';
    elapsed = 0;
    const profile = random();
    if (profile < 0.58) {
      shape = 1;
      duration = 9 + random() * 6;
      width = 0.24 + random() * 0.2;
      const depth = 0.24 + random() * 0.14;
      if (volumePattern === 0) extent = [0.42 + random() * 0.16, 0.16 + random() * 0.08, depth];
      else if (volumePattern === 1) extent = [0.16 + random() * 0.08, 0.42 + random() * 0.16, depth];
      else extent = [0.26 + random() * 0.14, 0.26 + random() * 0.14, 0.28 + random() * 0.14];
      volumePattern = (volumePattern + 1) % 3;
      origin = [
        -0.48 + random() * 0.96,
        -0.48 + random() * 0.96,
        -0.38 + random() * 0.76,
      ];
    } else if (profile < 0.8) {
      shape = 2;
      duration = 12 + random() * 6;
      width = 0.18 + random() * 0.14;
      extent = [1, 1, 1];
      origin = [
        -0.12 + random() * 0.24,
        -0.12 + random() * 0.24,
        -0.1 + random() * 0.2,
      ];
      direction = pingDirection;
      pingDirection *= -1;
    } else {
      shape = 0;
      duration = 20 + random() * 14;
      width = 0.55 + random() * 0.23;
      extent = [0.5, 0.5, 0.5];
      origin = [0, 0, 0];
    }
    axis = AXES[Math.floor(random() * AXES.length)];
    direction = random() < 0.5 ? -1 : 1;
  };

  const beginRest = () => {
    mode = 'idle';
    elapsed = 0;
    duration = 2 + random() * 4;
  };

  return {
    sample(deltaSeconds = 0) {
      const delta = clamp(Number.isFinite(deltaSeconds) ? deltaSeconds : 0, 0, 0.25);
      time += delta;
      elapsed += delta;

      if (elapsed >= duration) {
        if (mode === 'idle') beginPass();
        else beginRest();
      }

      let scanStrength = 0;
      let scanCenter = direction < 0 ? 1.35 : -1.35;
      let scanOrigin = [...origin];
      if (mode === 'active') {
        const progress = clamp(elapsed / duration, 0, 1);
        if (progress < 0.22) scanStrength = ease(progress / 0.22);
        else if (progress < 0.62) scanStrength = 1;
        else scanStrength = 1 - ease((progress - 0.62) / 0.38);
        const travel = ease(progress);
        if (shape === 2) {
          const pingRadius = 0.08 + travel * 1.6;
          scanCenter = direction > 0 ? pingRadius : 1.68 - pingRadius;
        } else {
          scanCenter = direction * (-1.35 + travel * 2.7);
        }
        if (shape === 1) {
          const drift = direction * (travel - 0.5) * 0.58;
          scanOrigin = origin.map((value, index) => clamp(value + axis[index] * drift, -1, 1));
        }
      }

      const pulse = Math.sin(time * 0.43 + pulsePhase) * 0.075
        + Math.sin(time * 0.17 + pulsePhase * 0.37) * 0.03;

      return {
        scanAxis: [...axis],
        scanCenter,
        scanWidth: width,
        scanStrength,
        scanDuration: mode === 'active' ? duration : 0,
        scanShape: shape,
        scanDirection: direction,
        scanOrigin,
        scanExtent: [...extent],
        pulse,
      };
    },
  };
}

/**
 * Stateful, reversible world reconstruction. Velocity is damped toward the
 * requested direction so a rapid second click turns the front around instead
 * of jumping to a new mask.
 */
export function createGaussianWorldTransition({
  initialProgress = 0,
  expandSeconds = 3.6,
  collapseSeconds = 3.2,
  response = 6,
} = {}) {
  let progress = clamp(initialProgress, 0, 1);
  let velocity = 0;
  let time = 0;
  // Base travel runs slightly faster to leave time for acceleration and the
  // deliberately long braking tail inside the requested total duration.
  const expandRate = 1.22 / Math.max(0.5, expandSeconds);
  const collapseRate = 1.22 / Math.max(0.5, collapseSeconds);

  return {
    sample(target = 0, deltaSeconds = 0) {
      const delta = clamp(Number.isFinite(deltaSeconds) ? deltaSeconds : 0, 0, 0.25);
      const destination = target >= 0.5 ? 1 : 0;
      time += delta;

      const distance = destination - progress;
      const brakingEnvelope = ease(clamp(Math.abs(distance) / 0.14, 0, 1));
      const targetVelocity = Math.abs(distance) < 0.0001
        ? 0
        : (destination > progress ? expandRate : -collapseRate) * brakingEnvelope;
      const blend = 1 - Math.exp(-Math.max(0.1, response) * delta);
      velocity += (targetVelocity - velocity) * blend;

      const next = progress + velocity * delta;
      const reached = (destination === 1 && next >= 1) || (destination === 0 && next <= 0);
      if (reached || (Math.abs(distance) < 0.003 && Math.abs(velocity) < 0.004)) {
        progress = destination;
        velocity = 0;
      } else {
        progress = clamp(next, 0, 1);
      }

      const activity = clamp(
        Math.abs(velocity) * Math.max(expandSeconds, collapseSeconds) * 1.08,
        0,
        1,
      );

      return {
        progress,
        activity,
        direction: Math.abs(velocity) < 0.0001 ? 0 : Math.sign(velocity),
        time,
      };
    },
  };
}

export function calculateParticleBounds(positions) {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  const length = Math.floor((positions?.length ?? 0) / 3) * 3;

  for (let index = 0; index < length; index += 3) {
    for (let axis = 0; axis < 3; axis += 1) {
      const value = positions[index + axis];
      if (!Number.isFinite(value)) continue;
      min[axis] = Math.min(min[axis], value);
      max[axis] = Math.max(max[axis], value);
    }
  }

  for (let axis = 0; axis < 3; axis += 1) {
    if (!Number.isFinite(min[axis]) || !Number.isFinite(max[axis])) {
      min[axis] = -1;
      max[axis] = 1;
    } else if (max[axis] - min[axis] < 0.001) {
      min[axis] -= 0.5;
      max[axis] += 0.5;
    }
  }

  return { min, max };
}

const PARTICLE_MARKER = '// gs-particle-effects-v1';

export function augmentGaussianVertexShader(source) {
  if (typeof source !== 'string' || source.includes(PARTICLE_MARKER)) {
    return { source, patched: false };
  }

  const mainMarker = /void\s+main\s*\(\s*\)\s*\{/;
  const cameraMarker = /vec4\s+cam\s*=\s*viewTransform\s*\*\s*vec4\(uintBitsToFloat\(cen\.xyz\),\s*1\)\s*;\s*vec4\s+pos2d\s*=\s*projection\s*\*\s*cam\s*;/;
  const colorMarker = /vColor\s*=\s*colorTransform\s*\*\s*color\s*;/;

  if (!mainMarker.test(source) || !cameraMarker.test(source) || !colorMarker.test(source)) {
    return { source, patched: false };
  }

  const declarations = `${PARTICLE_MARKER}
uniform vec3 uParticleBoundsMin;
uniform vec3 uParticleBoundsMax;
uniform vec3 uParticleScanAxis;
uniform float uParticleScanCenter;
uniform float uParticleScanWidth;
uniform float uParticleScanStrength;
uniform float uParticleScanShape;
uniform vec3 uParticleScanOrigin;
uniform vec3 uParticleScanExtent;
uniform float uParticleCoreRadius;
uniform float uParticleWorldReveal;
uniform float uParticleTransitionActivity;
uniform float uParticleTransitionDirection;
uniform float uParticleTransitionOpacity;
uniform float uParticleFlowTime;
uniform float uParticleNearDistance;
uniform float uParticleNearStrength;
uniform float uParticleDisplacement;
uniform float uParticlePulse;
uniform vec3 uParticleLightCenter;
uniform float uParticleLightRadius;
uniform float uParticleLightIntensity;
uniform float uParticleAmbient;
uniform vec3 uParticleTintA;
uniform vec3 uParticleTintB;
uniform float uParticleChromatic;
uniform float uParticleEnergyPulse;

float particleHash(float value) {
  return fract(sin(value * 12.9898 + 78.233) * 43758.5453);
}

`;

  let next = source.replace(mainMarker, `${declarations}void main () {`);
  next = next.replace(cameraMarker, `vec3 particleLocalPos = uintBitsToFloat(cen.xyz);
  vec4 cam = viewTransform * vec4(particleLocalPos, 1);
  vec3 particleSpan = max(uParticleBoundsMax - uParticleBoundsMin, vec3(0.0001));
  vec3 particleNormalized = ((particleLocalPos - uParticleBoundsMin) / particleSpan) * 2.0 - 1.0;
  float particleSeed = particleHash(float(index) + 19.17);
  float particleCoordinate = dot(particleNormalized, normalize(uParticleScanAxis));
  float particleBand = 1.0 - smoothstep(uParticleScanWidth * 0.28, uParticleScanWidth, abs(particleCoordinate - uParticleScanCenter));
  vec3 particleVolumeDelta = (particleNormalized - uParticleScanOrigin) / max(uParticleScanExtent, vec3(0.08));
  float particleVolumeWarp = (particleSeed - 0.5) * 0.08 + sin(dot(particleNormalized, vec3(8.3, 5.7, 6.9))) * 0.025;
  vec3 particleBlockAxes = abs(particleVolumeDelta);
  float particleBlockDistance = max(particleBlockAxes.x, max(particleBlockAxes.y, particleBlockAxes.z));
  float particleVolume = 1.0 - smoothstep(0.78, 1.02, particleBlockDistance + particleVolumeWarp);
  float particlePingDistance = length(particleNormalized - uParticleScanOrigin);
  float particlePing = 1.0 - smoothstep(
    uParticleScanWidth * 0.3,
    uParticleScanWidth,
    abs(particlePingDistance - uParticleScanCenter)
  );
  float particleUseBlock = 1.0 - step(0.5, abs(uParticleScanShape - 1.0));
  float particleUsePing = 1.0 - step(0.5, abs(uParticleScanShape - 2.0));
  float particleScanField = mix(particleBand, particleVolume, particleUseBlock);
  particleScanField = mix(particleScanField, particlePing, particleUsePing);
  float particleBlockGain = 1.0 + particleUseBlock * 0.18 + particleUsePing * 0.08;
  float particleScanEnergy = particleScanField * uParticleScanStrength * particleBlockGain;
  float particleScanReveal = smoothstep(particleSeed * 0.68, min(1.0, particleSeed * 0.68 + 0.28), particleScanEnergy);
  float particleCameraDistance = length(cam.xyz);
  float particleNearField = 1.0 - smoothstep(uParticleNearDistance * 0.58, uParticleNearDistance, particleCameraDistance);
  float particleNearErode = smoothstep(particleSeed * 0.78, min(1.0, particleSeed * 0.78 + 0.2), particleNearField * uParticleNearStrength);
  float particleCoreDistance = length(particleLocalPos);
  float particleCoreVisible = 1.0 - step(uParticleCoreRadius, particleCoreDistance);
  float particleBoundsRadius = max(length(uParticleBoundsMin), length(uParticleBoundsMax));
  float particleOuterDistance = clamp(
    (particleCoreDistance - uParticleCoreRadius) / max(0.001, particleBoundsRadius - uParticleCoreRadius),
    0.0,
    1.0
  );
  float particleFlowA = sin(dot(particleNormalized, vec3(3.1, 4.7, 2.9)) + uParticleFlowTime * 0.19);
  float particleFlowB = sin(dot(particleNormalized.yzx, vec3(5.3, 2.7, 4.1)) - uParticleFlowTime * 0.13);
  float particleFlowC = sin(dot(particleNormalized.zxy, vec3(2.3, 6.1, 3.7)) + uParticleFlowTime * 0.08);
  float particleFlowNoise = (particleFlowA + particleFlowB + particleFlowC) / 6.0 + 0.5;
  float particleWorldThreshold = clamp(
    particleOuterDistance + (particleFlowNoise - 0.5) * 0.22 + (particleSeed - 0.5) * 0.075,
    0.0,
    1.0
  );
  float particleWorldProgress = uParticleWorldReveal * uParticleWorldReveal * (3.0 - 2.0 * uParticleWorldReveal);
  float particleWorldCoverage = smoothstep(
    particleWorldThreshold - 0.085,
    particleWorldThreshold + 0.085,
    particleWorldProgress
  );
  float particleWorldVisible = smoothstep(
    particleSeed * 0.34,
    min(1.0, particleSeed * 0.34 + 0.22),
    particleWorldCoverage
  );
  float particleEndpointScatter = smoothstep(particleSeed * 0.045, min(0.075, particleSeed * 0.045 + 0.02), uParticleWorldReveal);
  particleWorldVisible *= particleEndpointScatter;
  particleWorldVisible = mix(particleWorldVisible, 1.0, step(0.999, uParticleWorldReveal));
  float particleWorldFront = 1.0 - smoothstep(
    0.025,
    0.155,
    abs(particleWorldThreshold - particleWorldProgress)
  );
  float particleOpening = step(0.001, uParticleTransitionDirection);
  float particleWorldDustMask = max(1.0 - particleCoreVisible, particleCoreVisible * particleOpening);
  float particleWorldDust = particleWorldDustMask * particleWorldFront * uParticleTransitionActivity;
  float particleLightDistance = length(particleNormalized - uParticleLightCenter);
  float particleLightField = 1.0 - smoothstep(
    uParticleLightRadius * 0.24,
    uParticleLightRadius,
    particleLightDistance
  );
  float particleEnergyRadius = 0.12 + uParticleEnergyPulse * 1.26;
  float particleEnergyShell = 1.0 - smoothstep(
    0.055,
    0.18,
    abs(particleLightDistance - particleEnergyRadius)
  );
  float particleBlackout = 1.0 - smoothstep(0.06, 0.22, uParticleAmbient);
  float particleEmberRadius = min(0.68, max(0.56, uParticleCoreRadius * 0.4));
  vec3 particleEmberCenter = vec3(
    sin(uParticleFlowTime * 0.31) * 0.075,
    cos(uParticleFlowTime * 0.23 + 0.8) * 0.055,
    sin(uParticleFlowTime * 0.19 + 1.7) * 0.065
  );
  float particleEmberDistance = length(particleLocalPos - particleEmberCenter);
  float particleEmberCore = 1.0 - smoothstep(
    particleEmberRadius * 0.08,
    particleEmberRadius * 0.38,
    particleEmberDistance
  );
  float particleEmberDiffuse = exp(-pow(particleEmberDistance / particleEmberRadius, 1.35) * 1.55);
  float particleEmberField = max(particleEmberCore, particleEmberDiffuse);
  float particleEmberFogRadius = particleEmberRadius * 2.6;
  float particleEmberFogEnvelope = exp(-pow(
    particleEmberDistance / particleEmberFogRadius,
    1.7
  ) * 2.2);
  float particleEmberFogNoise = clamp(
    0.3 + particleFlowNoise * 0.72 + (particleSeed - 0.5) * 0.18,
    0.0,
    1.0
  );
  float particleEmberFog = particleEmberFogEnvelope * particleEmberFogNoise;
  float particleEmberFlicker = 0.82
    + sin(uParticleFlowTime * 2.7) * 0.1
    + sin(uParticleFlowTime * 5.3 + 1.1) * 0.08;
  float particleRevealOuter = max(particleWorldVisible, particleScanReveal);
  float particleErodeOuter = min(particleWorldVisible, 1.0 - particleScanReveal);
  float particleRevealMode = smoothstep(0.72, 0.96, uParticleWorldReveal);
  float particleOuterVisible = mix(particleRevealOuter, particleErodeOuter, particleRevealMode);
  float particleHiddenErode = (1.0 - particleCoreVisible) * (1.0 - particleOuterVisible);
  float particleOuterNearErode = (1.0 - particleCoreVisible) * particleNearErode * (1.0 - uParticleWorldReveal);
  float particleErode = max(particleHiddenErode, particleOuterNearErode);
  float particleErodeEdge = smoothstep(0.08, 0.88, particleErode) * (1.0 - particleErode * 0.62);
  float particleDustEdge = max(particleErodeEdge, particleWorldDust * (0.5 + particleSeed * 0.5));
  vec3 particleDrift = normalize(vec3(
    particleHash(float(index) + 3.1) - 0.5,
    particleHash(float(index) + 7.7) - 0.5,
    (particleHash(float(index) + 11.9) - 0.5) * 0.3
  ) + vec3(0.0001));
  float particleTransitionSign = mix(-1.0, 1.0, step(0.0, uParticleTransitionDirection));
  float particleTransitionDrift = particleWorldDust * (1.15 + particleSeed * 1.35) * particleTransitionSign;
  cam.xyz += particleDrift * uParticleDisplacement * (
    particleErodeEdge * (0.4 + particleScanEnergy) + particleTransitionDrift
  );
  vec4 pos2d = projection * cam;`);
  next = next.replace(colorMarker, `vColor = colorTransform * color;
  vColor.a *= 1.0 - particleErode;
  vColor.a *= 1.0 - particleWorldDust * particleSeed * uParticleTransitionOpacity;
  float particleFringe = particleDustEdge * (0.35 + particleScanEnergy * 0.65);
  float particlePalettePhase = 0.5 + 0.5 * sin(
    dot(particleNormalized, vec3(2.7, 4.1, 3.3)) + uParticleFlowTime * 0.21
  );
  vec3 particlePalette = mix(uParticleTintA, uParticleTintB, particlePalettePhase);
  float particleLightEnergy = particleLightField * uParticleLightIntensity
    + particleEnergyShell * uParticleEnergyPulse * 0.72;
  float particlePaletteMask = clamp(
    particleLightField * 0.72 + particleWorldDust * 0.95 + particleScanEnergy * 0.42,
    0.0,
    1.0
  ) * uParticleChromatic;
  vec3 particleChannelNoise = vec3(
    particleHash(float(index) + 23.7),
    particleHash(float(index) + 41.3),
    particleHash(float(index) + 67.9)
  ) - 0.5;
  vec3 particleBaseColor = vColor.rgb;
  vColor.rgb *= max(0.025, uParticleAmbient + particleLightEnergy);
  float particleEmberLight = particleEmberField * particleBlackout * particleEmberFlicker * 3.35;
  vColor.rgb += particleBaseColor * vec3(1.0, 0.24, 0.025) * particleEmberLight;
  vColor.rgb += vec3(1.0, 0.24, 0.025) * particleEmberField * particleBlackout * 0.075;
  vColor.rgb += particleBaseColor * vec3(1.0, 0.17, 0.025)
    * particleEmberFog * particleBlackout * 0.58;
  vColor.rgb += vec3(1.0, 0.12, 0.015) * particleEmberFog * particleBlackout * 0.018;
  vColor.rgb = mix(vColor.rgb, vColor.rgb * particlePalette * 1.72, particlePaletteMask);
  vColor.rgb += particlePalette * particleEnergyShell * uParticleEnergyPulse * 0.2;
  vColor.rgb += particleChannelNoise * particleFringe * uParticleChromatic * 0.28;
  vColor.rgb *= 1.0 + uParticlePulse * 0.08 + particleFringe * 0.16 + particleWorldDust * 0.1;
  vColor.rgb += particleFringe * particlePalette * vec3(0.045, 0.025, 0.065);
  vColor.rgb += particleWorldDust * particlePalette * 0.032;`);

  return { source: next, patched: true };
}

/**
 * gsplat.js does not expose a shader hook, so renderer construction gets a
 * deliberately tiny, synchronous interception window. The original WebGL
 * prototype is restored immediately by the caller's finally block.
 */
export function installGaussianParticleShaderPatch(
  Context = globalThis.WebGL2RenderingContext,
) {
  if (!Context?.prototype?.shaderSource) {
    return { restore() {}, wasApplied: () => false };
  }

  const prototype = Context.prototype;
  const original = prototype.shaderSource;
  let applied = false;
  let restored = false;

  const hookedShaderSource = function particleShaderSource(shader, source) {
    const augmented = augmentGaussianVertexShader(source);
    if (augmented.patched) applied = true;
    return original.call(this, shader, augmented.source);
  };
  prototype.shaderSource = hookedShaderSource;

  return {
    restore() {
      if (restored) return;
      restored = true;
      if (prototype.shaderSource === hookedShaderSource) {
        prototype.shaderSource = original;
      }
    },
    wasApplied: () => applied,
  };
}

const PARTICLE_UNIFORMS = Object.freeze([
  'uParticleBoundsMin',
  'uParticleBoundsMax',
  'uParticleScanAxis',
  'uParticleScanCenter',
  'uParticleScanWidth',
  'uParticleScanStrength',
  'uParticleScanShape',
  'uParticleScanOrigin',
  'uParticleScanExtent',
  'uParticleCoreRadius',
  'uParticleWorldReveal',
  'uParticleTransitionActivity',
  'uParticleTransitionDirection',
  'uParticleTransitionOpacity',
  'uParticleFlowTime',
  'uParticleNearDistance',
  'uParticleNearStrength',
  'uParticleDisplacement',
  'uParticlePulse',
  'uParticleLightCenter',
  'uParticleLightRadius',
  'uParticleLightIntensity',
  'uParticleAmbient',
  'uParticleTintA',
  'uParticleTintB',
  'uParticleChromatic',
  'uParticleEnergyPulse',
]);

export function createGaussianParticleUniformController(renderer, bounds) {
  const gl = renderer?.gl;
  const program = renderer?.renderProgram?.program;
  if (!gl || !program) return { active: false, update() {} };

  const locations = Object.fromEntries(
    PARTICLE_UNIFORMS.map((name) => [name, gl.getUniformLocation(program, name)]),
  );
  const active = PARTICLE_UNIFORMS.every((name) => locations[name] !== null);
  if (!active) return { active: false, update() {} };

  const min = bounds?.min ?? [-1, -1, -1];
  const max = bounds?.max ?? [1, 1, 1];

  return {
    active: true,
    update(values = {}) {
      const axis = Array.isArray(values.scanAxis) ? values.scanAxis : [1, 0, 0];
      gl.useProgram(program);
      gl.uniform3fv(locations.uParticleBoundsMin, new Float32Array(min));
      gl.uniform3fv(locations.uParticleBoundsMax, new Float32Array(max));
      gl.uniform3fv(locations.uParticleScanAxis, new Float32Array(axis));
      gl.uniform1f(locations.uParticleScanCenter, clamp(values.scanCenter ?? -1.5, -1.5, 1.5));
      gl.uniform1f(locations.uParticleScanWidth, clamp(values.scanWidth ?? 0.28, 0.12, 0.8));
      gl.uniform1f(locations.uParticleScanStrength, clamp(values.scanStrength ?? 0, 0, 1));
      gl.uniform1f(locations.uParticleScanShape, clamp(values.scanShape ?? 0, 0, 2));
      gl.uniform3fv(
        locations.uParticleScanOrigin,
        new Float32Array((values.scanOrigin ?? [0, 0, 0]).map((value) => clamp(value, -1, 1))),
      );
      gl.uniform3fv(
        locations.uParticleScanExtent,
        new Float32Array((values.scanExtent ?? [0.5, 0.5, 0.5]).map((value) => clamp(value, 0.08, 1))),
      );
      gl.uniform1f(locations.uParticleCoreRadius, clamp(values.coreRadius ?? 1.5, 0.5, 12));
      gl.uniform1f(locations.uParticleWorldReveal, clamp(values.worldReveal ?? 0, 0, 1));
      gl.uniform1f(locations.uParticleTransitionActivity, clamp(values.transitionActivity ?? 0, 0, 1));
      gl.uniform1f(locations.uParticleTransitionDirection, clamp(values.transitionDirection ?? 0, -1, 1));
      gl.uniform1f(locations.uParticleTransitionOpacity, clamp(values.transitionOpacity ?? 0.32, 0, 1));
      gl.uniform1f(locations.uParticleFlowTime, Math.max(0, values.flowTime ?? 0));
      gl.uniform1f(locations.uParticleNearDistance, clamp(values.nearDistance ?? 1.2, 0.2, 5));
      gl.uniform1f(locations.uParticleNearStrength, clamp(values.nearStrength ?? 0.68, 0, 1));
      gl.uniform1f(locations.uParticleDisplacement, clamp(values.displacement ?? 0.12, 0, 0.4));
      gl.uniform1f(locations.uParticlePulse, clamp(values.pulse ?? 0, -0.12, 0.12));
      gl.uniform3fv(
        locations.uParticleLightCenter,
        new Float32Array((values.lightCenter ?? [0, 0, 0]).map((value) => clamp(value, -1, 1))),
      );
      gl.uniform1f(locations.uParticleLightRadius, clamp(values.lightRadius ?? 1, 0.16, 1.4));
      gl.uniform1f(locations.uParticleLightIntensity, clamp(values.lightIntensity ?? 0.25, 0, 1.8));
      gl.uniform1f(locations.uParticleAmbient, clamp(values.ambient ?? 0.92, 0.06, 1));
      gl.uniform3fv(
        locations.uParticleTintA,
        new Float32Array((values.tintA ?? [1, 1, 1]).map((value) => clamp(value, 0, 1))),
      );
      gl.uniform3fv(
        locations.uParticleTintB,
        new Float32Array((values.tintB ?? [1, 1, 1]).map((value) => clamp(value, 0, 1))),
      );
      gl.uniform1f(locations.uParticleChromatic, clamp(values.chromatic ?? 0, 0, 1));
      gl.uniform1f(locations.uParticleEnergyPulse, clamp(values.energyPulse ?? 0, 0, 1));
    },
  };
}
