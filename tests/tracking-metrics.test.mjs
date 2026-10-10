import test from "node:test";
import assert from "node:assert/strict";
import tracking from "../tracking-metrics.js";

function sample() {
  const player = (label, team, extra = {}) => ({
    player_id: null, label, team, identity_status: "proposed",
    quality: { automatic_identity_share_pct: 50, eligible_for_awards: false },
    metrics: {
      time: { valid_position_time_s: 1200, valid_speed_time_s: 1100 },
      distance_observed_m: 1600, distance_per_valid_min_m: 80, mean_speed_kmh: 4.8,
      max_speed_sustained_kmh: 22, max_speed_sustained_interval_s: [100, 101], speed_p95_kmh: 12,
      distance_above_15_kmh_m: 120, speed_band_time_s: [500, 300, 200, 80, 20],
      sprint: { count: 2 }, high_intensity_runs: { count: 9 }, goalkeeper_time_s: 0,
      zone_share_pct: { defensiva: 30, media: 40, ofensiva: 30 }, late_activity_ratio: 0.9,
      period_metrics: [{ m_per_min: 85 }, { m_per_min: 80 }, { m_per_min: 76 }],
      heatmap: { rows_y: 2, cols_x: 2, values_row_major: [1, 2, 3, 4] },
      ...extra,
    },
  });
  return {
    schema_version: "footer.tracking-result.v1", status: "needs_review", test: true, game_label: "jogo de teste",
    players: [
      player("Zé", "A"),
      player("MARQUES", "A", { distance_per_valid_min_m: 90, max_speed_sustained_kmh: 27 }),
      player("MIGO", "A", { distance_per_valid_min_m: 95, goalkeeper_time_s: 900 }),
      player("CURTO", "B", { time: { valid_position_time_s: 300 }, distance_per_valid_min_m: 120 }),
    ],
    teams: { A: { team_width_m: 9, team_depth_m: 15, team_compactness_m: 6, centroid_distance_from_own_goal_m: 15, territory_attacking_half_pct: 24, per_minute: [] } },
    teammate_pairs: [{ a: "MARQUES", b: "Zé", seconds_together: 600, seconds_within_5m: 120, share_within_5m_pct: 20 }],
    closest_opponents: { "Zé": [{ opponent: "CURTO", seconds_within_3m: 90 }] },
  };
}

test("rejects files that are not tracker results", () => {
  assert.throws(() => tracking.parseResult("not json"), /JSON/);
  assert.throws(() => tracking.parseResult({ schema_version: "other" }), /footer\.tracking-result\.v1/);
  assert.throws(() => tracking.parseResult({ schema_version: "footer.tracking-result.v1", players: [] }), /jogadores/);
});

test("parses metrics, partner and rival without inventing values", () => {
  const r = tracking.parseResult(JSON.stringify(sample()));
  const ze = r.players.find((p) => p.label === "Zé");
  assert.equal(ze.validMinutes, 20);
  assert.equal(ze.partner.label, "MARQUES");
  assert.equal(ze.rival.label, "CURTO");
  assert.equal(r.players.find((p) => p.label === "MIGO").rival, null);
  assert.equal(r.test, true);
});

test("names only pre-fill the mapping, and ambiguous names stay unmapped", () => {
  const players = [{ id: "p1", name: "Ze" }, { id: "p2", name: "Marques" }, { id: "p3", name: "Migo" }, { id: "p4", name: "migo" }];
  const mapping = tracking.proposeMapping(["Zé", "MARQUES", "MIGO", "CURTO"], players);
  assert.deepEqual(mapping, { "Zé": "p1", MARQUES: "p2", MIGO: null, CURTO: null });
  const problems = tracking.mappingProblems({ a: "p1", b: "p1", c: null });
  assert.deepEqual(problems.duplicates, [["a", "b"]]);
  assert.deepEqual(problems.unmapped, ["c"]);
});

test("highlights skip goalkeepers and short appearances", () => {
  const h = tracking.gameHighlights(tracking.parseResult(sample()));
  assert.deepEqual(h.motor.labels, ["MARQUES"]);
  assert.deepEqual(h.lightning.labels, ["MARQUES"]);
  assert.equal(h.keepers[0].label, "MIGO");
});

test("speed bands add up to 100 % and roles follow the zones", () => {
  const r = tracking.parseResult(sample());
  const bands = tracking.speedBands(r.players[0]);
  assert.equal(Math.round(bands.reduce((a, b) => a + b.pct, 0)), 100);
  assert.equal(tracking.roleLabel(r.players.find((p) => p.label === "MIGO")), "Guarda-redes");
  assert.equal(tracking.roleLabel(r.players[0]), "Box-to-box");
});

test("storage failures never throw", () => {
  const broken = { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("full"); } };
  assert.deepEqual(tracking.loadStore(broken), {});
  assert.equal(tracking.saveStore(broken, { a: 1 }), false);
});

test("team heatmap sums the dwell time of the team's players", () => {
  const r = tracking.parseResult(sample());
  assert.deepEqual(tracking.teamHeatmap(r, "A").values, [3, 6, 9, 12]);
  assert.equal(tracking.teamHeatmap(r, "C"), null);
});
