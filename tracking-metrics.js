(function exposeTracking(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.FooterTracking = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createTrackingApi() {
  // Local test of video tracking metrics (claude/tracking-teste, 2026-10-10).
  // Results of the tracker (footer.tracking-result.v1) are imported by file and kept only in this
  // browser; nothing is sent to Supabase. Labels from the video are linked to players.id by a person,
  // with the name only used to pre-fill the choice.
  const STORAGE_KEY = "footer-tracking-test-v1";
  const SCHEMA = "footer.tracking-result.v1";
  const MIN_MINUTES_FOR_HIGHLIGHT = 10;

  function normalizeLabel(value) {
    return String(value ?? "")
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();
  }

  function finite(value) {
    return typeof value === "number" && Number.isFinite(value) ? value : null;
  }

  function parseResult(text) {
    let data;
    try {
      data = typeof text === "string" ? JSON.parse(text) : text;
    } catch {
      throw new Error("O ficheiro não é JSON válido.");
    }
    if (!data || data.schema_version !== SCHEMA) throw new Error(`Esperava um ficheiro ${SCHEMA}.`);
    if (!Array.isArray(data.players) || !data.players.length) throw new Error("O ficheiro não tem jogadores.");
    const players = data.players.map((p) => {
      const m = p.metrics || {};
      const time = m.time || {};
      if (!p.label && !p.player_id) throw new Error("Há um jogador sem nome nem ID no ficheiro.");
      const heat = m.heatmap && Array.isArray(m.heatmap.values_row_major) ? m.heatmap : null;
      return {
        label: String(p.label || p.player_id),
        playerId: p.player_id ? String(p.player_id) : null,
        team: p.team || null,
        identityStatus: p.identity_status || "proposed",
        automaticSharePct: finite(p.quality?.automatic_identity_share_pct),
        eligibleForAwards: p.quality?.eligible_for_awards === true,
        validMinutes: finite(time.valid_position_time_s) == null ? null : time.valid_position_time_s / 60,
        distanceM: finite(m.distance_observed_m),
        metersPerMin: finite(m.distance_per_valid_min_m),
        meanSpeedKmh: finite(m.mean_speed_kmh),
        maxSustainedKmh: finite(m.max_speed_sustained_kmh),
        maxSustainedAtS: Array.isArray(m.max_speed_sustained_interval_s) ? m.max_speed_sustained_interval_s[0] : null,
        p95Kmh: finite(m.speed_p95_kmh),
        above15M: finite(m.distance_above_15_kmh_m),
        sprints: finite(m.sprint?.count),
        highRuns: finite(m.high_intensity_runs?.count),
        bandTimeS: Array.isArray(m.speed_band_time_s) ? m.speed_band_time_s.map(Number) : null,
        zoneSharePct: m.zone_share_pct || null,
        goalkeeperMin: finite(m.goalkeeper_time_s) == null ? null : m.goalkeeper_time_s / 60,
        lateRatio: finite(m.late_activity_ratio),
        periodMetersPerMin: Array.isArray(m.period_metrics) ? m.period_metrics.map((t) => finite(t.m_per_min)) : null,
        heatmap: heat ? { rows: heat.rows_y, cols: heat.cols_x, values: heat.values_row_major.map(Number) } : null,
      };
    });
    const closest = data.closest_opponents || {};
    const pairs = Array.isArray(data.teammate_pairs) ? data.teammate_pairs : [];
    players.forEach((p) => {
      const c = (closest[p.label] || [])[0];
      p.rival = c ? { label: c.opponent, seconds: c.seconds_within_3m } : null;
      const mine = pairs.filter((x) => x.a === p.label || x.b === p.label).sort((x, y) => y.share_within_5m_pct - x.share_within_5m_pct)[0];
      p.partner = mine ? { label: mine.a === p.label ? mine.b : mine.a, sharePct: mine.share_within_5m_pct } : null;
    });
    const teams = {};
    Object.entries(data.teams || {}).forEach(([key, t]) => {
      teams[key] = {
        widthM: finite(t.team_width_m),
        depthM: finite(t.team_depth_m),
        compactnessM: finite(t.team_compactness_m),
        fromOwnGoalM: finite(t.centroid_distance_from_own_goal_m),
        attackingHalfPct: finite(t.territory_attacking_half_pct),
        perMinute: Array.isArray(t.per_minute) ? t.per_minute.map((r) => ({ minute: r.minute, fromOwnGoalM: r.centroid_from_own_goal_m, seconds: r.seconds })) : [],
      };
    });
    return {
      schema: SCHEMA,
      test: data.test === true || data.status !== "published",
      label: data.game_label || data.game_id || "jogo analisado",
      runId: data.run_id || null,
      createdAt: data.created_at || null,
      pitch: data.calibration ? { lengthM: data.calibration.length_m, widthM: data.calibration.width_m } : null,
      players,
      teams,
    };
  }

  function proposeMapping(labels, players) {
    const byName = new Map();
    (players || []).forEach((p) => {
      const key = normalizeLabel(p.name);
      if (!byName.has(key)) byName.set(key, []);
      byName.get(key).push(p.id);
    });
    const mapping = {};
    labels.forEach((label) => {
      const ids = byName.get(normalizeLabel(label)) || [];
      mapping[label] = ids.length === 1 ? ids[0] : null;
    });
    return mapping;
  }

  function mappingProblems(mapping) {
    const seen = new Map();
    const duplicates = [];
    Object.entries(mapping || {}).forEach(([label, id]) => {
      if (!id) return;
      if (seen.has(id)) duplicates.push([seen.get(id), label]);
      else seen.set(id, label);
    });
    const unmapped = Object.entries(mapping || {}).filter(([, id]) => !id).map(([label]) => label);
    return { duplicates, unmapped };
  }

  function eligibleForHighlights(p) {
    return (p.validMinutes ?? 0) >= MIN_MINUTES_FOR_HIGHLIGHT && (p.goalkeeperMin ?? 0) < (p.validMinutes ?? 0) / 2;
  }

  function topBy(players, key, filter = () => true) {
    const rows = players.filter((p) => finite(p[key]) != null && filter(p));
    if (!rows.length) return null;
    const best = Math.max(...rows.map((p) => p[key]));
    return { value: best, labels: rows.filter((p) => p[key] === best).map((p) => p.label) };
  }

  function gameHighlights(result) {
    const players = result.players;
    const keeper = players.filter((p) => (p.goalkeeperMin ?? 0) >= 3).sort((a, b) => b.goalkeeperMin - a.goalkeeperMin);
    return {
      motor: topBy(players, "metersPerMin", eligibleForHighlights),
      lightning: topBy(players, "maxSustainedKmh", eligibleForHighlights),
      sprinter: topBy(players, "sprints", eligibleForHighlights),
      distance: topBy(players, "distanceM", eligibleForHighlights),
      keepers: keeper.map((p) => ({ label: p.label, minutes: p.goalkeeperMin })),
    };
  }

  function teamHeatmap(result, team) {
    const maps = result.players.filter((p) => p.team === team && p.heatmap);
    if (!maps.length) return null;
    const { rows, cols } = maps[0].heatmap;
    const values = new Array(rows * cols).fill(0);
    maps.forEach((p) => {
      if (p.heatmap.rows !== rows || p.heatmap.cols !== cols) return;
      p.heatmap.values.forEach((v, i) => { values[i] += v; });
    });
    return { rows, cols, values };
  }

  function roleLabel(p) {
    if ((p.goalkeeperMin ?? 0) >= (p.validMinutes ?? 0) / 2) return "Guarda-redes";
    const z = p.zoneSharePct;
    if (!z) return null;
    if ((z.defensiva ?? 0) >= 50) return "Mais atrás";
    if ((z.ofensiva ?? 0) >= 35) return "Mais à frente";
    return "Box-to-box";
  }

  function speedBands(p) {
    if (!p.bandTimeS) return null;
    const total = p.bandTimeS.reduce((a, b) => a + b, 0);
    if (!total) return null;
    const names = ["Parado/andar", "Trote", "Corrida", "Rápido", "Sprint"];
    return p.bandTimeS.map((s, i) => ({ name: names[i], pct: (100 * s) / total }));
  }

  function rankIn(players, label, key) {
    const rows = players.filter((p) => finite(p[key]) != null).sort((a, b) => b[key] - a[key]);
    const i = rows.findIndex((p) => p.label === label);
    return i < 0 ? null : { position: i + 1, of: rows.length };
  }

  function loadStore(storage) {
    try {
      const raw = storage?.getItem(STORAGE_KEY);
      const data = raw ? JSON.parse(raw) : {};
      return data && typeof data === "object" ? data : {};
    } catch {
      return {};
    }
  }

  function saveStore(storage, data) {
    try {
      storage?.setItem(STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch {
      return false;
    }
  }

  return {
    STORAGE_KEY, SCHEMA, MIN_MINUTES_FOR_HIGHLIGHT,
    normalizeLabel, parseResult, proposeMapping, mappingProblems, gameHighlights, teamHeatmap, roleLabel, speedBands, rankIn,
    loadStore, saveStore,
  };
});
