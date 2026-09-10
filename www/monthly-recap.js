(function exposeMonthlyRecap(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.FooterMonthly = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createMonthlyRecapApi() {
  function activeMinutesForSquad(squadSize) {
    const size = Number(squadSize);
    if (!Number.isFinite(size) || size <= 0) return 50;
    return size <= 5 ? 50 : 50 * 5 / size;
  }

  function metForIntensity(score) {
    const value = Number(score);
    if (!Number.isFinite(value) || value < 1 || value > 10) return 7;
    return 5 + ((value - 1) / 9) * 5;
  }

  function estimateCalories({ weightKg = 75, minutes = 0, met = 7 } = {}) {
    const weight = Number(weightKg);
    const duration = Number(minutes);
    const effort = Number(met);
    if (![weight, duration, effort].every(Number.isFinite) || weight <= 0 || duration <= 0 || effort <= 0) return 0;
    return Math.round(effort * weight * duration / 60);
  }

  function average(values) {
    const valid = (values || []).map(Number).filter(Number.isFinite);
    return valid.length ? valid.reduce((sum, value) => sum + value, 0) / valid.length : null;
  }

  return { activeMinutesForSquad, metForIntensity, estimateCalories, average };
});
