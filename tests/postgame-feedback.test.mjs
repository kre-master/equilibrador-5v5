import assert from "node:assert/strict";
import test from "node:test";
import feedback from "../postgame-feedback.js";

const {
  ENERGY_SCALE,
  INTENSITY_SCALE,
  POSTGAME_SCALES,
  isCheckinRequired,
  isScaleValue,
  sortPendingCheckins,
} = feedback;

test("accepts only integer scale values from 1 through 10", () => {
  assert.equal(isScaleValue(1), true);
  assert.equal(isScaleValue(10), true);
  assert.equal(isScaleValue(0), false);
  assert.equal(isScaleValue(11), false);
  assert.equal(isScaleValue(4.5), false);
  assert.equal(isScaleValue("5"), false);
});

test("publishes the approved scale questions and anchors", () => {
  assert.equal(INTENSITY_SCALE.question, "Intensidade do jogo: Velhinhos ou Champions?");
  assert.deepEqual(INTENSITY_SCALE.anchors, {
    1: "Velhinhos",
    5: "Bom ritmo",
    10: "Champions",
  });
  assert.equal(ENERGY_SCALE.question, "Morreste ou jogavas mais meia hora?");
  assert.deepEqual(ENERGY_SCALE.anchors, {
    1: "Morri",
    5: "Ainda dava uns minutos",
    10: "Mais meia hora facil",
  });
  assert.equal(POSTGAME_SCALES.intensity, INTENSITY_SCALE);
  assert.equal(POSTGAME_SCALES.energy, ENERGY_SCALE);
});

test("requires the transition check-in only when the MVP vote is missing", () => {
  assert.equal(isCheckinRequired({
    hasVote: false,
    hasFeedback: false,
    isTransitionGame: true,
    isAfterRollout: false,
  }), true);
  assert.equal(isCheckinRequired({
    hasVote: true,
    hasFeedback: false,
    isTransitionGame: true,
    isAfterRollout: false,
  }), false);
});

test("requires post-rollout check-ins and excludes earlier games or feedback", () => {
  assert.equal(isCheckinRequired({
    hasVote: false,
    hasFeedback: false,
    isTransitionGame: false,
    isAfterRollout: true,
  }), true);
  assert.equal(isCheckinRequired({
    hasVote: false,
    hasFeedback: false,
    isTransitionGame: false,
    isAfterRollout: false,
    isBeforeRollout: true,
  }), false);
  assert.equal(isCheckinRequired({
    hasVote: false,
    hasFeedback: true,
    isTransitionGame: false,
    isAfterRollout: true,
  }), false);
});

test("sorts pending check-ins by oldest date and then deterministic ID", () => {
  const pending = [
    { id: "b", date: "2026-09-08" },
    { id: "z", date: "2026-09-01" },
    { id: "a", date: "2026-09-01" },
  ];
  const sorted = sortPendingCheckins(pending);

  assert.deepEqual(sorted.map((item) => item.id), ["a", "z", "b"]);
  assert.deepEqual(pending.map((item) => item.id), ["b", "z", "a"]);
});

test("uses ID tie-break when equivalent timestamps use different formats", () => {
  const sorted = sortPendingCheckins([
    { id: "b", date: "2026-09-01T10:00:00Z" },
    { id: "a", date: "2026-09-01T10:00:00.000Z" },
  ]);

  assert.deepEqual(sorted.map((item) => item.id), ["a", "b"]);
});
