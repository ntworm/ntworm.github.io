export function shouldDelayHeavyMedia({ saveData, deviceMemory } = {}) {
  return saveData === true || (Number.isFinite(deviceMemory) && deviceMemory <= 2);
}
