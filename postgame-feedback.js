(function universalModuleDefinition(root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.FooterPostgame = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function createPostgameFeedbackRules() {
  const INTENSITY_SCALE = Object.freeze({
    key: "gameIntensity",
    question: "Intensidade do jogo: Velhinhos ou Champions?",
    anchors: Object.freeze({
      1: "Velhinhos",
      5: "Bom ritmo",
      10: "Champions",
    }),
  });

  const ENERGY_SCALE = Object.freeze({
    key: "remainingEnergy",
    question: "Morreste ou jogavas mais meia hora?",
    anchors: Object.freeze({
      1: "Morri",
      5: "Ainda dava uns minutos",
      10: "Mais meia hora facil",
    }),
  });

  const POSTGAME_SCALES = Object.freeze({
    intensity: INTENSITY_SCALE,
    energy: ENERGY_SCALE,
  });

  function isScaleValue(value) {
    return Number.isInteger(value) && value >= 1 && value <= 10;
  }

  function isCheckinRequired({
    hasVote = false,
    hasFeedback = false,
    isTransitionGame = false,
    isAfterRollout = false,
    isBeforeRollout = false,
  } = {}) {
    if (hasFeedback || isBeforeRollout) return false;
    if (isTransitionGame) return !hasVote;
    return Boolean(isAfterRollout);
  }

  function compareDates(left, right) {
    const leftTime = Date.parse(left.date);
    const rightTime = Date.parse(right.date);
    if (Number.isFinite(leftTime) && Number.isFinite(rightTime) && leftTime !== rightTime) {
      return leftTime - rightTime;
    }

    const leftDate = String(left.date ?? "");
    const rightDate = String(right.date ?? "");
    if (leftDate < rightDate) return -1;
    if (leftDate > rightDate) return 1;
    return 0;
  }

  function sortPendingCheckins(checkins) {
    return [...checkins].sort((left, right) => {
      const dateOrder = compareDates(left, right);
      if (dateOrder !== 0) return dateOrder;

      const leftId = String(left.id ?? "");
      const rightId = String(right.id ?? "");
      if (leftId < rightId) return -1;
      if (leftId > rightId) return 1;
      return 0;
    });
  }

  return Object.freeze({
    INTENSITY_SCALE,
    ENERGY_SCALE,
    POSTGAME_SCALES,
    isScaleValue,
    isCheckinRequired,
    sortPendingCheckins,
  });
});
