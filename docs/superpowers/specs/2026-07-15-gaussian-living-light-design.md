# Gaussian Living Light — Design

## Goal

Turn both Gaussian scenes into living volumetric images while preserving the approved reconstruction motion. Fix the second (car) scene so reconstruction reads as particle erosion instead of a screen-space shift.

## Layers

1. **Geometry:** existing core/world reconstruction, scan regions, pings, and blocks. The people scene keeps its approved displacement. The car uses less physical displacement and stronger alpha erosion to compensate for its larger camera zoom.
2. **Procedural light:** a slow seeded autopilot moves an object-space light through the splat. Episodes can dim the ambient world heavily while retaining a concentrated illuminated nucleus, increase exposure, or send a soft energy pulse through the volume.
3. **Chromatic energy:** interpolated palettes (natural, red/blue, violet, amber) tint only lit regions and transition fronts. Chromatic separation remains an accent rather than shifting the whole image abruptly.

## Motion language

- Light states transition continuously over several seconds; no hard palette cuts.
- High-contrast blackout states are occasional, not permanent.
- During blackout, the scene never reaches featureless black: an intense warm ember remains near the origin, with a bright compact nucleus, an exponential diffuse falloff, and a broader noise-modulated splat fog that reveals the light volume while drifting only a few centimeters.
- Each Gaussian has its own deterministic seed so they do not synchronize.
- Fast glitches remain brief accents; the dominant motion is slow, spatial, and volumetric.
- `prefers-reduced-motion` keeps the scene legible with a restrained natural state.

## Implementation boundaries

- A pure `createGaussianLightAutopilot(seed)` produces bounded lighting values and is independently testable.
- Scene-specific particle profiles separate zoom compensation from artistic color.
- Shader uniforms apply object-space spherical lighting and transition-front color without changing camera transforms.
- Existing camera, core radius, click toggle, and first-scene reconstruction remain unchanged.

## Verification

- Unit tests cover seeded repeatability, smooth/bounded lighting, car displacement compensation, shader uniforms, and component integration.
- Full site test suite must pass.
- Visual acceptance remains manual through the running development server.
