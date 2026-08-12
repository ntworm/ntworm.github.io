export const HYDRA_PIXEL_BUDGET = 1280 * 720;

export function calculateHydraRenderSize({
  width,
  height,
  pixelBudget = HYDRA_PIXEL_BUDGET,
} = {}) {
  if (!(width > 0) || !(height > 0) || !(pixelBudget > 0)) {
    return { width: 640, height: 360 };
  }

  const aspect = width / height;
  const renderWidth = Math.max(1, Math.floor(Math.sqrt(pixelBudget * aspect)));
  const renderHeight = Math.max(1, Math.floor(renderWidth / aspect));

  return { width: renderWidth, height: renderHeight };
}
