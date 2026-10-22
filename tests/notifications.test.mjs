import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const N = require("../notifications.js");

test("feed is newest first, drops future and invalid dates", () => {
  const now = Date.parse("2026-10-22T12:00:00Z");
  const feed = N.buildFeed([
    { id: "a", at: "2026-10-20T10:00:00Z" },
    { id: "b", at: "2026-10-21T10:00:00Z" },
    { id: "future", at: "2026-10-23T10:00:00Z" },
    { id: "bad", at: "nope" },
  ], now);
  assert.deepEqual(feed.map((item) => item.id), ["b", "a"]);
});

test("unseen count only includes items after seenAt", () => {
  const feed = [{ at: "2026-10-21T10:00:00Z" }, { at: "2026-10-19T10:00:00Z" }];
  assert.equal(N.countUnseen(feed, "2026-10-20T00:00:00Z"), 1);
  assert.equal(N.countUnseen(feed, "2026-10-22T00:00:00Z"), 0);
  assert.equal(N.countUnseen(feed, null), 2);
});

test("first run looks back one week", () => {
  const now = Date.parse("2026-10-22T00:00:00Z");
  assert.equal(N.defaultSeenAt(now), "2026-10-15T00:00:00.000Z");
});

test("versions compare numerically", () => {
  assert.ok(N.compareVersions("1.10.0", "1.9.3") > 0);
  assert.equal(N.compareVersions("1.0.0", "1.0"), 0);
  assert.ok(N.compareVersions("0.9.9", "1.0.0") < 0);
});

test("unseen releases: current on first run, newer ones afterwards", () => {
  const changelog = [{ version: "1.2.0" }, { version: "1.1.0" }, { version: "1.0.0" }];
  assert.deepEqual(N.unseenReleases(null, changelog).map((r) => r.version), ["1.2.0"]);
  assert.deepEqual(N.unseenReleases("1.0.0", changelog).map((r) => r.version), ["1.2.0", "1.1.0"]);
  assert.deepEqual(N.unseenReleases("1.2.0", changelog), []);
  assert.equal(N.APP_VERSION, N.CHANGELOG[0].version);
});
