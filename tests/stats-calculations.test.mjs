import test from "node:test";
import assert from "node:assert/strict";

import stats from "../stats-calculations.js";

const { buildCombinationRanking, summarizePlayerGoals } = stats;

test("trios require at least three games", () => {
  const twoGames = [
    { playerIds: ["c", "a", "b"], outcome: "win", winMargin: 2 },
    { playerIds: ["b", "c", "a"], outcome: "loss", winMargin: 0 },
  ];

  assert.deepEqual(buildCombinationRanking(twoGames, 3, 3, 5), []);

  const ranking = buildCombinationRanking(
    [...twoGames, { playerIds: ["a", "b", "c"], outcome: "draw", winMargin: 0 }],
    3,
    3,
    5
  );

  assert.equal(ranking.length, 1);
  assert.deepEqual(ranking[0].playerIds, ["a", "b", "c"]);
});

test("a three-game trio reports its complete record", () => {
  const ranking = buildCombinationRanking(
    [
      { playerIds: ["a", "b", "c"], outcome: "win", winMargin: 3 },
      { playerIds: ["a", "b", "c"], outcome: "loss", winMargin: 0 },
      { playerIds: ["a", "b", "c"], outcome: "win", winMargin: 1 },
    ],
    3,
    3,
    5
  );

  assert.deepEqual(ranking[0], {
    playerIds: ["a", "b", "c"],
    gamesTogether: 3,
    wins: 2,
    draws: 0,
    losses: 1,
    winMarginTotal: 4,
    winRate: 67,
    score: 2 * 12 + 4 * 2 + 3 + 2 / 3,
  });
});

test("summarizePlayerGoals totals appearances and goals", () => {
  const summary = summarizePlayerGoals([
    { playerId: "a", goalsFor: 10, goalsAgainst: 7 },
    { playerId: "a", goalsFor: 8, goalsAgainst: 3 },
  ]);

  assert.deepEqual(summary, {
    appearances: 2,
    goalsFor: 18,
    goalsAgainst: 10,
    averageGoalsFor: 9,
    averageGoalsAgainst: 5,
  });
});

test("ranking resolves a score tie by wins", () => {
  const performances = [
    { playerIds: ["winner"], outcome: "win", winMargin: 0 },
    ...Array.from({ length: 14 }, () => ({
      playerIds: ["regular"],
      outcome: "loss",
      winMargin: 0,
    })),
  ];

  const ranking = buildCombinationRanking(performances, 1, 1, 2);

  assert.equal(ranking[0].score, ranking[1].score);
  assert.deepEqual(
    ranking.map((item) => item.playerIds[0]),
    ["winner", "regular"]
  );
});

test("ranking prefers the larger win-margin total after equal wins", () => {
  const ranking = buildCombinationRanking(
    [
      { playerIds: ["small-margin"], outcome: "win", winMargin: 1 },
      { playerIds: ["large-margin"], outcome: "win", winMargin: 3 },
    ],
    1,
    1,
    2
  );

  assert.deepEqual(
    ranking.map((item) => item.playerIds[0]),
    ["large-margin", "small-margin"]
  );
});

test("ranking prefers more games together after equal wins and margin", () => {
  const ranking = buildCombinationRanking(
    [
      { playerIds: ["fewer-games"], outcome: "win", winMargin: 1 },
      { playerIds: ["more-games"], outcome: "win", winMargin: 1 },
      { playerIds: ["more-games"], outcome: "draw", winMargin: 0 },
    ],
    1,
    1,
    2
  );

  assert.deepEqual(
    ranking.map((item) => item.playerIds[0]),
    ["more-games", "fewer-games"]
  );
});

test("ranking uses alphabetical player names as the final tie-break", () => {
  const names = new Map([
    ["z-id", "Ana"],
    ["a-id", "Beatriz"],
  ]);
  const ranking = buildCombinationRanking(
    [
      { playerIds: ["a-id"], outcome: "draw", winMargin: 0 },
      { playerIds: ["z-id"], outcome: "draw", winMargin: 0 },
    ],
    1,
    1,
    2,
    (playerId) => names.get(playerId)
  );

  assert.deepEqual(
    ranking.map((item) => item.playerIds[0]),
    ["z-id", "a-id"]
  );
});

test("goal averages retain exact precision before display rounding", () => {
  const summary = summarizePlayerGoals([
    { playerId: "a", goalsFor: 2, goalsAgainst: 1 },
    { playerId: "a", goalsFor: 2, goalsAgainst: 1 },
    { playerId: "a", goalsFor: 1, goalsAgainst: 1 },
  ]);

  assert.equal(summary.averageGoalsFor, 5 / 3);
  assert.equal(summary.averageGoalsAgainst, 1);
});
