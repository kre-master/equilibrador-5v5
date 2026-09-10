import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import monthly from "../monthly-recap.js";

test("five and six-player squads use the approved active minutes", () => {
  assert.equal(monthly.activeMinutesForSquad(5), 50);
  assert.equal(monthly.activeMinutesForSquad(6), 50 * 5 / 6);
  assert.equal(monthly.activeMinutesForSquad(7), 50 * 5 / 7);
});

test("intensity maps from 5 to 10 MET and old games use 7 MET", () => {
  assert.equal(monthly.metForIntensity(1), 5);
  assert.equal(monthly.metForIntensity(10), 10);
  assert.equal(monthly.metForIntensity(null), 7);
  assert.equal(monthly.estimateCalories({ weightKg: 75, minutes: 50, met: 7 }), 438);
});

test("perceived averages stay absent when there are no answers", () => {
  assert.equal(monthly.average([]), null);
  assert.equal(monthly.average([6, 8]), 7);
});

test("private weight policies never grant admin visibility", () => {
  const sql = readFileSync(new URL("../supabase/monthly-recap-migration.sql", import.meta.url), "utf8");
  assert.match(sql, /enable row level security/i);
  assert.match(sql, /user_id\s*=\s*\(select auth\.uid\(\)\)/i);
  assert.doesNotMatch(sql, /is_admin/i);
  assert.doesNotMatch(sql, /grant\s+update|grant\s+delete/i);
});

test("active minutes account for five places in each squad", () => {
  assert.equal(monthly.activeMinutesForSquad(5), 50);
  assert.equal(monthly.activeMinutesForSquad(6), 50 * 5 / 6);
  assert.equal(monthly.activeMinutesForSquad(7), 50 * 5 / 7);
});

test("MET interpolates intensity and defaults old games to seven", () => {
  assert.equal(monthly.metForIntensity(1), 5);
  assert.equal(monthly.metForIntensity(10), 10);
  assert.equal(monthly.metForIntensity(null), 7);
});

test("calories use MET, private weight and active minutes", () => {
  assert.equal(monthly.estimateCalories({ weightKg: 75, minutes: 50, met: 7 }), 438);
});

test("perceived averages stay absent when there are no answers", () => {
  assert.equal(monthly.average([]), null);
  assert.equal(monthly.average([4, 8]), 6);
});
