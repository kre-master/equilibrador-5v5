(function exposeStats(root, factory) {
  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  if (root) {
    root.FooterStats = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function createStatsApi() {
  function combinations(items, size) {
    const result = [];

    function collect(start, selected) {
      if (selected.length === size) {
        result.push(selected);
        return;
      }

      for (let index = start; index <= items.length - (size - selected.length); index += 1) {
        collect(index + 1, [...selected, items[index]]);
      }
    }

    collect(0, []);
    return result;
  }

  function buildCombinationRanking(
    teamPerformances,
    groupSize,
    minimumGames,
    limit,
    getPlayerName = (playerId) => playerId
  ) {
    if (!Number.isInteger(groupSize) || groupSize < 1) return [];

    const byCombination = new Map();

    (teamPerformances || []).forEach((performance) => {
      const playerIds = [...new Set(performance.playerIds || [])].sort();

      combinations(playerIds, groupSize).forEach((combinationIds) => {
        const key = JSON.stringify(combinationIds);
        const stats = byCombination.get(key) || {
          playerIds: combinationIds,
          gamesTogether: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          winMarginTotal: 0,
        };

        stats.gamesTogether += 1;
        if (performance.outcome === "win") {
          stats.wins += 1;
          stats.winMarginTotal += Number(performance.winMargin) || 0;
        } else if (performance.outcome === "draw") {
          stats.draws += 1;
        } else if (performance.outcome === "loss") {
          stats.losses += 1;
        }

        byCombination.set(key, stats);
      });
    });

    const ranking = [...byCombination.values()]
      .filter((stats) => stats.gamesTogether >= minimumGames)
      .map((stats) => ({
        ...stats,
        winRate: Math.round((stats.wins / stats.gamesTogether) * 100),
        score:
          stats.wins * 12 +
          stats.winMarginTotal * 2 +
          stats.gamesTogether +
          stats.wins / stats.gamesTogether,
      }))
      .sort((a, b) => {
        const numericDifference =
          b.score - a.score ||
          b.wins - a.wins ||
          b.winMarginTotal - a.winMarginTotal ||
          b.gamesTogether - a.gamesTogether;

        if (numericDifference) return numericDifference;

        const aNames = a.playerIds.map((id) => String(getPlayerName(id) ?? id)).sort();
        const bNames = b.playerIds.map((id) => String(getPlayerName(id) ?? id)).sort();
        return aNames.join("\u0000").localeCompare(bNames.join("\u0000"));
      });

    return Number.isInteger(limit) ? ranking.slice(0, Math.max(0, limit)) : ranking;
  }

  function summarizePlayerGoals(playerPerformances) {
    const summary = (playerPerformances || []).reduce(
      (totals, performance) => ({
        appearances: totals.appearances + 1,
        goalsFor: totals.goalsFor + (Number(performance.goalsFor) || 0),
        goalsAgainst: totals.goalsAgainst + (Number(performance.goalsAgainst) || 0),
      }),
      { appearances: 0, goalsFor: 0, goalsAgainst: 0 }
    );

    return {
      ...summary,
      averageGoalsFor: summary.appearances ? summary.goalsFor / summary.appearances : 0,
      averageGoalsAgainst: summary.appearances ? summary.goalsAgainst / summary.appearances : 0,
    };
  }

  return {
    buildCombinationRanking,
    summarizePlayerGoals,
  };
});
