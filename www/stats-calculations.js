(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.FooterStats = factory();
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  function summarizePlayerGoals(performances) {
    const rows = Array.isArray(performances) ? performances : [];
    const goalsFor = rows.reduce((sum, row) => sum + Number(row.goalsFor || 0), 0);
    const goalsAgainst = rows.reduce((sum, row) => sum + Number(row.goalsAgainst || 0), 0);
    const appearances = rows.length;
    return { appearances, goalsFor, goalsAgainst, goalsForAverage: appearances ? goalsFor / appearances : 0, goalsAgainstAverage: appearances ? goalsAgainst / appearances : 0 };
  }
  function countLeadingAbsences(record) { let count = 0; for (const item of (record || [])) { if (item === "absent") count += 1; else break; } return count; }
  function isGoalAverageEligible({ appearances = 0, recentAbsences = 0, minimumGames = 5, maximumAbsences = 5 } = {}) { return appearances >= minimumGames && recentAbsences <= maximumAbsences; }
  function sortGoalsForAverage(a, b, getName = (row) => row.name || "") { return b.goalsForAverage - a.goalsForAverage || b.goalsFor - a.goalsFor || b.appearances - a.appearances || getName(a).localeCompare(getName(b)); }
  function sortGoalsAgainstAverage(a, b, getName = (row) => row.name || "") { return a.goalsAgainstAverage - b.goalsAgainstAverage || a.goalsAgainst - b.goalsAgainst || b.appearances - a.appearances || getName(a).localeCompare(getName(b)); }
  return { summarizePlayerGoals, countLeadingAbsences, isGoalAverageEligible, sortGoalsForAverage, sortGoalsAgainstAverage };
});
