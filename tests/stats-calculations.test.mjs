import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const stats = require("../stats-calculations.js");
test("summarizes goals and averages", () => assert.deepEqual(stats.summarizePlayerGoals([{ goalsFor: 10, goalsAgainst: 7 }, { goalsFor: 8, goalsAgainst: 3 }]), { appearances: 2, goalsFor: 18, goalsAgainst: 10, goalsForAverage: 9, goalsAgainstAverage: 5 }));
test("requires five games and no more than five absences", () => { assert.equal(stats.isGoalAverageEligible({ appearances: 4, recentAbsences: 0 }), false); assert.equal(stats.isGoalAverageEligible({ appearances: 5, recentAbsences: 5 }), true); assert.equal(stats.isGoalAverageEligible({ appearances: 5, recentAbsences: 6 }), false); });
test("counts only leading absences", () => { assert.equal(stats.countLeadingAbsences(["absent", "absent", "win"]), 2); assert.equal(stats.countLeadingAbsences(["win", "absent"]), 0); });
